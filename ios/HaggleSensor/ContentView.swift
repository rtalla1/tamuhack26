import SwiftUI

struct ContentView: View {
    @ObservedObject var haggleManager: HaggleManager

    var body: some View {
        NavigationView {
            if haggleManager.sessionId.isEmpty {
                SessionConnectView(haggleManager: haggleManager)
            } else {
                MeasurementView(haggleManager: haggleManager)
            }
        }
        .preferredColorScheme(.dark)
    }
}

