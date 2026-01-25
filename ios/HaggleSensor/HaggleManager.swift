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

    @Published var isBaselineBuilding: Bool = true
    @Published var baselineProgressText: String = "0s / \(Int(HaggleConfig.baselineDuration))s"

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
            sock.emit("join-session", self.sessionId)
            // Treat "join-session" as sufficient to begin streaming; `ios-connected` is an ack signal.
            self.joinedSessionRoom = true
        }

        sock.on("ios-connected") { [weak self] _, _ in
            guard let self else { return }
            self.joinedSessionRoom = true
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
        self.sdk = sdk as? SmartSpectraSwiftSDK
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

        // Transmit only when connected and quality is acceptable.
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

        // Confidence/quality signals vary by SDK version. If unavailable, default to 1.0.
        // TODO: If your Presage SDK exposes confidence, map it here.
        let conf = 1.0
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
    }

    private func updateBaselineAndStress() {
        let now = Date().timeIntervalSince1970

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
            return
        }

        // Otherwise, see if baseline window is complete.
        guard let start = baselineStartAt else {
            isBaselineBuilding = true
            baselineProgressText = "0s / \(Int(HaggleConfig.baselineDuration))s"
            stressScore = 50
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
        } else {
            // Keep neutral while calibrating.
            stressScore = 50
        }
    }

    private func computeStress(hr: Double, br: Double, baselineHR: Double, baselineBR: Double) -> Int {
        guard baselineHR > 0, baselineBR > 0 else { return 50 }

        // Guide algorithm:
        // stress = 50 + (hrDeviation * 70 + brDeviation * 30)
        let hrDeviation = (hr - baselineHR) / baselineHR
        let brDeviation = (br - baselineBR) / baselineBR

        let stressFromHR = hrDeviation * 70.0
        let stressFromBR = brDeviation * 30.0

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
            "timestamp": Date().timeIntervalSince1970 * 1000.0,
        ]
        socket?.emit("biometric-update", payload)
#endif
    }

    private func average(_ arr: [Double]) -> Double {
        guard !arr.isEmpty else { return 0 }
        return arr.reduce(0, +) / Double(arr.count)
    }
}

