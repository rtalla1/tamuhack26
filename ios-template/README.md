# Haggle iOS App Template

This is a **simplified, ready-to-use template** for the Haggle iOS app.

## What This Template Includes

**Session connection** (QR scan + manual entry)  
**Presage SDK integration** (continuous measurement)  
**Socket.IO connection** to web app  
**Stress calculation algorithm**  
**Real-time data transmission**  
**Clean SwiftUI interface**

## Quick Start (5 Steps)

### 1. Create New Xcode Project

```bash
# In Xcode:
File → New → Project
- iOS App
- Name: "HaggleStress"
- Interface: SwiftUI
- Language: Swift
```

### 2. Add Dependencies

**Add Socket.IO:**
```
File → Add Package Dependencies
URL: https://github.com/socketio/socket.io-client-swift
Version: 16.0.0+
```

**Add Presage SDK:**
```
File → Add Package Dependencies
URL: https://github.com/Presage-Security/SmartSpectra
Branch: main
```

### 3. Replace ContentView.swift

Copy the entire `ContentView.swift` from this template into your project.

### 4. Update Info.plist

Add camera permission:

```xml
<key>NSCameraUsageDescription</key>
<string>Haggle needs camera access to measure your stress levels.</string>
```

### 5. Configure API Keys

In `ContentView.swift`, replace:

```swift
// Line ~90
sdk.setApiKey("YOUR_PRESAGE_API_KEY")
```

Get your Presage API key from: https://physiology.presagetech.com

## Testing Locally

### Update Server URL

For local testing on your Mac:

```swift
// In HaggleManager.connect(), change:
let serverURL = URL(string: "http://YOUR_MAC_IP:3000")!

// Find your Mac's IP:
// System Preferences → Network → Wi-Fi → Your IP (e.g., 192.168.1.5)
```

### Testing Flow

1. Start web app: `npm run dev` (in web folder)
2. Start negotiation session
3. Note the session ID (or QR code)
4. Build iOS app to iPhone
5. Enter session ID in app
6. Tap "Connect"
7. Watch stress gauge update in real-time

## What's Next (Optional Enhancements)

### Add QR Scanner

Install CodeScanner:
```
File → Add Package Dependencies
URL: https://github.com/twostraws/CodeScanner
```

Update `SessionInputView`:
```swift
import CodeScanner

// Replace "TODO: Implement QR scanner" with:
.sheet(isPresented: $showScanner) {
    CodeScannerView(
        codeTypes: [.qr],
        completion: { result in
            if case .success(let code) = result {
                let sessionId = code.string.replacingOccurrences(of: "haggle://", with: "")
                haggleManager.connect(sessionId: sessionId)
            }
        }
    )
}
```

### Add Haptic Feedback

```swift
// When connection succeeds:
let generator = UINotificationFeedbackGenerator()
generator.notificationOccurred(.success)
```

### Add Background Mode

In Xcode:
```
Targets → Signing & Capabilities → + Capability → Background Modes
Check: "Audio, AirPlay, and Picture in Picture"
```

This keeps the app running when backgrounded (useful during negotiations).

## Troubleshooting

### "Presage returns no metrics"

- Make sure you're running on a **real iPhone** (not simulator)
- Allow camera permission when prompted
- Position your face in the camera frame
- Wait 10-15 seconds for measurements to stabilize

### "Socket.IO won't connect"

- Verify web app is running (`localhost:3000`)
- Check that iPhone is on same WiFi as Mac
- Use your Mac's IP address, not `localhost`
- Check server logs for connection attempts

### "Stress always shows 50%"

- Baseline hasn't been set yet (wait 10 seconds)
- Try physical activity (jumping jacks) to test response
- Check that HR and BR values are updating

### "Build fails"

- Make sure you've added both dependencies (Socket.IO + Presage)
- Select your development team in Signing & Capabilities
- Try cleaning build folder: `Product → Clean Build Folder`

## Architecture

```
ContentView
├── SessionInputView (QR scan / manual entry)
└── MeasurementView (camera + vitals display)
    └── HaggleManager (Socket.IO + stress calculation)
        ├── Presage SDK (biometrics)
        └── Socket.IO (real-time updates)
```

## File Structure

```
HaggleStress/
├── ContentView.swift (everything in one file for simplicity)
├── Info.plist
└── Assets.xcassets/
```

## Production Deployment

When deploying to production:

1. **Change server URL:**
   ```swift
   let serverURL = URL(string: "https://haggle.app")!
   ```

2. **Update path if needed:**
   ```swift
   .path("/api/biometrics/socket")
   ```

3. **Test on TestFlight** before submission

## Need Help?

Check the main integration guide: `IOS_INTEGRATION_GUIDE.md`

Or reference Presage's full docs: https://docs.physiology.presagetech.com/swift/
