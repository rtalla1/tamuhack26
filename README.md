# Haggle

**Your body betrays you. Learn to beat it.**

Haggle is an AI negotiation trainer that reads your stress in real-time and uses it against you, then reveals exactly when and why you cracked.

## What It Does

78% of people never negotiate their salary. Those who do often leave thousands on the table, not from lack of knowledge, but from cracking under pressure.

Haggle provides a training ground where you negotiate with Hal, an AI that senses your stress and exploits it like a real negotiator would.

**How It Works:**
1. Select a negotiation scenario (salary, B2B, or consumer)
2. Face Hal, an AI with a hidden budget and adaptive tactics
3. Optional: Connect iPhone for real-time biometric tracking via Presage SDK
4. Hal receives stress updates and adapts its approach accordingly
5. Review the results: Hal's hidden budget, your stress timeline, and where you left money on the table

**The Approach:**

Most AI tools simulate conversation. Haggle transforms AI output using real-time biometric data. When your stress spikes, Gemini receives contextual updates and modifies its negotiation tactics without revealing it knows you're nervous.

```
Stress Detection (Presage) → Contextual Updates → AI Behavior Transformation (Gemini)
```

## Tech Stack

| Component | Technology | 
| --------- | ---------- |
| Web App | Next.js 15, React 19, Tailwind CSS |
| Voice AI | ElevenLabs Conversational AI |
| AI Brain | Google Gemini 2.5 Flash |
| Biometrics | Presage SmartSpectra SDK (iOS) |
| Real-Time Sync | Socket.IO |
| Visualization | Recharts, WebGL |

## Architecture

### User Experience Flow
```
Landing → Modal Choice → Voice Negotiation → Results Reveal
           (biometrics?)     (stress-adaptive AI)    (transformation visualization)
```

### Technical Pipeline
```
iPhone Camera (Presage SDK)
    ↓
Multi-Signal Biometric Collection:
  • Heart Rate (bpm) with confidence
  • Breathing Rate (/min) with confidence  
  • Breathing Amplitude (depth/stress indicator)
  • Speech Detection (engagement)
    ↓
Baseline Calibration (10s fixed window):
  Establishes resting HR & BR for accurate stress calculation
    ↓
Stress Algorithm (0-100%):
  50 + (HR_deviation × 60) + (BR_deviation × 25) 
  + amplitude_penalty - talking_bonus
    ↓
Socket.IO → Next.js Server (7+ signals)
    ↓
sendContextualUpdate() (enriched context every 2s)
    ↓
ElevenLabs → Gemini 2.5 Flash
  Receives: stress%, trend, HR/BR flags, shallow breathing, speech status
  Adapts: tactics, pressure, timing without revealing awareness
    ↓
Streaming Voice Response
```

## Technical Challenges Solved

**Real-Time Biometric Integration**  
Built a pipeline that feeds live biometric data to a conversational AI without breaking conversation flow. Uses ElevenLabs' `sendContextualUpdate()` API to inject stress context every 2 seconds for real-time responsive adaptation, allowing Gemini to adapt tactics mid-conversation.

**Cross-Device Architecture**  
Implemented Socket.IO server in Next.js API routes for iPhone to web to AI communication. QR code pairing enables instant connection. iPhone emits biometric updates, web client receives stress data, AI adapts behavior.

**AI Behavior Guardrails**  
Prevented common exploits through prompt engineering: budget limit enforcement, role-switching prevention, and a `skip_turn` tool for handling adversarial inputs. Iteratively tested against various jailbreak attempts.

**Stress Algorithm Design**  
Developed weighted calculation accounting for baseline, trends, and breathing patterns: `stress = (hrScore * 0.6) + (breathingScore * 0.4)` with 10-sample moving average for trend detection.

## Quick Start

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

Requires ElevenLabs API key and Agent ID in `web/.env.local`

## Project Structure

```
haggle/
├── web/                         
│   ├── src/app/
│   │   ├── page.tsx                      # Landing page with scenario selection
│   │   ├── session/[id]/page.tsx         # Voice negotiation interface
│   │   ├── reveal/[id]/page.tsx          # Results and AI transformation visualization
│   │   └── api/biometrics/route.ts       # Socket.IO server for iPhone connection
│   └── src/lib/
│       └── hal-prompt.ts                 # Dynamic AI persona and stress context builder
│
└── ios/HaggleSensor/                     # Complete iOS app with Presage SDK integration
    ├── HaggleManager.swift               # Socket.IO client, stress calculation, baseline calibration
    ├── ContentView.swift                 # Main app navigation
    ├── MeasurementView.swift             # Camera biometrics display
    ├── SessionConnectView.swift          # QR scanner and manual session input
    └── HaggleConfig.swift                # Server URL, Presage API key configuration
```

## Core Implementation

**Web App**

**`hal-prompt.ts`** - Constructs dynamic AI persona with hidden state (budget limits, tactics) and generates stress context strings injected into Gemini via `sendContextualUpdate()`.

**`session/[id]/page.tsx`** - Manages ElevenLabs conversation state, Socket.IO client for biometric data, stress calculation algorithm, and real-time UI updates.

**`reveal/[id]/page.tsx`** - Visualizes the AI Transformation Pipeline: timeline showing stress levels mapped to AI response modifications with Gemini post-analysis.

**`api/biometrics/route.ts`** - Socket.IO server handling iPhone connection events, biometric data streaming, and session room management.

**iOS App**

**`HaggleManager.swift`** - Integrates Presage SmartSpectra SDK for contactless biometrics, implements baseline calibration (fixed 10s window for consistency), calculates stress score using multi-signal weighted algorithm, and streams updates to web app via Socket.IO every 1.5 seconds.

**`SessionConnectView.swift`** - QR code scanner supporting deep links (`haggle://<sessionId>`), manual session ID input, and configurable server URL for local development.

**`MeasurementView.swift`** - Real-time camera view from Presage SDK with live heart rate, breathing rate, stress score, and confidence display.
