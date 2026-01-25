import Foundation

enum HaggleConfig {
    // MARK: - Presage
    // Replace with your Presage API key.
    static let presageApiKey = "9ZG0RkIAb85TpDRLFjghV1pZlMhvmzwZ7J3QzYtc"

    // MARK: - Networking
    static let defaultServerURLString = "http://10.11.82.253:3000"
    static let socketPath = "/api/biometrics/socket"
    static let biometricsBootstrapPath = "/api/biometrics"

    // MARK: - Streaming + stress
    static let transmitInterval: TimeInterval = 1.5
    static let baselineDuration: TimeInterval = 10.0 // 10 seconds for baseline
    static let baselineMinSamples: Int = 50 // Require full time window for consistency (prevents early completion)
    static let minConfidenceToTransmit: Double = 0.7
}

