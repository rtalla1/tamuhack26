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
                VStack(spacing: 18) {
                    header
                        .padding(.top, geometry.safeAreaInsets.top > 0 ? 20 : 40)

                    HaggleCard {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Server")
                                .font(.caption)
                                .foregroundColor(HaggleTheme.textSecondary)

                            TextField("http://192.168.1.5:3000", text: $serverURLString)
                                .textFieldStyle(.roundedBorder)
                                .autocapitalization(.none)
                                .keyboardType(.URL)
                                .tint(HaggleTheme.accent)

                            Text("Your iPhone cannot connect to `localhost`. Use your Mac’s Wi‑Fi IP.")
                                .font(.caption2)
                                .foregroundColor(HaggleTheme.textSecondary)
                        }
                    }

                    HaggleCard {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Session ID")
                                .font(.caption)
                                .foregroundColor(HaggleTheme.textSecondary)

                            TextField("abc-123-def", text: $manualSessionId)
                                .textFieldStyle(.roundedBorder)
                                .autocapitalization(.none)
                                .tint(HaggleTheme.accent)

                            HStack(spacing: 10) {
                                Button {
                                    showScanner = true
                                } label: {
                                    Label("Scan QR", systemImage: "qrcode.viewfinder")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.bordered)
                                .tint(.white.opacity(0.8))

                                Button {
                                    connect()
                                } label: {
                                    Text("Connect")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(HaggleTheme.accent)
                                .disabled(manualSessionId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                            }

                            if let inbound = haggleManager.incomingSessionId, !inbound.isEmpty {
                                Text("Link detected: \(inbound)")
                                    .font(HaggleTheme.monoFont(size: 12))
                                    .foregroundColor(HaggleTheme.textSecondary)
                            }
                        }
                    }

                    if let errorText {
                        Text(errorText)
                            .foregroundColor(HaggleTheme.danger)
                            .font(.footnote)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }

                        Spacer(minLength: 20)
                }
                .padding()
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
        VStack(spacing: 10) {
            Text("Haggle")
                .font(HaggleTheme.titleFont(size: 44))
                .foregroundColor(.white)

            Text("Sensor companion")
                .font(.headline)
                .foregroundColor(HaggleTheme.textSecondary)

            Text("Scan the web QR to link a session, then stream biometrics in real time.")
                .font(.subheadline)
                .foregroundColor(HaggleTheme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 8)
        }
        .padding(.top, 10)
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
