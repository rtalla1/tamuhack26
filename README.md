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
- Hal's **hidden budget** (what they could have paid)
- Your **stress timeline** (when you spiked)
- **Money left on table** (the difference)

## iOS Sensor App (Optional)

For real biometrics, build the iOS app with Presage SDK:

1. Open `ios/HaggleSensor` in Xcode
2. Add Presage SDK via CocoaPods/SPM
3. Configure your Presage API key
4. Build and run on a real iPhone

The iOS app sends biometric data via Socket.IO to the web app.

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

### Capital One (Financial Literacy)
> "Most financial literacy tools teach you to spend less. Haggle teaches you to earn more. The average person leaves $7,000 on the table—more than most save in a year."
