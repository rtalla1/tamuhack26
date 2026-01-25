// Haggle iOS App - Simplified Template
// Based on Presage SmartSpectra SDK + Socket.IO

import SwiftUI
import SmartSpectraSwiftSDK
import SocketIO

struct ContentView: View {
    @StateObject private var haggleManager = HaggleManager()
    
    var body: some View {
        NavigationView {
            if haggleManager.sessionId.isEmpty {
                // Step 1: Scan QR code or enter session ID
                SessionInputView(haggleManager: haggleManager)
            } else {
                // Step 2: Show measurement screen
                MeasurementView(haggleManager: haggleManager)
            }
        }
    }
}

// MARK: - Session Input Screen
struct SessionInputView: View {
    @ObservedObject var haggleManager: HaggleManager
    @State private var manualSessionId = ""
    
    var body: some View {
        VStack(spacing: 30) {
            Text("Haggle Stress Monitor")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Connect to your negotiation session")
                .foregroundColor(.gray)
            
            // QR Code Scanner Button
            Button(action: {
                // TODO: Implement QR scanner
                // For now, use manual entry
            }) {
                VStack {
                    Image(systemName: "qrcode.viewfinder")
                        .font(.system(size: 60))
                    Text("Scan QR Code")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(16)
            }
            
            Text("or")
                .foregroundColor(.gray)
            
            // Manual Entry
            VStack(alignment: .leading, spacing: 8) {
                Text("Enter Session ID")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                TextField("abc-123-def-456", text: $manualSessionId)
                    .textFieldStyle(.roundedBorder)
                    .autocapitalization(.none)
                
                Button("Connect") {
                    haggleManager.connect(sessionId: manualSessionId)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(manualSessionId.isEmpty ? Color.gray : Color.green)
                .foregroundColor(.white)
                .cornerRadius(12)
                .disabled(manualSessionId.isEmpty)
            }
        }
        .padding()
    }
}

// MARK: - Measurement Screen
struct MeasurementView: View {
    @ObservedObject var haggleManager: HaggleManager
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared
    
    init(haggleManager: HaggleManager) {
        self.haggleManager = haggleManager
        
        // Configure Presage SDK
        sdk.setApiKey("YOUR_PRESAGE_API_KEY") // Replace with your key
        sdk.setSmartSpectraMode(.continuous)
        sdk.setCameraPosition(.front)
    }
    
    var body: some View {
        VStack(spacing: 20) {
            // Connection Status
            HStack {
                Circle()
                    .fill(haggleManager.isConnected ? Color.green : Color.red)
                    .frame(width: 12, height: 12)
                Text(haggleManager.isConnected ? "Connected to Haggle" : "Disconnected")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            // Presage Camera View
            SmartSpectraView()
                .frame(height: 300)
                .cornerRadius(20)
            
            // Current Vitals
            VStack(spacing: 16) {
                VitalRow(
                    icon: "heart.fill",
                    label: "Heart Rate",
                    value: "\(Int(haggleManager.heartRate)) bpm",
                    color: .red
                )
                
                VitalRow(
                    icon: "lungs.fill",
                    label: "Breathing",
                    value: "\(Int(haggleManager.breathingRate))/min",
                    color: .blue
                )
                
                VitalRow(
                    icon: "waveform.path.ecg",
                    label: "Stress Level",
                    value: "\(haggleManager.stressScore)%",
                    color: stressColor
                )
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(16)
            
            Spacer()
            
            // Disconnect Button
            Button("Disconnect") {
                haggleManager.disconnect()
            }
            .foregroundColor(.red)
        }
        .padding()
        .navigationBarHidden(true)
        .onAppear {
            haggleManager.startMeasurement(sdk: sdk)
        }
        .onDisappear {
            haggleManager.stopMeasurement()
        }
    }
    
    private var stressColor: Color {
        if haggleManager.stressScore > 70 {
            return .red
        } else if haggleManager.stressScore > 50 {
            return .orange
        } else {
            return .green
        }
    }
}

// MARK: - Vital Row Component
struct VitalRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title2)
            
            VStack(alignment: .leading) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(value)
                    .font(.title3)
                    .fontWeight(.bold)
            }
            
            Spacer()
        }
    }
}

// MARK: - Haggle Manager (Core Logic)
class HaggleManager: ObservableObject {
    @Published var sessionId: String = ""
    @Published var isConnected: Bool = false
    @Published var heartRate: Double = 0
    @Published var breathingRate: Double = 0
    @Published var stressScore: Int = 50
    
    private var socket: SocketIOClient?
    private var manager: SocketManager?
    
    // Baseline for stress calculation
    private var baselineHR: Double?
    private var baselineBR: Double?
    private var baselineSamples: [(hr: Double, br: Double)] = []
    
    func connect(sessionId: String) {
        self.sessionId = sessionId
        
        // Connect to Socket.IO server
        // CHANGE THIS URL for production deployment
        let serverURL = URL(string: "http://localhost:3000")!
        
        manager = SocketManager(
            socketURL: serverURL,
            config: [
                .log(true),
                .compress,
                .path("/api/biometrics/socket")
            ]
        )
        
        socket = manager?.defaultSocket
        
        socket?.on(clientEvent: .connect) { [weak self] data, ack in
            print("✅ Connected to Haggle server")
            self?.isConnected = true
            self?.socket?.emit("join-session", sessionId)
        }
        
        socket?.on("ios-connected") { [weak self] data, ack in
            print("📱 Successfully joined session")
        }
        
        socket?.on(clientEvent: .disconnect) { [weak self] data, ack in
            print("❌ Disconnected from server")
            self?.isConnected = false
        }
        
        socket?.connect()
    }
    
    func startMeasurement(sdk: SmartSpectraSwiftSDK) {
        // Start continuous measurement
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            guard let self = self, self.isConnected else {
                timer.invalidate()
                return
            }
            
            // Extract vitals from Presage SDK
            if let metrics = sdk.metricsBuffer {
                // Get latest pulse rate
                if let latestPulse = metrics.pulse.rate.last {
                    self.heartRate = Double(latestPulse.value)
                }
                
                // Get latest breathing rate
                if let latestBreathing = metrics.breathing.rate.last {
                    self.breathingRate = Double(latestBreathing.value)
                }
                
                // Calculate stress
                self.updateStress()
                
                // Send to server
                self.sendBiometricUpdate()
            }
        }
    }
    
    func stopMeasurement() {
        // SDK handles stopping internally
    }
    
    private func updateStress() {
        // Build baseline (first 10 samples)
        if baselineSamples.count < 10 {
            baselineSamples.append((hr: heartRate, br: breathingRate))
            
            if baselineSamples.count == 10 {
                baselineHR = baselineSamples.map { $0.hr }.reduce(0, +) / 10.0
                baselineBR = baselineSamples.map { $0.br }.reduce(0, +) / 10.0
                print("📊 Baseline set: HR=\(baselineHR!), BR=\(baselineBR!)")
            }
            return
        }
        
        // Calculate stress from deviation
        guard let baseHR = baselineHR, let baseBR = baselineBR else { return }
        
        let hrDeviation = (heartRate - baseHR) / baseHR
        let brDeviation = (breathingRate - baseBR) / baseBR
        
        let stressFromHR = hrDeviation * 70.0
        let stressFromBR = brDeviation * 30.0
        
        var stress = 50.0 + (stressFromHR + stressFromBR)
        stress = max(0, min(100, stress))
        
        self.stressScore = Int(stress.rounded())
    }
    
    private func sendBiometricUpdate() {
        let data: [String: Any] = [
            "sessionId": sessionId,
            "heartRate": heartRate,
            "breathingRate": breathingRate,
            "stressScore": stressScore,
            "confidence": 0.95,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        socket?.emit("biometric-update", data)
    }
    
    func disconnect() {
        socket?.disconnect()
        sessionId = ""
        isConnected = false
        
        // Reset baseline
        baselineHR = nil
        baselineBR = nil
        baselineSamples = []
    }
}
