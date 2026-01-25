import Foundation

enum SessionLinkParser {
    /// Accepts:
    /// - raw session id (UUID-like)
    /// - `haggle://<sessionId>` (current web QR)
    /// - `haggle://session/<sessionId>` (guide / alternate)
    static func parseSessionId(from raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        // Raw id (fallback)
        if !trimmed.lowercased().hasPrefix("haggle://") {
            return trimmed
        }

        var rest = trimmed
        rest = rest.replacingOccurrences(of: "haggle://", with: "", options: [.caseInsensitive])

        // Allow "session/<id>" prefix (optional)
        if rest.lowercased().hasPrefix("session/") {
            rest = String(rest.dropFirst("session/".count))
        }

        // Some QR encoders might include trailing slashes or params.
        rest = rest.split(separator: "?").first.map(String.init) ?? rest
        rest = rest.trimmingCharacters(in: CharacterSet(charactersIn: "/"))

        return rest.isEmpty ? nil : rest
    }
}

