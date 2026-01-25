import SwiftUI

struct SessionConnectView: View {
    @ObservedObject var haggleManager: HaggleManager

    @State private var manualSessionId: String = ""
    @AppStorage("haggle_server_url") private var serverURLString: String = HaggleConfig.defaultServerURLString

    @State private var showScanner = false
    @State private var errorText: String?

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(spacing: 24) {
                    header
                        .padding(.top, geometry.safeAreaInsets.top > 0 ? 20 : 40)

                    // Server Configuration Card
                    HaggleCard {
                        VStack(alignment: .leading, spacing: 14) {
                            HStack(spacing: 8) {
                                Image(systemName: "server.rack")
                                    .foregroundColor(HaggleTheme.accent)
                                    .font(.title3)
                                Text("Server Configuration")
                                    .font(.headline)
                                    .foregroundColor(HaggleTheme.textPrimary)
                            }
                            
                            Divider()
                                .background(Color.white.opacity(0.1))

                            TextField("http://192.168.1.5:3000", text: $serverURLString)
                                .textFieldStyle(.roundedBorder)
                                .autocapitalization(.none)
                                .keyboardType(.URL)
                                .tint(HaggleTheme.accent)
                                .font(HaggleTheme.monoFont(size: 14))

                            HStack(spacing: 6) {
                                Image(systemName: "info.circle")
                                    .foregroundColor(HaggleTheme.textSecondary)
                                    .font(.caption)
                                Text("Use your Mac's Wi‑Fi IP address, not localhost")
                                    .font(.caption2)
                                    .foregroundColor(HaggleTheme.textSecondary)
                            }
                        }
                        .padding(20)
                    }

                    // Session Connection Card
                    HaggleCard {
                        VStack(alignment: .leading, spacing: 14) {
                            HStack(spacing: 8) {
                                Image(systemName: "link.circle.fill")
                                    .foregroundColor(HaggleTheme.accent)
                                    .font(.title3)
                                Text("Connect to Session")
                                    .font(.headline)
                                    .foregroundColor(HaggleTheme.textPrimary)
                            }
                            
                            Divider()
                                .background(Color.white.opacity(0.1))

                            TextField("abc-123-def", text: $manualSessionId)
                                .textFieldStyle(.roundedBorder)
                                .autocapitalization(.none)
                                .tint(HaggleTheme.accent)
                                .font(HaggleTheme.monoFont(size: 14))

                            HStack(spacing: 12) {
                                Button {
                                    showScanner = true
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "qrcode.viewfinder")
                                        Text("Scan QR")
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 4)
                                }
                                .buttonStyle(.bordered)
                                .tint(.white.opacity(0.9))

                                Button {
                                    connect()
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "arrow.right.circle.fill")
                                        Text("Connect")
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 4)
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(HaggleTheme.accent)
                                .disabled(manualSessionId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                            }

                            if let inbound = haggleManager.incomingSessionId, !inbound.isEmpty {
                                HStack(spacing: 6) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(HaggleTheme.ok)
                                    Text("Session detected: \(inbound)")
                                        .font(HaggleTheme.monoFont(size: 12))
                                        .foregroundColor(HaggleTheme.ok)
                                }
                                .padding(.top, 4)
                            }
                        }
                        .padding(20)
                    }

                    if let errorText {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(HaggleTheme.danger)
                            Text(errorText)
                                .foregroundColor(HaggleTheme.danger)
                                .font(.footnote)
                        }
                        .padding()
                        .background(HaggleTheme.danger.opacity(0.1))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }

                    // Instructions card
                    HaggleCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 8) {
                                Image(systemName: "lightbulb.fill")
                                    .foregroundColor(.yellow.opacity(0.8))
                                    .font(.title3)
                                Text("Quick Start")
                                    .font(.headline)
                                    .foregroundColor(HaggleTheme.textPrimary)
                            }
                            
                            VStack(alignment: .leading, spacing: 10) {
                                InstructionRow(number: "1", text: "Enter server IP address above")
                                InstructionRow(number: "2", text: "Scan QR code or enter session ID")
                                InstructionRow(number: "3", text: "Tap Connect button")
                                InstructionRow(number: "4", text: "Position face for calibration")
                            }
                        }
                        .padding(20)
                    }

                    Spacer(minLength: 20)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, geometry.safeAreaInsets.bottom > 0 ? 20 : 40)
            }
        }
        .sheet(isPresented: $showScanner) {
            QRScannerView(
                onScan: { raw in
                    let parsed = SessionLinkParser.parseSessionId(from: raw) ?? ""
                    manualSessionId = parsed
                    showScanner = false
                },
                onCancel: {
                    showScanner = false
                }
            )
        }
        .onAppear {
            // Keep manual text in sync if manager already has a session (edge case)
            if !haggleManager.sessionId.isEmpty {
                manualSessionId = haggleManager.sessionId
            }
        }
        .onChangeCompat(of: haggleManager.incomingSessionId) { newValue in
            guard let newValue, !newValue.isEmpty else { return }
            manualSessionId = newValue

            // If server URL is configured to a real LAN host, auto-connect.
            let urlString = serverURLString.trimmingCharacters(in: .whitespacesAndNewlines)
            if let url = URL(string: urlString), url.host != nil, urlString != HaggleConfig.defaultServerURLString {
                haggleManager.connect(sessionId: newValue, serverURL: url)
            }
        }
    }

    private var header: some View {
        VStack(spacing: 12) {
            // App icon-style visual
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [HaggleTheme.accent, HaggleTheme.accent.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)
                
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 36, weight: .medium))
                    .foregroundColor(.white)
            }
            .padding(.bottom, 8)
            
            Text("Haggle")
                .font(HaggleTheme.titleFont(size: 48))
                .foregroundColor(.white)

            Text("Biometric Sensor")
                .font(.headline)
                .foregroundColor(HaggleTheme.textSecondary)

            Text("Real-time heart rate & breathing analysis for negotiation training")
                .font(.subheadline)
                .foregroundColor(HaggleTheme.textSecondary.opacity(0.8))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
        .padding(.vertical, 20)
    }

    private func connect() {
        errorText = nil

        let session = manualSessionId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !session.isEmpty else {
            errorText = "Please enter a session id."
            return
        }

        let urlString = serverURLString.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: urlString), url.scheme != nil, url.host != nil else {
            errorText = "Please enter a valid server URL (example: http://192.168.1.5:3000)."
            return
        }

        haggleManager.connect(sessionId: session, serverURL: url)
    }
}

// MARK: - Helper Views
struct InstructionRow: View {
    let number: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(HaggleTheme.accent.opacity(0.2))
                    .frame(width: 28, height: 28)
                Text(number)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(HaggleTheme.accent)
            }
            
            Text(text)
                .font(.subheadline)
                .foregroundColor(HaggleTheme.textSecondary)
            
            Spacer()
        }
    }
}

private extension View {
    @ViewBuilder
    func onChangeCompat<T: Equatable>(of value: T, perform: @escaping (T) -> Void) -> some View {
        if #available(iOS 17.0, *) {
            self.onChange(of: value) { _, newValue in
                perform(newValue)
            }
        } else {
            self.onChange(of: value, perform: perform)
        }
    }
}
