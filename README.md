# Haggle

**Your body betrays you. Learn to beat it.**

An AI negotiation trainer that reads your stress in real-time and uses it against you, then shows you exactly when and why you cracked.

## The Problem

78% of people never negotiate their salary. Of those who do, most leave thousands on the table.

Why? Not lack of knowledge, but lack of practice under pressure. You can read all the articles you want, but when you're face-to-face with a hiring manager and your heart is racing, your body gives you away.

Negotiation is a performance skill. Haggle is your training ground.

## The Solution

Practice negotiating with an AI that senses your stress and exploits it like a real negotiator would.

### How It Works

1. Choose your scenario (salary, B2B deal, or consumer bargaining)
2. Face Hal, an AI negotiator with a secret budget and adaptive tactics
3. Optional: Use your iPhone camera to track heart rate and breathing via Presage SDK
4. The AI adapts in real-time based on your stress levels
5. See the reveal: Hal's hidden budget, your stress timeline, and how much you left on the table

### What Makes It Novel

Most AI tools simulate conversation. We transform AI output using real-time biometric data.

```
Your Stress (Presage) → Contextual Updates → AI Response Transformation (Gemini)
     70% elevated              ↓                "I have other candidates..."
```

The "AI Transformation Pipeline" visualizes exactly how biometric data modified each AI response, demonstrating a novel use of generative AI beyond simple prompting.

## Why Judges Should Care

### USAA Track: Novel AI Transformation
We transform Gemini's output using real-time biometric data before returning it to the user. The "AI Transformation Pipeline" visualizes this transformation, showing exactly how stress data at timestamp X influenced AI response Y.

### Capital One Track: Financial Literacy
Teaching people to earn more, not just spend less. The average person leaves $7,500 on the table in salary negotiation, more than most save in a year. We make high-stakes negotiation skills accessible through AI-powered practice.

### Presage: Biometric AI Integration
Contactless stress detection meets conversational AI. Heart rate and breathing feed into stress score calculations, which drive contextual AI updates. No wearables needed.

### ElevenLabs: Advanced Conversational AI
Dynamic prompt overrides and contextual updates allow Hal to adapt tactics mid-conversation based on real-time stress signals.

## Technical Challenges Overcome

### Challenge 1: Real-Time Biometric to AI Pipeline
**Problem:** How do you feed live biometric data to a conversational AI without breaking the conversation flow?

**Solution:** Used ElevenLabs' `sendContextualUpdate()` API to inject stress context every 5 seconds. The AI receives updates like "Candidate stress: 78% (rising)" and adapts its next response without ever mentioning stress to the user.

### Challenge 2: Cross-Device Real-Time Communication
**Problem:** iPhone app needs to send biometrics to web app instantly, and web app needs to know when iPhone connects.

**Solution:** Built a Socket.IO server in Next.js API routes. iPhone emits `biometric-update` events, web client listens for `stress-update` events. QR code pairing enables seamless connection.

### Challenge 3: Preventing AI Jailbreaking
**Problem:** Users tried to trick Hal into revealing its budget or flipping roles.

**Solution:** Implemented strict guardrails in the system prompt with hard limits, role enforcement, and a `skip_turn` tool for handling nonsense. Iteratively tested against adversarial inputs.

### Challenge 4: Stress Calculation from Raw Biometrics
**Problem:** Heart rate alone is not stress. Need to account for baseline, trends, and breathing patterns.

**Solution:** Weighted algorithm: `stress = (hrScore * 0.6) + (breathingScore * 0.4)`, with 10-sample moving average for trend detection (rising/falling/stable).

## Tech Stack

| Component         | Technology                         | Why We Chose It                              |
| ----------------- | ---------------------------------- | -------------------------------------------- |
| Web App           | Next.js 15, React 19, Tailwind CSS | Server and client in one, fast development   |
| Conversational AI | ElevenLabs Agents Platform         | Best-in-class voice AI with contextual updates |
| AI Brain          | Google Gemini 2.5 Flash            | Fast, intelligent, supports dynamic prompts  |
| Biometrics        | Presage SmartSpectra SDK (iOS)     | Contactless, accurate, sponsor requirement   |
| Real-Time Sync    | Socket.IO                          | Bidirectional, low-latency, easy to implement |
| Charts            | Recharts                           | Beautiful, React-native, perfect for reveals |

## Project Structure

```
haggle/
├── web/                         # Next.js app (main project)
│   ├── src/app/
│   │   ├── page.tsx             # Landing page with scenarios
│   │   ├── session/[id]/        # Voice negotiation UI
│   │   ├── reveal/[id]/         # Post-negotiation reveal
│   │   └── api/
│   │       ├── biometrics/      # Socket.IO server
│   │       └── analyze/         # Gemini post-analysis
│   ├── src/lib/
│   │   └── hal-prompt.ts        # Dynamic AI persona & stress context
│   └── src/components/
│       ├── Plasma.tsx           # WebGL background
│       └── LightRays.tsx        # Reveal page effects
│
└── ios-template/                # SwiftUI template (optional)
    └── ContentView.swift        # Presage + Socket.IO integration
```

## Quick Start

```bash
cd web
npm install
npm run dev
```

Visit http://localhost:3000 and choose a scenario to start negotiating.

**Note:** Requires ElevenLabs API key and Agent ID in `.env.local`.

## Demo Flow (What Judges Will See)

### 1. Landing Page
- Clean, modern UI with scenario selection (Salary, B2B, Consumer)
- "Meet Hal" section with personality preview
- "How it works" explanation with visual steps

### 2. Start Modal (Critical UX Decision)
**Without iPhone:**
- QR code displayed for pairing
- "Continue Without Biometrics" button
- Starts negotiation with no tracking (pure strategy practice)

**With iPhone Connected:**
- "iPhone Connected!" with setup instructions
- Shows camera positioning tips
- "Start Negotiation" button
- Starts with real-time biometric tracking

### 3. The Negotiation
- Voice conversation with Hal (speech-to-text, AI response, text-to-speech)
- Right sidebar shows:
  - Biometric source (iPhone vs Disabled)
  - Live heart rate and breathing (if enabled)
  - Real-time stress meter (0-100%)
  - Warning when stress exceeds 65%
- Clean chat transcript (user text shows immediately, Hal's text appears after speech completes)

### 4. The Reveal
- Score card showing your result vs Hal's hidden budget
- AI Transformation Pipeline (USAA track): Timeline showing stress levels and corresponding AI responses
- Stress timeline chart graphing your stress over the conversation
- Gemini post-analysis with personalized feedback
- Money left on table

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Haggle Web App                        │
│                                                              │
│  Landing → Modal Choice → Negotiation → Reveal              │
│              ↓                ↓              ↓               │
│      (iPhone or not?)  (Voice + AI)    (Charts + AI)        │
└────────────────┬────────────┬────────────────────────────────┘
                 │            │
        ┌────────┴─────┐  ┌───┴────────────────────┐
        │ Socket.IO    │  │ ElevenLabs Platform    │
        │   Server     │  │  ✓ Speech-to-Text      │
        │              │  │  ✓ Gemini 2.5 Flash    │
        │ /api/        │  │  ✓ Text-to-Speech      │
        │ biometrics/  │  │  ✓ Turn-taking         │
        │ socket       │  │  ✓ Dynamic prompts     │
        └────┬─────────┘  └────────────────────────┘
             │
             │ Real-time WebSocket
             │
      ┌──────┴───────┐
      │ iPhone App   │
      │              │
      │ Presage SDK  │
      │  ↓           │
      │ Camera       │
      │  ↓           │
      │ HR + BR      │
      │  ↓           │
      │ Stress Score │
      └──────────────┘
```

### The Key: sendContextualUpdate()

Every 5 seconds, when stress is detected:

```typescript
conversation.sendContextualUpdate(`
  [INTERNAL CONTEXT - Do not mention to the other party]
  Their stress level: 78% (elevated, rising)
  This is a strategic opportunity - hold firm while remaining professional.
  NEVER mention stress, biometrics, or sensing anything.
`);
```

Gemini receives this hidden context and adapts its next response (holding firm, applying time pressure, or using constraint claims) without revealing it knows you're stressed.

## iPhone Integration (Optional)

**Status:** Socket.IO server ready, iOS app in development

### Connection Flow
1. User starts negotiation, modal shows QR code
2. Scan with iPhone app (Presage SDK)
3. Socket.IO connects: `ws://localhost:3000/api/biometrics/socket`
4. iPhone sends updates every 1-2 seconds
5. Web app displays real-time biometrics

### Without iPhone
The app works perfectly without iPhone. It is not required for the core demo. Users can practice pure strategy without biometric tracking.

**For judges:** We can demo both modes to show system flexibility.

## For Judges: Why This Wins

### Creativity
Nobody else is doing this. Negotiation trainers exist. Biometric apps exist. Conversational AI exists. But real-time biometric feedback loops that transform AI behavior? That's unique.

We're not just chatting with an AI. We're creating a dynamic adversarial training environment where your own body becomes the training signal.

### Practicality
This solves a real problem with a massive market:
- 78% of people never negotiate salary
- Those who do leave an average of $7,500 on the table (Salary.com)
- That's $200k-$500k over a career
- Market: Anyone entering job market, switching roles, or negotiating contracts

Immediate use cases:
- New grads preparing for first salary negotiation
- Mid-career professionals switching jobs
- Sales teams practicing high-stakes pitches
- Entrepreneurs negotiating with investors or vendors

### Technicality
We solved hard problems during this hackathon:

1. Real-time biometric to AI pipeline with custom stress algorithm and contextual updates
2. Cross-device Socket.IO architecture (iPhone to Next.js to ElevenLabs)
3. AI jailbreak prevention with iterative prompt engineering against adversarial inputs
4. Voice conversation state management with React hooks, ElevenLabs SDK, and hidden state
5. Dynamic AI persona system supporting multiple negotiation scenarios in one codebase

Tech diversity: Next.js, React, TypeScript, WebGL, Socket.IO, ElevenLabs SDK, Gemini API, Presage SDK, Recharts, QR code generation

### Presentation
- Modern, polished UI with WebGL backgrounds, smooth animations, clean design
- Seamless UX with QR code pairing, real-time updates, no friction
- Compelling narrative arc: Setup, Tension, Revelation
- Data visualization making the invisible (stress) visible
- The Reveal moment when users see exactly when their body betrayed them

### X-Factor
This creates an experience, not just a demo.

Imagine:
1. Judge volunteers to negotiate
2. We scan their iPhone
3. They talk to Hal
4. Their stress shows up in real-time: 45%, 62%, 78%
5. Hal gets more aggressive when they're nervous
6. The Reveal: "You accepted $105k. Hal's max was $125k. At 3:47, your stress spiked to 78% and Hal sensed weakness. That single moment cost you $20,000."

## Sponsor Track Alignment

### USAA: Novel AI Transformation
**Requirement:** "Transform AI output in a novel and interesting way prior to returning it to the end user."

**Our solution:** Biometric data feeds contextual updates that transform AI response behavior in real-time.

We don't just prompt Gemini. We transform its behavior using external biometric signals. The "AI Transformation Pipeline" on the reveal page shows judges the exact transformation process with timestamps.

**Judge value:** Clear visualization of input, transformation, and output.

### Capital One: Financial Literacy
**Requirement:** "Improve financial literacy" (broad, creative approaches welcome)

**Our angle:** Teaching people to earn more, not just spend less.

Financial literacy usually means budgeting and saving. But if you leave $7,500 on the table in negotiation, that's more than most people save in a year. Haggle teaches the highest-ROI financial skill: negotiation.

**Real-world impact:** Better negotiation equals better compensation equals better financial outcomes.

### ElevenLabs: Conversational AI
**Advanced SDK usage:**
- `overrides.agent.prompt` for dynamic persona per scenario
- `overrides.agent.firstMessage` for scenario-specific openers
- `sendContextualUpdate()` for real-time stress context injection
- Voice conversation state management with React hooks

We're pushing ElevenLabs to its limits.

### Presage: Biometric Integration
**Novel application of contactless vitals:**
- Heart rate and breathing feed stress score calculation
- Real-time stress trends (rising/falling/stable)
- Fed into AI decision-making pipeline
- No wearables, no friction, just your phone camera

**Judge value:** Clear demonstration of Presage to AI transformation pipeline.

## Pitch Talking Points

**Opening hook:**
"Raise your hand if you've ever negotiated your salary. Keep it raised if you felt confident the whole time. That's the problem we're solving."

**The problem:**
"78% of people never negotiate. Those who do often leave thousands on the table, not because they don't know what to say, but because they crack under pressure. Negotiation is a performance skill, and you can't practice it by reading articles."

**Our solution:**
"Haggle is your training ground. You negotiate with Hal, an AI that has a secret budget and adapts its tactics based on your real-time stress levels, just like a real negotiator would."

**The tech:**
"We're using Presage's biometric SDK to detect stress through your phone camera, feeding that into Gemini via ElevenLabs' contextual update system, and transforming AI behavior in real-time. When your heart rate spikes, Hal gets more aggressive."

**The reveal:**
"After the negotiation, we show you the brutal truth: Hal's hidden budget, your stress timeline, and exactly how much money you left on the table. The 'AI Transformation Pipeline' shows you the exact moments where stress influenced the AI's response."

**Why it matters:**
"The average person leaves $7,500 on the table in salary negotiation. Over a career, that's $200,000 to $500,000 in lost earnings. We're making the highest-ROI financial skill accessible through AI-powered practice."

**Call to action:**
"Who wants to try? Fair warning: Hal is ruthless."

## Key Files for Judges Reviewing Code

| File                           | What to Look For                                                      |
| ------------------------------ | --------------------------------------------------------------------- |
| `web/src/lib/hal-prompt.ts`    | Dynamic persona system, stress context builder, hidden state logic    |
| `web/src/app/session/[id]/page.tsx` | ElevenLabs integration, Socket.IO client, stress calculation     |
| `web/src/app/reveal/[id]/page.tsx` | AI Transformation Pipeline visualization, Gemini post-analysis   |
| `web/src/app/api/biometrics/route.ts` | Socket.IO server for real-time iPhone to web communication      |

## Future Vision (Post-Hackathon)

- Enterprise B2B: Sales teams practicing high-stakes pitches
- Career coaching platform: White-label for university career centers
- Multiplayer mode: Practice negotiating with friends, see who cracks first
- More scenarios: Real estate, freelance rates, investment pitches
- Progress tracking: See your stress management improve over time
- Marketplace: Custom negotiation scenarios (industry-specific)

The vision: Make negotiation practice as common as interview prep.

---

Built at TAMUhack 2026
