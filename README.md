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
Heart Rate + Breathing Analysis
    ↓
Stress Score Calculation
    ↓
Socket.IO → Next.js Server
    ↓
sendContextualUpdate() (every 5s)
    ↓
ElevenLabs → Gemini (receives stress context, adapts tactics)
    ↓
Streaming Voice Response
```

## Technical Challenges Solved

**Real-Time Biometric Integration**  
Built a pipeline that feeds live biometric data to a conversational AI without breaking conversation flow. Uses ElevenLabs' `sendContextualUpdate()` API to inject stress context every 5 seconds, allowing Gemini to adapt tactics mid-conversation.

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
└── ios-template/                         # Presage SDK + Socket.IO integration
    └── ContentView.swift
```

## Core Implementation

**`hal-prompt.ts`** - Constructs dynamic AI persona with hidden state (budget limits, tactics) and generates stress context strings injected into Gemini via `sendContextualUpdate()`.

**`session/[id]/page.tsx`** - Manages ElevenLabs conversation state, Socket.IO client for biometric data, stress calculation algorithm, and real-time UI updates.

**`reveal/[id]/page.tsx`** - Visualizes the AI Transformation Pipeline: timeline showing stress levels mapped to AI response modifications with Gemini post-analysis.

**`api/biometrics/route.ts`** - Socket.IO server handling iPhone connection events, biometric data streaming, and session room management.
