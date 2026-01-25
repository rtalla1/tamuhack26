## Inspiration

78% of people never negotiate their salary. Among those who do, most leave thousands of dollars on the table, not from lack of knowledge about negotiation tactics, but from cracking under psychological pressure.

We wanted to answer a question: what if an AI could sense when you were nervous and use that against you, just like a skilled human negotiator would? Traditional negotiation training relies on self-reported emotions or simulated scenarios. We set out to build something that reads your unconscious physiological signals and creates a genuinely challenging adversary that cannot be gamed.

## What it does

Haggle is an AI negotiation trainer that combines research-backed tactics with real-time biometric intelligence.

You negotiate with Hal, an AI trained on negotiation theory (Fisher & Ury's Getting to Yes, Voss's Never Split the Difference, Kahneman's anchoring research) who has a hidden budget. Using your iPhone's camera, Presage SDK monitors your heart rate, breathing rate, breathing depth, and speech patterns through contactless video analysis.

Every 2 seconds during the conversation, Google Gemini receives enriched stress context (score, trend, physiological flags) and dynamically adapts its negotiation tactics without revealing this awareness. When your stress spikes, Hal holds firm. When you're calm, Hal applies more pressure.

After the negotiation ends, the reveal page shows: Hal's hidden budget, your stress timeline, how much money you left on the table, and most critically, "Hal's Perspective" which displays the exact biometric context sent to Gemini alongside its responses. This proves the AI adaptation was real and happening in real-time, not simulated or retroactive.

## How we built it

**Full-Stack Architecture:**
- Next.js 15 web application with custom Node.js server for Socket.IO integration
- Native SwiftUI iOS app with Presage SmartSpectra SDK for contactless vital monitoring
- ElevenLabs Conversational AI for voice interaction with Google Gemini 2.5 Flash as the reasoning engine
- Real-time bidirectional communication pipeline: iPhone → Socket.IO → Next.js → ElevenLabs → Gemini

**The Stress Algorithm:**
We developed a multi-signal stress calculation combining heart rate deviation from baseline (60% weight), breathing rate deviation (25%), breathing amplitude penalty for shallow breathing (10%), and speech engagement bonus (-5%). Exponential weighted moving average smoothing provides stability without sacrificing responsiveness. A 10-second calibration period establishes personalized baseline vitals for accurate stress detection.

**AI Behavior Transformation:**
The technical challenge was making Gemini genuinely adaptive, not just conversational. We built a system that constructs enriched context strings with stress score, trend, and physiological flags, then injects them via ElevenLabs' `sendContextualUpdate()` API every 2 seconds. Every update is logged with timestamps and stored for transparency. The reveal page displays these verbatim alongside Hal's responses, providing proof of real-time AI transformation.

**Negotiation Intelligence:**
We synthesized negotiation research into a comprehensive knowledge base covering principled negotiation frameworks, tactical empathy, anchoring psychology, concession patterns, and domain-specific strategies for salary, B2B, and consumer scenarios. Hal's system prompt includes strict guardrails preventing budget violations, role-switching, and conversational stalling tactics.

## Challenges we ran into

**Cross-Platform Real-Time Communication:**
Next.js App Router doesn't expose the HTTP server needed for Socket.IO. We had to build a custom Node.js server that runs Next.js while properly initializing Socket.IO on the same instance. Designing the event architecture for connection lifecycle, calibration status, and biometric streaming required careful state management across three layers: iOS app, Node.js server, and React client.

**Contactless Biometric Data Collection:**
Presage SDK's default UI required manual user interaction. We needed fully automatic data collection for seamless experience. After extensive documentation review and testing, we implemented the headless `SmartSpectraVitalsProcessor` approach with proper camera lifecycle management, allowing automatic biometric streaming without user intervention.

**Stress Algorithm Stability vs Responsiveness:**
Raw biometric data is noisy. Simple moving averages created lag. Raw values were too jumpy. We tested multiple approaches and ultimately implemented exponential weighted moving average (alpha = 0.4) which responds to real stress changes in 3-4 seconds while filtering noise. Combining multiple signals (heart rate, breathing rate, amplitude, speech) proved more accurate than any single metric.

**AI Adaptation Without Breaking Character:**
Injecting stress context into a live conversation without making Hal sound robotic was challenging. We crafted context strings that inform tactics while staying invisible to the user. The system prompt includes guardrails preventing phrases like "let me check with my team" or "I'll get back to you" which would break the real-time negotiation flow. Every response must move the conversation forward with an offer, counteroffer, or substantive point.

**Proving Real AI Transformation:**
Users might think biometric data is just displayed for show. We implemented comprehensive logging of every contextual update sent to Gemini, capturing the exact text, timestamp, stress score, and associated message index. The reveal page displays these verbatim in purple code boxes alongside Hal's responses, providing transparent proof that AI behavior modification is real, not simulated.

## Accomplishments that we're proud of

**Built a Complete System in 36 Hours:**
A polished Next.js web application, native SwiftUI iOS app with SDK integration, custom WebSocket server, multi-signal stress algorithm with baseline calibration, dynamic AI prompt injection, and comprehensive reveal page with transparency logging.

**Novel AI Application:**
This demonstrates AI transformation beyond text generation. Gemini receives live physiological intelligence and adapts behavior based on unconscious signals that cannot be faked. The reveal page provides proof with exact contextual updates displayed alongside AI responses.

**Zero-Configuration UX:**
The QR code embeds both session ID and server URL. Scanning it auto-configures the iOS app completely. The iOS landing page hides manual configuration by default, creating an elegant experience.

**Financial Literacy Impact:**
The reveal page now includes a "Financial Literacy Lesson" section that explains how negotiation skills compound over time. A $5,000 salary increase becomes $200,000+ in lifetime earnings. This transforms negotiation practice into genuine financial empowerment.

**Research-Backed Intelligence:**
Hal is not a simple chatbot. The knowledge base synthesizes negotiation theory from multiple sources (Fisher & Ury, Chris Voss, Kahneman) with domain-specific tactics for different scenarios. Combined with biometric intelligence, this creates a genuinely challenging adversary.

## What we learned

**Real-Time Biometric Integration:**
We learned how to build pipelines that feed live physiological data to conversational AI systems. ElevenLabs' `sendContextualUpdate()` API enables context injection without breaking conversation flow. Proper throttling (every 2 seconds) balances responsiveness with API efficiency.

**Cross-Platform WebSocket Architecture:**
Building real-time bidirectional communication between native iOS apps and web applications requires careful event design. We learned to distinguish client types (iOS vs web), manage connection lifecycle properly, and handle state synchronization across multiple layers.

**Stress Detection Algorithm Design:**
We learned that accurate stress detection requires multiple signals, personalized baselines, and smart smoothing. Exponential weighted moving average provides better responsiveness than simple moving average. Speech engagement and breathing depth are valuable secondary signals that improve accuracy.

**AI Prompt Engineering:**
We learned how to make AI adaptive rather than just conversational. Injecting contextual updates mid-conversation while maintaining character requires careful prompt design. Guardrails are essential for preventing budget violations, role-switching, and conversational stalling.

**Building for Transparency:**
The most important learning: users need proof, not promises. Logging every AI input and displaying it alongside outputs builds trust and demonstrates technical sophistication. Transparency separates genuine innovation from smoke and mirrors.

## What's next for Haggle

**Expanded Biometric Signals:**
Integrate additional metrics like facial micro-expressions, eye tracking, and vocal stress analysis for more comprehensive psychological profiling. Multi-modal stress detection could reveal not just that someone is stressed, but why.

**Personalized Training Paths:**
Track performance across multiple negotiation sessions and identify specific weaknesses. Build custom training scenarios targeting areas where users consistently crack under pressure.

**Multiplayer Mode:**
Enable two humans to negotiate with live biometric feedback visible to both parties (with consent). This creates unprecedented transparency in real negotiations and could be used for mediation or conflict resolution.

**Integration with Real Negotiations:**
Partner with HR platforms and career counseling services to provide pre-negotiation practice. Users could rehearse their actual upcoming salary negotiation with Hal configured to their specific situation and company budget ranges.

**Advanced AI Models:**
Experiment with reinforcement learning where Hal learns optimal tactics based on thousands of negotiation outcomes. Fine-tune models specifically on negotiation conversations to improve tactical sophistication beyond general-purpose LLMs.
