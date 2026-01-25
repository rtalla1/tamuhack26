import SwiftUI

#if canImport(SmartSpectraSwiftSDK)
import SmartSpectraSwiftSDK
#endif

struct MeasurementView: View {
    @ObservedObject var haggleManager: HaggleManager

#if canImport(SmartSpectraSwiftSDK)
    @StateObject private var presage = PresageController()
#endif

    var body: some View {
        ZStack {
            HaggleTheme.bg.ignoresSafeArea()

            VStack(spacing: 16) {
                header

                HaggleCard {
#if canImport(SmartSpectraSwiftSDK)
                    SmartSpectraView()
                        .frame(height: 320)
                        .cornerRadius(18)
#else
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color.black.opacity(0.20))
                        .frame(height: 320)
                        .overlay(
                            VStack(spacing: 10) {
                                Image(systemName: "camera.fill")
                                    .font(.system(size: 32))
                                    .foregroundColor(HaggleTheme.textSecondary)
                                Text("Presage SDK not linked")
                                    .font(.headline)
                                    .foregroundColor(HaggleTheme.textPrimary)
                                Text("Add the SmartSpectra dependency in Xcode to enable camera biometrics.")
                                    .font(.footnote)
                                    .foregroundColor(HaggleTheme.textSecondary)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal)
                            }
                        )
#endif
                }

                vitalsCard

                Spacer()

                Button {
                    haggleManager.disconnect()
                } label: {
                    Text("Disconnect")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.white.opacity(0.12))
                .padding(.bottom, 8)
            }
        }
        .padding()
        .navigationBarHidden(true)
        .onAppear {
#if canImport(SmartSpectraSwiftSDK)
            haggleManager.startMeasurement(sdk: presage.sdk)
#else
            haggleManager.startMeasurement(sdk: nil)
#endif
        }
        .onDisappear {
            haggleManager.stopMeasurement()
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text("Live biometrics")
                    .font(.headline)
                    .foregroundColor(HaggleTheme.textPrimary)
                Text(haggleManager.sessionId)
                    .font(HaggleTheme.monoFont(size: 12))
                    .foregroundColor(HaggleTheme.textSecondary)
                    .lineLimit(1)
            }
            Spacer()

            HStack(spacing: 8) {
                Circle()
                    .fill(haggleManager.isConnected ? HaggleTheme.ok : HaggleTheme.danger)
                    .frame(width: 10, height: 10)
                Text(haggleManager.isConnected ? "Connected" : "Disconnected")
                    .font(.caption)
                    .foregroundColor(HaggleTheme.textSecondary)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.06))
            .clipShape(Capsule())
        }
    }

    private var vitalsCard: some View {
        HaggleCard {
            VStack(spacing: 14) {
                VitalRow(icon: "heart.fill", label: "Heart Rate", value: "\(Int(haggleManager.heartRate)) bpm", color: HaggleTheme.danger)
                VitalRow(icon: "lungs.fill", label: "Breathing", value: "\(Int(haggleManager.breathingRate))/min", color: .blue)
                VitalRow(icon: "waveform.path.ecg", label: "Stress", value: "\(haggleManager.stressScore)%", color: stressColor)

                if haggleManager.isBaselineBuilding {
                    Text("Calibrating baseline · \(haggleManager.baselineProgressText)")
                        .font(.caption2)
                        .foregroundColor(HaggleTheme.textSecondary)
                } else {
                    Text("Confidence: \(Int((haggleManager.confidence * 100).rounded()))%")
                        .font(.caption2)
                        .foregroundColor(HaggleTheme.textSecondary)
                }
            }
        }
    }

    private var stressColor: Color {
        if haggleManager.stressScore > 70 { return HaggleTheme.danger }
        if haggleManager.stressScore > 50 { return HaggleTheme.warn }
        return HaggleTheme.ok
    }
}

private struct VitalRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(HaggleTheme.textSecondary)
                Text(value)
                    .font(.headline)
                    .foregroundColor(HaggleTheme.textPrimary)
            }
            Spacer()
        }
    }
}

#if canImport(SmartSpectraSwiftSDK)
final class PresageController: ObservableObject {
    let sdk = SmartSpectraSwiftSDK.shared

    init() {
        // Configure Presage SDK once
        sdk.setApiKey(HaggleConfig.presageApiKey)
        sdk.setSmartSpectraMode(.continuous)
        sdk.setCameraPosition(.front)
    }
}
#endif

