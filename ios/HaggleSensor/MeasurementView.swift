import SwiftUI
import AVFoundation

#if canImport(SmartSpectraSwiftSDK)
import SmartSpectraSwiftSDK
#endif

struct MeasurementView: View {
    @ObservedObject var haggleManager: HaggleManager
    @State private var debugTimer: Timer?

#if canImport(SmartSpectraSwiftSDK)
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared
    @ObservedObject var vitalsProcessor = SmartSpectraVitalsProcessor.shared
#endif

    init(haggleManager: HaggleManager) {
        self.haggleManager = haggleManager
    }

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(spacing: 16) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Biometric Source")
                                .font(.caption)
                                .foregroundColor(HaggleTheme.textSecondary)
                            Text(haggleManager.sessionId)
                                .font(HaggleTheme.monoFont(size: 10))
                                .foregroundColor(HaggleTheme.textSecondary.opacity(0.6))
                                .lineLimit(1)
                        }
                        Spacer()
                        
                        HStack(spacing: 6) {
                            Circle()
                                .fill(haggleManager.isConnected ? Color.green : Color.red)
                                .frame(width: 8, height: 8)
                            Text(haggleManager.isConnected ? "iPhone" : "Offline")
                                .font(.caption2)
                                .fontWeight(.medium)
                                .foregroundColor(haggleManager.isConnected ? Color.green : Color.red)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(haggleManager.isConnected ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                        .clipShape(Capsule())
                    }
                    .padding(.top, geometry.safeAreaInsets.top > 0 ? 20 : 40)
                    .padding(.horizontal, 20)
                    
                    // Status indicator for camera/data collection
#if canImport(SmartSpectraSwiftSDK)
                    HaggleCard {
                        HStack(spacing: 12) {
                            Image(systemName: "camera.fill")
                                .foregroundColor(HaggleTheme.textSecondary)
                                .font(.title3)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Biometric Monitoring")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(HaggleTheme.textPrimary)
                                
                                if let buffer = sdk.metricsBuffer, !buffer.pulse.rate.isEmpty {
                                    HStack(spacing: 4) {
                                        Circle()
                                            .fill(Color.green)
                                            .frame(width: 6, height: 6)
                                        Text("Camera active · Streaming data")
                                            .font(.caption2)
                                            .foregroundColor(Color.green)
                                    }
                                } else {
                                    HStack(spacing: 4) {
                                        ProgressView()
                                            .scaleEffect(0.7)
                                        Text("Initializing camera...")
                                            .font(.caption2)
                                            .foregroundColor(HaggleTheme.textSecondary)
                                    }
                                }
                            }
                            Spacer()
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20)
#endif

                    // Stress Level (matches web exactly)
                    HaggleCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Stress Level")
                                    .font(.caption)
                                    .foregroundColor(HaggleTheme.textSecondary)
                                Spacer()
                                Text(stressTrendLabel)
                                    .font(.caption2)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(stressTrendColor.opacity(0.2))
                                    .foregroundColor(stressTrendColor)
                                    .clipShape(Capsule())
                            }
                            
                            Text("\(haggleManager.stressScore)%")
                                .font(.system(size: 48, weight: .bold))
                                .foregroundColor(HaggleTheme.textPrimary)
                            
                            // Gradient progress bar
                            let progress = Double(haggleManager.stressScore) / 100.0
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color.white.opacity(0.1))
                                        .frame(height: 12)
                                    
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(
                                            LinearGradient(
                                                colors: [HaggleTheme.ok, HaggleTheme.warn, HaggleTheme.danger],
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                        .frame(width: geo.size.width * progress, height: 12)
                                }
                            }
                            .frame(height: 12)
                            
                                if haggleManager.isBaselineBuilding {
                                    HStack(spacing: 6) {
                                        ProgressView()
                                            .scaleEffect(0.7)
                                        Text("Calibrating · \(haggleManager.baselineProgressText)")
                                            .font(.caption2)
                                            .foregroundColor(HaggleTheme.textSecondary)
                                    }
                                } else {
                                    HStack(spacing: 6) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(HaggleTheme.ok)
                                            .font(.caption2)
                                        Text("Baseline established")
                                            .font(.caption2)
                                            .foregroundColor(HaggleTheme.ok)
                                    }
                                }
                        }
                        .padding(20)
                    }
                    .padding(.horizontal, 20)

                    // Your Vitals (matches web exactly)
                    HaggleCard {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Your Vitals")
                                .font(.caption)
                                .foregroundColor(HaggleTheme.textSecondary)
                            
                            // Heart Rate
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("Heart Rate")
                                        .font(.caption)
                                        .foregroundColor(HaggleTheme.textSecondary)
                                    Spacer()
                                    Text("\(Int(haggleManager.heartRate)) bpm")
                                        .font(HaggleTheme.monoFont(size: 13))
                                        .foregroundColor(HaggleTheme.textPrimary)
                                }
                                
                                GeometryReader { geo in
                                    ZStack(alignment: .leading) {
                                        RoundedRectangle(cornerRadius: 999)
                                            .fill(Color.white.opacity(0.1))
                                            .frame(height: 6)
                                        
                                        RoundedRectangle(cornerRadius: 999)
                                            .fill(Color.red)
                                            .frame(width: min(geo.size.width * (haggleManager.heartRate / 120.0), geo.size.width), height: 6)
                                    }
                                }
                                .frame(height: 6)
                            }
                            
                            // Breathing Rate
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("Breathing Rate")
                                        .font(.caption)
                                        .foregroundColor(HaggleTheme.textSecondary)
                                    Spacer()
                                    Text("\(Int(haggleManager.breathingRate))")
                                        .font(HaggleTheme.monoFont(size: 13))
                                        .foregroundColor(HaggleTheme.textPrimary)
                                    Text("/min")
                                        .font(.caption2)
                                        .foregroundColor(HaggleTheme.textSecondary)
                                }
                                
                                GeometryReader { geo in
                                    ZStack(alignment: .leading) {
                                        RoundedRectangle(cornerRadius: 999)
                                            .fill(Color.white.opacity(0.1))
                                            .frame(height: 6)
                                        
                                        RoundedRectangle(cornerRadius: 999)
                                            .fill(Color.blue)
                                            .frame(width: min(geo.size.width * (haggleManager.breathingRate / 25.0), geo.size.width), height: 6)
                                    }
                                }
                                .frame(height: 6)
                            }
                            
#if canImport(SmartSpectraSwiftSDK)
                            // Breathing Amplitude (Depth)
                            if haggleManager.breathingAmplitude > 0 {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text("Breathing Depth")
                                            .font(.caption)
                                            .foregroundColor(HaggleTheme.textSecondary)
                                        Spacer()
                                        Text("\(Int(haggleManager.breathingAmplitude))")
                                            .font(HaggleTheme.monoFont(size: 13))
                                            .foregroundColor(HaggleTheme.textPrimary)
                                        
                                        // Visual indicator for shallow breathing (stress signal)
                                        if haggleManager.breathingAmplitude < 50 {
                                            Text("SHALLOW")
                                                .font(.caption2)
                                                .fontWeight(.medium)
                                                .foregroundColor(HaggleTheme.warn)
                                                .padding(.horizontal, 6)
                                                .padding(.vertical, 2)
                                                .background(HaggleTheme.warn.opacity(0.15))
                                                .clipShape(Capsule())
                                        }
                                    }
                                    
                                    GeometryReader { geo in
                                        ZStack(alignment: .leading) {
                                            RoundedRectangle(cornerRadius: 999)
                                                .fill(Color.white.opacity(0.1))
                                                .frame(height: 6)
                                            
                                            RoundedRectangle(cornerRadius: 999)
                                                .fill(Color.cyan)
                                                .frame(width: min(geo.size.width * (haggleManager.breathingAmplitude / 100.0), geo.size.width), height: 6)
                                        }
                                    }
                                    .frame(height: 6)
                                }
                            }
                            
                            // Face activity indicators
                            if haggleManager.isTalking {
                                Divider()
                                    .background(Color.white.opacity(0.1))
                                    .padding(.vertical, 4)
                                
                                HStack(spacing: 8) {
                                    HStack(spacing: 4) {
                                        Circle()
                                            .fill(Color.green)
                                            .frame(width: 6, height: 6)
                                        Text("Speaking")
                                            .font(.caption2)
                                            .fontWeight(.medium)
                                            .foregroundColor(Color.green)
                                    }
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color.green.opacity(0.15))
                                    .clipShape(Capsule())
                                    
                                    Text("Active engagement detected")
                                        .font(.caption2)
                                        .foregroundColor(HaggleTheme.textSecondary.opacity(0.8))
                                    
                                    Spacer()
                                }
                            }
#endif
                        }
                        .padding(20)
                    }
                    .padding(.horizontal, 20)
                    
                    // Algorithm Explainer (collapsible)
                    HaggleCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: "function")
                                    .foregroundColor(HaggleTheme.accent)
                                    .font(.caption)
                                Text("Stress Algorithm")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(HaggleTheme.textPrimary)
                                Spacer()
                                Image(systemName: "info.circle")
                                    .foregroundColor(HaggleTheme.textSecondary)
                                    .font(.caption)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                AlgorithmFactorRow(
                                    label: "HR Deviation",
                                    weight: "60%",
                                    description: "Change from baseline"
                                )
                                AlgorithmFactorRow(
                                    label: "Breathing Deviation",
                                    weight: "25%",
                                    description: "Change from baseline"
                                )
                                AlgorithmFactorRow(
                                    label: "Shallow Breathing",
                                    weight: "+10%",
                                    description: "Low amplitude = stress"
                                )
                                AlgorithmFactorRow(
                                    label: "Speaking",
                                    weight: "-5%",
                                    description: "Engagement reduces stress"
                                )
                            }
                            
                            Divider()
                                .background(Color.white.opacity(0.1))
                            
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.right.circle.fill")
                                    .foregroundColor(HaggleTheme.accent)
                                    .font(.caption2)
                                Text("Sent to Hal every 5 seconds")
                                    .font(.caption2)
                                    .foregroundColor(HaggleTheme.textSecondary)
                            }
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20)

                    Spacer()

                    Button {
                        haggleManager.disconnect()
                    } label: {
                        Text("Disconnect")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.white.opacity(0.12))
                    .padding(.horizontal, 20)
                    .padding(.bottom, geometry.safeAreaInsets.bottom > 0 ? 20 : 40)
                }
            }
        }
        .onAppear {
#if canImport(SmartSpectraSwiftSDK)
            print("📱 MeasurementView appeared - starting headless vitals monitoring")
            
            // Configure SDK
            sdk.setApiKey(HaggleConfig.presageApiKey)
            sdk.setCameraPosition(.front)
            print("✅ SDK configured")
            
            // Start headless vitals processing (no UI buttons needed!)
            vitalsProcessor.startProcessing()
            vitalsProcessor.startRecording()
            print("🎥 Headless vitals processor started - camera running in background")
            
            // Pass SDK to HaggleManager for data reading
            haggleManager.startMeasurement(sdk: sdk)
            
            // Monitor SDK state
            debugTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
                if let buffer = sdk.metricsBuffer {
                    let pulseCount = buffer.pulse.rate.count
                    let breathCount = buffer.breathing.rate.count
                    print("📊 Streaming: \(pulseCount) pulse, \(breathCount) breath samples")
                    
                    if pulseCount > 0, let latest = buffer.pulse.rate.last {
                        print("   HR: \(Int(latest.value)) bpm, Confidence: \(Int(latest.confidence * 100))%")
                    }
                } else {
                    print("⚠️ No data yet - camera initializing...")
                }
            }
#else
            print("⚠️ SmartSpectraSwiftSDK not available")
            haggleManager.startMeasurement(sdk: nil)
#endif
        }
        .onDisappear {
#if canImport(SmartSpectraSwiftSDK)
            print("📱 Stopping headless vitals processor")
            vitalsProcessor.stopProcessing()
            vitalsProcessor.stopRecording()
#endif
            debugTimer?.invalidate()
            debugTimer = nil
            haggleManager.stopMeasurement()
        }
    }

    private var stressColor: Color {
        if haggleManager.stressScore > 70 { return HaggleTheme.danger }
        if haggleManager.stressScore > 50 { return HaggleTheme.warn }
        return HaggleTheme.ok
    }
    
    private var stressTrendLabel: String {
        if haggleManager.isBaselineBuilding { return "CALIBRATING" }
        if haggleManager.stressScore > 70 { return "HIGH" }
        if haggleManager.stressScore > 50 { return "ELEVATED" }
        return "NORMAL"
    }
    
    private var stressTrendColor: Color {
        if haggleManager.isBaselineBuilding { return Color.yellow }
        if haggleManager.stressScore > 70 { return HaggleTheme.danger }
        if haggleManager.stressScore > 50 { return HaggleTheme.warn }
        return HaggleTheme.ok
    }
}

// Helper view for algorithm explanation
struct AlgorithmFactorRow: View {
    let label: String
    let weight: String
    let description: String
    
    var body: some View {
        HStack(spacing: 8) {
            Text(label)
                .font(.caption2)
                .foregroundColor(HaggleTheme.textSecondary)
            
            Spacer()
            
            Text(weight)
                .font(HaggleTheme.monoFont(size: 11, weight: .semibold))
                .foregroundColor(HaggleTheme.accent)
            
            Text("·")
                .font(.caption2)
                .foregroundColor(HaggleTheme.textSecondary.opacity(0.5))
            
            Text(description)
                .font(.caption2)
                .foregroundColor(HaggleTheme.textSecondary.opacity(0.7))
        }
    }
}

