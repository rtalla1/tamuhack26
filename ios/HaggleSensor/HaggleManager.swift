import Foundation
import SwiftUI

#if canImport(SocketIO)
import SocketIO
#endif

#if canImport(SmartSpectraSwiftSDK)
import SmartSpectraSwiftSDK
#endif

final class HaggleManager: ObservableObject {
    // MARK: - Public state (UI)
    @Published var sessionId: String = ""
    @Published var isConnected: Bool = false
    @Published var incomingSessionId: String? = nil

    @Published var heartRate: Double = 0
    @Published var breathingRate: Double = 0
    @Published var stressScore: Int = 50
    @Published var confidence: Double = 0
    
    // Additional metrics from Presage
    @Published var breathingAmplitude: Double = 0
    @Published var isTalking: Bool = false
    @Published var isBlinking: Bool = false

    @Published var isBaselineBuilding: Bool = true
    @Published var baselineProgressText: String = "0s / \(Int(HaggleConfig.baselineDuration))s"
    private var lastCalibrationState: Bool = true // Track to send updates on change
    private var lastCalibrationUpdateTime: TimeInterval = 0 // Throttle updates

    // MARK: - Socket.IO
#if canImport(SocketIO)
    private var socketManager: SocketManager?
    private var socket: SocketIOClient?
#endif
    private var serverURL: URL?
    private var joinedSessionRoom = false

    // MARK: - Measurement
    private var transmitTimer: Timer?

#if canImport(SmartSpectraSwiftSDK)
    private weak var sdk: SmartSpectraSwiftSDK?
#endif

    // MARK: - Baseline + stress algorithm
    private struct Sample {
        let t: TimeInterval
        let hr: Double
        let br: Double
        let confidence: Double
    }

    private var baselineStartAt: TimeInterval?
    private var baselineSamples: [Sample] = []
    private var baselineHR: Double?
    private var baselineBR: Double?

    // MARK: - Deep link handling
    /// Called by the app when opened via `haggle://...`
    func handleIncomingURL(_ url: URL) {
        guard url.scheme?.lowercased() == "haggle" else { return }
        let raw = url.absoluteString
        if let parsed = SessionLinkParser.parseSessionId(from: raw) {
            DispatchQueue.main.async {
                self.incomingSessionId = parsed
            }
        }
    }

    // MARK: - Public API
    func connect(sessionId: String, serverURL: URL) {
        disconnect(resetSession: false)

        incomingSessionId = nil
        self.sessionId = sessionId
        self.serverURL = serverURL
        self.joinedSessionRoom = false

        resetBaseline()

        // Important: the web app’s Socket.IO server is created lazily.
        // Hitting /api/biometrics once helps ensure it is initialized before we attempt the WS upgrade.
        bootstrapBiometricsEndpoint(baseURL: serverURL)

#if canImport(SocketIO)
        let mgr = SocketManager(
            socketURL: serverURL,
            config: [
                .log(true),
                .compress,
                .path(HaggleConfig.socketPath),
                .reconnects(true),
                .reconnectAttempts(-1),
                .reconnectWait(1),
                .reconnectWaitMax(5),
                .forceWebsockets(true),
            ]
        )
        self.socketManager = mgr
        let sock = mgr.defaultSocket
        self.socket = sock

        sock.on(clientEvent: .connect) { [weak self] _, _ in
            guard let self else { return }
            DispatchQueue.main.async {
                self.isConnected = true
            }
            self.joinedSessionRoom = false
            sock.emit("ios-join-session", self.sessionId)
            // Treat "ios-join-session" as sufficient to begin streaming; `ios-connected` is an ack signal.
            self.joinedSessionRoom = true
        }
        
        // Listen for negotiation end event from server
        sock.on("negotiation-ended") { [weak self] _, _ in
            guard let self else { return }
            print("🏁 Negotiation ended - auto-disconnecting")
            DispatchQueue.main.async {
                self.disconnect()
            }
        }

        sock.on("ios-connected") { [weak self] _, _ in
            guard let self else { return }
            self.joinedSessionRoom = true
            print("✅ iOS connected - sending initial calibration status")
            // Send initial calibration status immediately and again after a short delay
            self.sendCalibrationUpdate(force: true)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.sendCalibrationUpdate(force: true)
            }
        }

        sock.on(clientEvent: .disconnect) { [weak self] _, _ in
            guard let self else { return }
            DispatchQueue.main.async {
                self.isConnected = false
            }
            self.joinedSessionRoom = false
        }

        sock.on(clientEvent: .error) { [weak self] data, _ in
            guard let self else { return }
            // Keep a soft signal for UI.
            DispatchQueue.main.async {
                self.isConnected = false
            }
            self.joinedSessionRoom = false
            if let first = data.first {
                print("Socket error:", first)
            }
        }

        sock.connect()
#else
        // If Socket.IO isn’t linked yet, we still allow UI to run.
        self.isConnected = false
        print("SocketIO dependency not linked. Add socket.io-client-swift in Xcode.")
#endif
    }

    /// Start reading vitals and transmitting them periodically.
    /// Pass the Presage SDK instance when available (see `MeasurementView`).
    func startMeasurement(sdk: Any?) {
#if canImport(SmartSpectraSwiftSDK)
        if let smartSdk = sdk as? SmartSpectraSwiftSDK {
            self.sdk = smartSdk
            print("✅ HaggleManager: SDK instance assigned")
        } else {
            print("⚠️ HaggleManager: No SDK instance provided")
        }
#endif
        startTransmitLoop()
    }

    func stopMeasurement() {
        transmitTimer?.invalidate()
        transmitTimer = nil
    }

    func disconnect() {
        disconnect(resetSession: true)
    }

    // MARK: - Internals
    private func disconnect(resetSession: Bool) {
        stopMeasurement()

#if canImport(SocketIO)
        socket?.disconnect()
        socket = nil
        socketManager = nil
#endif

        joinedSessionRoom = false
        isConnected = false

        if resetSession {
            sessionId = ""
            serverURL = nil
        }

        resetBaseline()
    }

    private func bootstrapBiometricsEndpoint(baseURL: URL) {
        guard var comps = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else { return }
        comps.path = HaggleConfig.biometricsBootstrapPath
        guard let url = comps.url else { return }

        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.timeoutInterval = 5

        URLSession.shared.dataTask(with: req) { _, _, _ in
            // Intentionally ignore response; this is just to wake up the server route.
        }.resume()
    }

    private func startTransmitLoop() {
        transmitTimer?.invalidate()
        transmitTimer = Timer.scheduledTimer(withTimeInterval: HaggleConfig.transmitInterval, repeats: true) { [weak self] _ in
            self?.tick()
        }
        RunLoop.main.add(transmitTimer!, forMode: .common)
    }

    private func tick() {
        // Read vitals from Presage if present; otherwise keep last values.
        if let vitals = readVitals() {
            heartRate = vitals.hr
            breathingRate = vitals.br
            confidence = vitals.confidence
        } else {
            // If we have no data yet, keep UI stable at neutral.
            confidence = 0
        }

        updateBaselineAndStress()

        // Always send calibration updates when connected (regardless of data quality)
        if isConnected && joinedSessionRoom && !sessionId.isEmpty && isBaselineBuilding {
            sendCalibrationUpdate()
        }

        // Transmit biometric data only when connected and quality is acceptable.
        guard isConnected, joinedSessionRoom, !sessionId.isEmpty else { return }
        guard confidence >= HaggleConfig.minConfidenceToTransmit else { return }
        guard heartRate > 0, breathingRate > 0 else { return }

        sendBiometricUpdate()
    }

    private func readVitals() -> (hr: Double, br: Double, confidence: Double)? {
#if canImport(SmartSpectraSwiftSDK)
        guard let sdk else { return nil }
        guard let metrics = sdk.metricsBuffer else { return nil }

        guard let latestPulse = metrics.pulse.rate.last?.value else { return nil }
        guard let latestBreathing = metrics.breathing.rate.last?.value else { return nil }

        // Get confidence if available from the pulse data (convert Float to Double)
        let conf = Double(metrics.pulse.rate.last?.confidence ?? 1.0)
        
        // Extract additional metrics for enriched stress calculation
        if let amplitude = metrics.breathing.amplitude.last?.value {
            breathingAmplitude = Double(amplitude)
        }
        
        if let talking = metrics.face.talking.last {
            isTalking = talking.detected
        }
        
        if let blinking = metrics.face.blinking.last {
            isBlinking = blinking.detected
        }
        
        return (Double(latestPulse), Double(latestBreathing), conf)
#else
        return nil
#endif
    }

    private func resetBaseline() {
        baselineStartAt = nil
        baselineSamples = []
        baselineHR = nil
        baselineBR = nil
        stressScore = 50
        isBaselineBuilding = true
        baselineProgressText = "0s / \(Int(HaggleConfig.baselineDuration))s"
        print("🔄 Baseline reset - calibration will take \(Int(HaggleConfig.baselineDuration)) seconds")
    }

    private func updateBaselineAndStress() {
        let now = Date().timeIntervalSince1970
        let previousCalibrationState = isBaselineBuilding

        // Only collect baseline samples from "good" measurements.
        let isValid = heartRate > 0 && breathingRate > 0 && confidence >= HaggleConfig.minConfidenceToTransmit
        if isValid {
            if baselineStartAt == nil {
                baselineStartAt = now
            }
            baselineSamples.append(Sample(t: now, hr: heartRate, br: breathingRate, confidence: confidence))
            // Keep list bounded
            if baselineSamples.count > 200 { baselineSamples.removeFirst(baselineSamples.count - 200) }
        }

        // If we already have a baseline, compute stress from deviation.
        if let baseHR = baselineHR, let baseBR = baselineBR {
            isBaselineBuilding = false
            stressScore = computeStress(hr: heartRate, br: breathingRate, baselineHR: baseHR, baselineBR: baseBR)
            
            // Send calibration complete notification if state changed
            if previousCalibrationState != isBaselineBuilding {
                sendCalibrationUpdate(force: true)
            }
            return
        }

        // Otherwise, see if baseline window is complete.
        guard let start = baselineStartAt else {
            isBaselineBuilding = true
            baselineProgressText = "Waiting for valid data..."
            stressScore = 50
            
            // Send periodic updates
            sendCalibrationUpdate()
            return
        }

        let elapsed = max(0, now - start)
        baselineProgressText = "\(Int(elapsed))s / \(Int(HaggleConfig.baselineDuration))s"

        let hasEnoughTime = elapsed >= HaggleConfig.baselineDuration
        let hasEnoughSamples = baselineSamples.count >= HaggleConfig.baselineMinSamples

        isBaselineBuilding = !(hasEnoughTime || hasEnoughSamples)

        if hasEnoughTime || hasEnoughSamples {
            // Compute average baseline from collected samples.
            let hrs = baselineSamples.map(\.hr)
            let brs = baselineSamples.map(\.br)
            baselineHR = average(hrs)
            baselineBR = average(brs)
            stressScore = computeStress(hr: heartRate, br: breathingRate, baselineHR: baselineHR ?? heartRate, baselineBR: baselineBR ?? breathingRate)
            
            // Send calibration complete notification ALWAYS on first completion
            if previousCalibrationState != isBaselineBuilding {
                let completionReason = hasEnoughTime ? "time elapsed (\(Int(elapsed))s)" : "samples collected (\(baselineSamples.count))"
                print("🎉 Calibration COMPLETE! Reason: \(completionReason). Baseline: HR=\(Int(baselineHR ?? 0)) BR=\(Int(baselineBR ?? 0))")
                sendCalibrationUpdate(force: true)
                // Send twice to ensure delivery
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                    self.sendCalibrationUpdate(force: true)
                }
            }
        } else {
            // Keep neutral while calibrating.
            stressScore = 50
            
            // Send periodic progress updates (every second via tick)
            sendCalibrationUpdate()
        }
    }

    private func computeStress(hr: Double, br: Double, baselineHR: Double, baselineBR: Double) -> Int {
        guard baselineHR > 0, baselineBR > 0 else { return 50 }

        // Enhanced stress algorithm incorporating multiple biometric signals
        let hrDeviation = (hr - baselineHR) / baselineHR
        let brDeviation = (br - baselineBR) / baselineBR

        var stressFromHR = hrDeviation * 60.0
        var stressFromBR = brDeviation * 25.0
        
        // Factor in breathing amplitude (shallow breathing under stress)
        // Lower amplitude = higher stress
        if breathingAmplitude > 0 {
            let amplitudeStress = (1.0 - min(breathingAmplitude / 100.0, 1.0)) * 10.0
            stressFromBR += amplitudeStress
        }
        
        // Factor in talking (indicates engagement/composure)
        if isTalking {
            stressFromHR -= 5.0 // Slightly reduce stress when talking (shows confidence)
        }

        var stress = 50.0 + (stressFromHR + stressFromBR)
        stress = max(0, min(100, stress))
        return Int(stress.rounded())
    }

    private func sendBiometricUpdate() {
#if canImport(SocketIO)
        let payload: [String: Any] = [
            "sessionId": sessionId,
            "heartRate": heartRate,
            "breathingRate": breathingRate,
            "stressScore": stressScore,
            "confidence": confidence,
            "breathingAmplitude": breathingAmplitude,
            "isTalking": isTalking,
            "isBlinking": isBlinking,
            "timestamp": Date().timeIntervalSince1970 * 1000.0,
        ]
        socket?.emit("biometric-update", payload)
        print("📡 Transmitted: HR=\(Int(heartRate)) BR=\(Int(breathingRate)) Stress=\(stressScore) Amp=\(Int(breathingAmplitude))\(isTalking ? " 🗣️" : "")")
#endif
    }
    
    private func sendCalibrationUpdate(force: Bool = false) {
#if canImport(SocketIO)
        guard isConnected && joinedSessionRoom else { 
            if !isConnected {
                print("⚠️ Cannot send calibration update - not connected")
            }
            return 
        }
        
        let now = Date().timeIntervalSince1970
        
        // Throttle updates to every 2 seconds unless forced
        guard force || (now - lastCalibrationUpdateTime) >= 2.0 else { 
            if !force {
                print("⏭️ Skipping calibration update (throttled)")
            }
            return 
        }
        
        lastCalibrationUpdateTime = now
        
        let payload: [String: Any] = [
            "sessionId": sessionId,
            "isCalibrating": isBaselineBuilding,
            "progress": baselineProgressText,
            "timestamp": now * 1000.0,
        ]
        socket?.emit("calibration-update", payload)
        
        let statusIcon = isBaselineBuilding ? "⏳" : "✅"
        let statusText = isBaselineBuilding ? "In progress (\(baselineProgressText))" : "COMPLETE ✓"
        print("\(statusIcon) Sent calibration update: \(statusText)\(force ? " [FORCED]" : "")")
#endif
    }

    private func average(_ arr: [Double]) -> Double {
        guard !arr.isEmpty else { return 0 }
        return arr.reduce(0, +) / Double(arr.count)
    }
}

