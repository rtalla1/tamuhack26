import Foundation

enum HaggleConfig {
    // MARK: - Presage
    // Replace with your Presage API key.
    static let presageApiKey = "YOUR_PRESAGE_API_KEY"

    // MARK: - Networking
    static let defaultServerURLString = "http://localhost:3000"
    static let socketPath = "/api/biometrics/socket"
    static let biometricsBootstrapPath = "/api/biometrics"

    // MARK: - Streaming + stress
    static let transmitInterval: TimeInterval = 1.5
    static let baselineDuration: TimeInterval = 10.0
    static let baselineMinSamples: Int = 10
    static let minConfidenceToTransmit: Double = 0.7
}

