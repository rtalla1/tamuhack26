import SwiftUI

@main
struct HaggleSensorApp: App {
    @StateObject private var haggleManager = HaggleManager()

    var body: some Scene {
        WindowGroup {
            ContentView(haggleManager: haggleManager)
                .onOpenURL { url in
                    // Enables Camera-app QR linking: haggle://<sessionId> (or haggle://session/<id>)
                    haggleManager.handleIncomingURL(url)
                }
        }
    }
}

