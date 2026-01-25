import Foundation

enum SessionLinkParser {
    /// Parse session ID and optional server URL from QR code or deep link
    /// Expected formats:
    /// - `haggle://SESSION_ID?server=http://host:port` (new: includes server)
    /// - `haggle://SESSION_ID` (legacy: session only)
    /// - `SESSION_ID` (plain text fallback)
    static func parseSessionId(from raw: String) -> String? {
        return parse(from: raw).sessionId
    }
    
    static func parse(from raw: String) -> (sessionId: String?, serverUrl: String?) {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return (nil, nil) }
        
        // Raw id fallback (no protocol)
        if !trimmed.lowercased().hasPrefix("haggle://") {
            return (trimmed, nil)
        }
        
        // Parse as URL
        guard let url = URL(string: trimmed) else {
            return (nil, nil)
        }
        
        // Extract session ID (from host or path)
        var sessionId: String? = nil
        if let host = url.host, !host.isEmpty {
            // Format: haggle://SESSION_ID or haggle://SESSION_ID?server=...
            sessionId = host
        } else if let path = url.path.split(separator: "/").first, !path.isEmpty {
            // Format: haggle:///session/SESSION_ID
            sessionId = String(path)
        }
        
        // Extract server URL from query parameter if present
        var serverUrl: String? = nil
        if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let queryItems = components.queryItems,
           let serverParam = queryItems.first(where: { $0.name == "server" }),
           let server = serverParam.value, !server.isEmpty {
            serverUrl = server
        }
        
        return (sessionId, serverUrl)
    }
}
