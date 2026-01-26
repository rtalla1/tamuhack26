<div align="center">
  <img src="https://github.com/user-attachments/assets/4faf0c9c-8286-4562-9649-9ed9bce23594" alt="Haggle Landing Page" style="max-width: 60% height: auto;" />
  <h1>Haggle</h1>
</div>

**Your body betrays you. Learn to beat it.**

Haggle is an AI negotiation trainer that reads your stress in real-time and uses it against you, then reveals exactly when and why you cracked.

## What It Does

78% of people never negotiate their salary. Those who do often leave thousands on the table, not from lack of knowledge, but from cracking under pressure.

Haggle provides a training ground where you negotiate with Hal, an AI that senses your stress and exploits it like a real negotiator would.

**How It Works:**
1. Select a negotiation scenario (salary, B2B, or consumer)
2. Face Hal, an AI trained on negotiation research (Fisher & Ury's "Getting to Yes", Voss's "Never Split the Difference", Kahneman's anchoring research) with a hidden budget
3. Optional: Connect iPhone for contactless biometric monitoring (Presage SDK)
4. Gemini receives enriched physiological context every 2 seconds and adapts research-backed tactics mid-conversation
5. Review the results: Hal's hidden budget, your stress timeline, and where you left money on the table

**This is NOT a chatbot.** Hal combines expert negotiation tactics with live biometric intelligence to create an adaptive adversary that responds to both your arguments AND your unconscious physiological signals.

**The Approach:**

Most AI negotiators follow scripts. Haggle transforms AI behavior using real-time physiological intelligence. Every 2 seconds, Gemini receives live stress updates from contactless biometric monitoring and dynamically adapts negotiation tactics without revealing awareness. Users cannot fake or control their unconscious stress responses, giving Hal authentic insight into psychological state.

```
Stress Detection (Presage) → Contextual Updates → AI Behavior Transformation (Gemini)
```

## Tech Stack

| Component | Technology | 
| --------- | ---------- |
| Web App | Next.js 15, React 19, Tailwind CSS |
| Voice AI | ElevenLabs Conversational AI |
| AI Brain | Google Gemini 2.5 Flash |
| AI Training | Negotiation research (Fisher & Ury, Voss, Kahneman) |
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

## Why This Is NOT a Chatbot

**The Key Distinction:**
- **Chatbots**: Pre-programmed responses or simple LLM conversation
- **Haggle**: Research-trained AI + Real-time physiological intelligence = Adaptive negotiation behavior

**The Innovation (Two-Layer Intelligence):**

**Layer 1: Expert Training**
Hal is trained on negotiation research and theory:
- Principled negotiation frameworks (Fisher & Ury)
- FBI hostage negotiation tactics (Chris Voss)
- Behavioral economics (Kahneman's anchoring, loss aversion)
- Domain-specific expertise (salary bands, SaaS pricing, marketplace psychology)

**Layer 2: Biometric Transformation**
Every 2 seconds, Gemini receives enriched biometric context (stress score, trend, HR/BR flags, breathing depth, speech status) and dynamically modifies those research-backed tactics without revealing this awareness. Users cannot fake their stress responses, giving Hal authentic psychological insight.

**Proof, Not Performance:**
The reveal page shows **"Hal's Perspective"** - the exact contextual updates sent to Gemini alongside Hal's responses. This isn't simulated or retroactive; it's logged in real-time during conversation. Judges can see precisely how stress data transformed AI behavior.

This demonstrates **novel use of AI** - not pattern matching or scripted responses, but genuine adaptive intelligence that combines expert knowledge with real-time human physiology.

## Technical Challenges Solved

**Negotiation AI Training**  
Integrated negotiation theory and research into Hal's knowledge base: principled negotiation (Getting to Yes), tactical empathy (Never Split the Difference), anchoring and loss aversion (Kahneman), and concession patterns (Leigh Thompson). Domain-specific tactics for salary, B2B, and consumer scenarios based on market research and expert knowledge.

**Real-Time Biometric Integration**  
Built a pipeline that feeds live biometric data to a conversational AI without breaking conversation flow. Uses ElevenLabs' `sendContextualUpdate()` API to inject stress context every 2 seconds for real-time responsive adaptation, allowing Gemini to adapt tactics mid-conversation. **Full transparency**: Logs every contextual update sent to Hal and displays them on the reveal page, proving AI adaptation isn't simulated.

**Cross-Device Architecture**  
Implemented Socket.IO server in Next.js API routes for iPhone to web to AI communication. QR code pairing with embedded server URL enables instant, zero-configuration connection. iPhone emits biometric updates, web client receives stress data, AI adapts behavior.

**AI Behavior Guardrails**  
Prevented common exploits through prompt engineering: budget limit enforcement, role-switching prevention, and a `skip_turn` tool for handling adversarial inputs. Iteratively tested against various jailbreak attempts.

**Multi-Signal Stress Algorithm**  
Developed sophisticated weighted calculation: `stress = 50 + (hr_deviation × 60) + (br_deviation × 25) + amplitude_penalty - talking_bonus`. Incorporates 10-second baseline calibration, breathing depth analysis, speech engagement detection, and exponential weighted moving average (EWMA) smoothing for stable yet responsive readings. Outputs 0-100% score with trend analysis (rising/falling/stable).

## Quick Start

### Local Development
```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

**iOS App Setup:**
1. Open `ios/HaggleSensor.xcodeproj` in Xcode
2. Build and run on physical iPhone
3. Scan QR code from web app (auto-configures everything)

Requires ElevenLabs API key and Agent ID in `web/.env.local`

### Deployment (Vercel)
```bash
cd web
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `GEMINI_API_KEY`

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
├── ios/HaggleSensor/                     # Complete iOS app with Presage SDK integration
│   ├── HaggleManager.swift               # Socket.IO client, stress calculation, baseline calibration
│   ├── ContentView.swift                 # Main app navigation
│   ├── MeasurementView.swift             # Camera biometrics display
│   ├── SessionConnectView.swift          # QR scanner and manual session input
│   └── HaggleConfig.swift                # Server URL, Presage API key configuration
│
├── ELEVENLABS_KNOWLEDGE_BASE.txt         # Hal's AI training: negotiation research & domain tactics
└── NEGOTIATION_RESEARCH.md               # Research sources and frameworks (Fisher, Voss, Kahneman)
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
