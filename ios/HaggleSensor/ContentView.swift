import SwiftUI

struct ContentView: View {
    @ObservedObject var haggleManager: HaggleManager

    var body: some View {
        ZStack {
            Color(red: 10/255, green: 10/255, blue: 10/255)
                .ignoresSafeArea()
            
            if haggleManager.sessionId.isEmpty {
                SessionConnectView(haggleManager: haggleManager)
            } else {
                MeasurementView(haggleManager: haggleManager)
            }
        }
        .preferredColorScheme(.dark)
    }
}

