import SwiftUI

enum HaggleTheme {
    // Web uses: background #0a0a0a and orange accent (landing uses #ff6b35).
    static let bg = Color(red: 10/255, green: 10/255, blue: 10/255)
    static let card = Color(red: 23/255, green: 23/255, blue: 23/255) // ~neutral-900
    static let cardBorder = Color.white.opacity(0.10)

    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.65)

    static let accent = Color(red: 255/255, green: 107/255, blue: 53/255) // #ff6b35

    static let danger = Color(red: 239/255, green: 68/255, blue: 68/255) // tailwind red-500
    static let warn = Color(red: 245/255, green: 158/255, blue: 11/255)  // amber-500-ish
    static let ok = Color(red: 34/255, green: 197/255, blue: 94/255)      // green-500

    static func titleFont(size: CGFloat) -> Font {
        .system(size: size, weight: .bold, design: .default)
    }

    static func monoFont(size: CGFloat, weight: Font.Weight = .medium) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
}

struct HaggleCard<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        content
            .padding(16)
            .background(HaggleTheme.card)
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(HaggleTheme.cardBorder, lineWidth: 1)
            )
            .cornerRadius(22)
    }
}

