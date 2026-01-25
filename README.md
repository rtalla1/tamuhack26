# Haggle

**Your body betrays you. Learn to beat it.**

An AI salary negotiation trainer that reads your real-time stress levels and uses them against you—then reveals exactly when and why you cracked.

## What It Does

1. **Negotiate with Hal** - An AI hiring manager with a secret budget and hidden tactics
2. **Real-time biometrics** - Your phone tracks heart rate and breathing via Presage
3. **Stress-adaptive AI** - Hal receives contextual updates about your stress and adapts
4. **The Reveal** - See Hal's hidden budget, your stress timeline, and how much money you left on the table

## Tech Stack

| Component | Technology |
|-----------|------------|
| Web App | Next.js 15, React 19, Tailwind CSS |
| Conversational AI | ElevenLabs Agents Platform |
| AI Brain | Google Gemini (via ElevenLabs) |
| Biometrics | Presage SmartSpectra SDK (iOS) |
| Charts | Recharts |

## Project Structure

```
haggle/
├── web/                     # Next.js web application
│   ├── src/
│   │   ├── app/             # Pages and API routes
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── session/     # Negotiation session
│   │   │   └── reveal/      # Post-negotiation reveal
│   │   ├── lib/             # Core logic
│   │   │   ├── hal-prompt.ts    # Hal's persona & hidden state
│   │   │   ├── store.ts         # Session storage
│   │   │   └── stress.ts        # Stress calculation
│   │   └── hooks/           # React hooks
│   └── .env.local           # API keys
│
└── ios/                     # iOS sensor app (Presage)
    └── HaggleSensor/        # Xcode project (to be built)
```

## Setup

### 1. Create ElevenLabs Agent

1. Go to [elevenlabs.io/app/conversational-ai](https://elevenlabs.io/app/conversational-ai)
2. Click **Create Agent**
3. Configure:
   - **Name**: Hal
   - **LLM**: Select **Gemini 2.5 Flash** (or Gemini 2.0 Flash)
   - **Voice**: Pick a professional voice (e.g., Adam, Antoni)
   - **First Message**: Leave blank (we override this)
   - **System Prompt**: Leave blank (we override this)
4. Copy the **Agent ID** from the URL or settings

### 2. Configure Environment

Edit `web/.env.local`:

```bash
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GEMINI_API_KEY=your_gemini_api_key  # Optional, for backup
```

### 3. Run the App

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:3000**

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Haggle Web App                    │
│                                                     │
│  useConversation() from @elevenlabs/react           │
│    ├─ overrides.agent.prompt = Hal's persona        │
│    ├─ overrides.agent.llm = "gemini-2.5-flash"      │
│    └─ sendContextualUpdate("Stress: 78%")           │
│                                                     │
└──────────────────────────│──────────────────────────┘
                           │
                    ElevenLabs handles:
                    ✓ Voice input (STT)
                    ✓ LLM calls (Gemini)
                    ✓ Voice output (TTS)
                    ✓ Turn-taking
```

### The Magic: `sendContextualUpdate`

When biometrics indicate elevated stress, we send:

```typescript
conversation.sendContextualUpdate(`
  [INTERNAL CONTEXT - Do not mention to candidate]
  Candidate stress level: 78% (elevated, rising)
  This is a strategic opportunity - hold firm while remaining professional.
`);
```

Hal receives this context and adapts negotiation tactics accordingly—without ever revealing that it knows.

### The Reveal

After the negotiation ends, we show:
- **AI Transformation Pipeline** (USAA Challenge) - How stress data transformed Gemini's responses
- Hal's **hidden budget** (what they could have paid)
- Your **stress timeline** (when you spiked)
- **Money left on table** (the difference)
- **Tactics analysis** and personalized feedback

## iOS Sensor App Integration

### Status: ✅ Server Ready | 🔄 iOS App In Progress

The web app now has **full Socket.IO integration** to receive real-time biometric data from the iOS companion app.

### How It Works

```
iPhone (Presage SDK) → Socket.IO → Web App → ElevenLabs/Gemini
  📱 Heart rate          🔌 Real-time    💻 Stress gauge    🧠 AI adapts
  📱 Breathing           🔌 WebSocket    💻 QR code pairing  🧠 Tactics shift
```

### For Web App Users (Already Implemented)

1. **Start a negotiation session**
2. **Click "Connect iPhone"** in the biometrics panel
3. **Scan QR code** with Haggle iOS app
4. **iPhone connects automatically** via Socket.IO
5. **Real-time stress data** replaces simulated data

### For iOS App Development

**Socket.IO Endpoint:** `ws://localhost:3000/api/biometrics/socket`

**Events to implement:**
```typescript
// 1. Connect and join session
socket.emit('join-session', sessionId);

// 2. Send biometric updates (every 1-2 seconds)
socket.emit('biometric-update', {
  sessionId: string,
  heartRate: number,        // bpm
  breathingRate: number,    // breaths/min
  stressScore: number,      // 0-100
  confidence: number,       // 0-1 (optional)
  timestamp: number         // milliseconds
});

// 3. Listen for connection confirmation
socket.on('ios-connected', (data) => {
  console.log('Connected to session:', data);
});
```

### Testing Without iOS

The web app includes **simulated biometrics** that work identically to real data for development and demo purposes.

## Key Files

| File | Purpose |
|------|---------|
| `lib/hal-prompt.ts` | Hal's persona, hidden state, and stress-context builder |
| `app/session/[id]/page.tsx` | Main negotiation UI with ElevenLabs integration |
| `app/reveal/[id]/page.tsx` | Post-negotiation reveal with charts |

## Submission Notes

### ElevenLabs (Conversational AI)
> "We use ElevenLabs Conversational AI with dynamic prompt overrides and contextual updates. Stress data from Presage is sent via `sendContextualUpdate()`, allowing Hal to adapt tactics in real-time without the user knowing."

### Gemini
> "Gemini powers Hal's negotiation intelligence through ElevenLabs' native integration. The prompt includes hidden state (budget limits) and instructions to exploit stress opportunities."

### Presage
> "Presage's contactless biometrics detect stress in real-time. Heart rate and breathing patterns are used to calculate a stress score, which is fed to the AI negotiator."

### USAA (Novel AI Transformation)
> "We use generative AI (Gemini) and transform its output in a novel way using real-time biometric data from Presage. User stress → contextual updates → adaptive AI responses. The 'AI Transformation Pipeline' on our reveal page visualizes exactly how stress data modified each AI response."

### Capital One (Financial Literacy)
> "Most financial literacy tools teach you to spend less. Haggle teaches you to earn more. The average person leaves $7,000 on the table—more than most save in a year. We make negotiation skills accessible through AI-powered practice with real-time feedback."
