# HaggleSensor (iOS) — Web Integration

This folder contains the **iOS-side implementation** that streams biometrics to the Haggle web app over **Socket.IO**.

## Contract (must match the web app)

- **Socket.IO path**: `/api/biometrics/socket`
- **Join a session room**:
  - emit: `join-session` with payload `sessionId: String`
  - listen: `ios-connected` (ack / confirmation)
- **Send biometrics** (every 1–2 seconds):
  - emit: `biometric-update` with payload:

```json
{
  "sessionId": "abc-123",
  "heartRate": 75.5,
  "breathingRate": 14.2,
  "stressScore": 68,
  "confidence": 0.95,
  "timestamp": 1737846623000
}
```

## Important local dev note (iPhone cannot use `localhost`)

For local testing, set the server URL to your Mac’s LAN IP:

- ✅ `http://192.168.1.5:3000`
- ❌ `http://localhost:3000` (this points to the iPhone itself)

## How to use

1. Start the web app: `cd web && npm run dev`
2. In the web app, start a session and open “Connect iPhone” to view the QR code
3. In the iOS app:
   - Scan the QR (supports `haggle://<sessionId>` and `haggle://session/<sessionId>`) **or**
   - Paste the session id manually
   - Ensure the server URL is your Mac IP (see note above)
4. Tap **Connect**

## Xcode setup

Open the included Xcode project:

- `ios/HaggleSensor/HaggleSensor.xcodeproj`

Then in Xcode:

- **Signing & Capabilities**: select your Apple ID Team (free is fine)
- **Dependencies (optional but required for real biometrics + streaming)**:
  - Socket.IO client: `https://github.com/socketio/socket.io-client-swift`
  - Presage SmartSpectra: `https://github.com/Presage-Security/SmartSpectra`

Add Swift Package dependencies:

- Socket.IO client: `https://github.com/socketio/socket.io-client-swift`
- Presage SmartSpectra: `https://github.com/Presage-Security/SmartSpectra`

Add camera permission + URL scheme to your target’s `Info.plist` (or paste from `ios/HaggleSensor/Info.plist`):

```xml
<key>NSCameraUsageDescription</key>
<string>Haggle needs camera access to scan the session QR and measure biometrics.</string>

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>haggle</string>
    </array>
  </dict>
</array>
```

Then set your Presage API key in `HaggleConfig.swift`.

## QR deep link behavior (Camera app)

The web QR encodes `haggle://{sessionId}`. Once this iOS app is installed on a phone:

- iPhone Camera → scan QR → tap “Open in HaggleSensor”
- The app will open and pre-fill the session id automatically

## Getting it on a phone without the App Store

- **Best for hackathons**: plug in iPhone → Run from Xcode (installs the app)
- **Private distribution**: TestFlight (still not public App Store, but requires Apple Developer Program)

