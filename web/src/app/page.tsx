"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GradientText from "@/components/GradientText";
import Plasma from "@/components/Plasma";

interface Scenario {
  id: string;
  name: string;
  description: string;
  category: "salary" | "b2b" | "consumer";
  openingOffer: number;
  targetPrice: number;
  walkAwayPrice: number;
}

const SCENARIOS: Scenario[] = [
  // Salary negotiations - for individuals
  {
    id: "mid",
    name: "Job Offer",
    description: "Software engineer role",
    category: "salary",
    openingOffer: 78000,
    targetPrice: 85000,
    walkAwayPrice: 95000,
  },
  {
    id: "senior",
    name: "Senior Role",
    description: "Tech lead position",
    category: "salary",
    openingOffer: 120000,
    targetPrice: 135000,
    walkAwayPrice: 155000,
  },
  // B2B - for companies/procurement
  {
    id: "saas-vendor",
    name: "SaaS Contract",
    description: "Negotiating software licenses",
    category: "b2b",
    openingOffer: 50000,
    targetPrice: 42000,
    walkAwayPrice: 35000,
  },
  {
    id: "consulting",
    name: "Consulting Deal",
    description: "Agency retainer negotiation",
    category: "b2b",
    openingOffer: 15000,
    targetPrice: 12000,
    walkAwayPrice: 9000,
  },
  // Consumer - everyday negotiations
  {
    id: "used-car",
    name: "Used Car",
    description: "Private seller, listed at $18k",
    category: "consumer",
    openingOffer: 18000,
    targetPrice: 16000,
    walkAwayPrice: 14500,
  },
  {
    id: "freelance",
    name: "Freelance Gig",
    description: "Client wants a website",
    category: "consumer",
    openingOffer: 2000,
    targetPrice: 3500,
    walkAwayPrice: 5000,
  },
];

const CATEGORY_LABELS = {
  salary: "Career",
  b2b: "Business",
  consumer: "Everyday",
};

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(
    SCENARIOS[1],
  );
  const [devMode, setDevMode] = useState(false);

  // Generate scenario-specific context for Hal
  const getScenarioContext = (scenario: Scenario) => {
    const price = `$${scenario.openingOffer.toLocaleString()}`;
    
    const contexts: Record<
      string,
      { role: string; situation: string; opener: string }
    > = {
      mid: {
        role: "a hiring manager at a tech company",
        situation: "a software engineering job offer",
        opener: `Thanks for coming in today. I've reviewed your background and I'm impressed. Let's talk compensation. Based on our budget and the role's scope, I'd like to offer you ${price} annually. How does that sound?`,
      },
      senior: {
        role: "VP of Engineering at a Series B startup",
        situation: "a senior tech lead position",
        opener: `I appreciate you making time for this. We've been really impressed with your experience. For this senior role, we're looking at ${price} annually. What are your thoughts?`,
      },
      "saas-vendor": {
        role: "an enterprise sales rep at a software company",
        situation: "an annual SaaS license contract",
        opener: `Thanks for taking my call. I've put together a proposal for your team's software needs. For the package we discussed, we're looking at ${price} annually. How does that work for your budget?`,
      },
      consulting: {
        role: "a partner at a consulting firm",
        situation: "a monthly consulting retainer",
        opener: `Thanks for considering us for this engagement. Based on the scope you described, I've prepared a proposal for ${price} per month. Does that align with what you were expecting?`,
      },
      "used-car": {
        role: "a private seller on Facebook Marketplace",
        situation: "a used 2019 Honda Civic",
        opener: `Hey, thanks for coming by to see the car. So yeah, as I mentioned in the listing, I'm asking ${price}. It's in great shape. What do you think?`,
      },
      freelance: {
        role: "a potential client looking for web development",
        situation: "a custom website project",
        opener: `Thanks for getting back to me. So I need a website for my small business. I'm thinking something professional but not too fancy. My budget is around ${price}. Can you work with that?`,
      },
    };
    return contexts[scenario.id] || contexts["mid"];
  };

  const startSession = async (isDev = false) => {
    setIsCreating(true);

    const scenarioContext = getScenarioContext(selectedScenario);
    const config = {
      openingOffer: selectedScenario.openingOffer,
      targetPrice: selectedScenario.targetPrice,
      walkAwayPrice: selectedScenario.walkAwayPrice,
      scenarioId: selectedScenario.id,
      scenarioCategory: selectedScenario.category,
      scenarioName: selectedScenario.name,
      scenarioRole: scenarioContext.role,
      scenarioSituation: scenarioContext.situation,
      scenarioOpener: scenarioContext.opener,
    };

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.id) {
        localStorage.setItem(
          `haggle-config-${data.id}`,
          JSON.stringify(config),
        );
        router.push(`/session/${data.id}${isDev ? "?dev=true" : ""}`);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a 
            href="/"
            className="flex items-center gap-2 bg-gradient-to-r from-neutral-600/80 to-neutral-900/80 backdrop-blur-md rounded-full px-3 py-2 border border-white/10 hover:border-white/20 transition-colors"
          >
            <Image src="/favicon.ico" alt="Haggle" width={24} height={24} />
            <span className="font-bold">Haggle</span>
          </a>
          
          {/* Pill Nav */}
          <div className="flex items-center gap-1 bg-neutral-900/80 backdrop-blur-md rounded-full px-1 py-1 border border-white/10">
            <button 
              onClick={() => {
                document.getElementById('meet-hal')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-full text-sm text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Meet Hal
            </button>
            <button 
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-full text-sm text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              How it Works
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        {/* Plasma Background - exact React Bits pattern */}
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
          <Plasma
            color="#ff6b35"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.8}
            mouseInteractive={true}
          />
          {/* Bottom fade to blend into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center pt-20 px-6">
          <div className="max-w-6xl mx-auto w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left */}
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
                  Stop leaving money on the table.
                </h1>

                <p className="text-xl text-neutral-400 mb-8 leading-relaxed">
                  Most people accept the first offer. Haggle trains you to
                  negotiate under pressure with an AI that{" "}
                  <GradientText
                    colors={["#ef4444", "#f97316", "#ef4444"]}
                    animationSpeed={1.5}
                    showBorder={false}
                    className="inline"
                    yoyo={false}
                  >
                    reads your stress
                  </GradientText>{" "}
                  and uses it against you.
                </p>

                <div className="relative">
                  <button
                    onClick={() => setShowSetup(!showSetup)}
                    className="group bg-white text-black text-lg font-semibold px-8 py-4 rounded-full hover:bg-neutral-200 transition-all"
                  >
                    Practice now
                    <span
                      className={`inline-block ml-2 transition-transform ${showSetup ? "rotate-90" : "group-hover:translate-x-1"}`}
                    >
                      →
                    </span>
                  </button>

                  {showSetup && (
                    <div className="absolute top-full left-0 mt-4 w-[420px] bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-2xl z-20">
                      <h3 className="font-semibold mb-4">Pick your fight</h3>

                      <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
                        {(["salary", "b2b", "consumer"] as const).map(
                          (category) => (
                            <div key={category}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex-1 h-px bg-neutral-700" />
                                <span className="text-xs text-neutral-500 uppercase tracking-wider">
                                  {CATEGORY_LABELS[category]}
                                </span>
                                <div className="flex-1 h-px bg-neutral-700" />
                              </div>
                              <div className="space-y-2">
                                {SCENARIOS.filter(
                                  (s) => s.category === category,
                                ).map((scenario) => (
                                  <button
                                    key={scenario.id}
                                    onClick={() =>
                                      setSelectedScenario(scenario)
                                    }
                                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                                      selectedScenario.id === scenario.id
                                        ? "bg-white text-black border-white"
                                        : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="font-medium text-sm">
                                          {scenario.name}
                                        </div>
                                        <div
                                          className={`text-xs ${selectedScenario.id === scenario.id ? "text-neutral-600" : "text-neutral-500"}`}
                                        >
                                          {scenario.description}
                                        </div>
                                      </div>
                                      <div
                                        className={`text-right ${selectedScenario.id === scenario.id ? "text-neutral-600" : "text-neutral-500"}`}
                                      >
                                        <div className="text-sm font-mono">
                                          $
                                          {scenario.openingOffer.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      <button
                        onClick={() => startSession(false)}
                        disabled={isCreating}
                        className="w-full bg-white text-black font-semibold py-4 rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-50"
                      >
                        {isCreating ? "Loading..." : "Let's go"}
                      </button>

                      {/* Dev mode button */}
                      <button
                        onClick={() => startSession(true)}
                        disabled={isCreating}
                        className="w-full mt-2 bg-transparent text-neutral-500 font-medium py-2 rounded-full hover:text-neutral-300 transition-colors disabled:opacity-50 text-sm"
                      >
                        🛠️ Dev mode (no voice)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right - Mock UI */}
              <div className="hidden lg:block">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-8 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-[40px] blur-3xl"></div>

                  {/* Mock conversation */}
                  <div className="relative bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
                    {/* Stress indicator */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-sm text-neutral-500">
                          stress detected
                        </span>
                      </div>
                      <div className="text-2xl font-mono text-red-400">73%</div>
                    </div>

                    {/* Stress bar */}
                    <div className="h-2 bg-neutral-800 rounded-full mb-6 overflow-hidden">
                      <div className="h-full w-[73%] bg-gradient-to-r from-yellow-500 to-red-500 rounded-full"></div>
                    </div>

                    {/* Chat */}
                    <div className="space-y-4">
                      <div className="bg-neutral-800 rounded-2xl rounded-bl-md p-4 max-w-[85%]">
                        <p className="text-sm text-neutral-400 mb-1">Hal</p>
                        <p className="text-neutral-200">
                          &quot;I can see this is important to you, but I need to 
                          be honest. $82,000 is really stretching our
                          budget...&quot;
                        </p>
                      </div>

                      <div className="bg-white text-black rounded-2xl rounded-br-md p-4 max-w-[85%] ml-auto">
                        <p className="text-sm text-neutral-600 mb-1">You</p>
                        <p>
                          &quot;I appreciate that, but based on my
                          research...&quot;
                        </p>
                      </div>
                    </div>

                    {/* Hal's insight */}
                    <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-xs text-red-400 font-medium mb-1">
                        🎭 Hal noticed
                      </p>
                      <p className="text-sm text-neutral-400">
                        Your heart rate jumped when he said &quot;stretching our
                        budget.&quot; He&apos;ll push harder.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Hal */}
      <section id="meet-hal" className="py-32 px-6 bg-[#141414] relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm text-neutral-500 uppercase tracking-wider mb-4">
                Meet your opponent
              </div>
              <h2 className="text-5xl font-bold mb-6">
                This is <span className="text-orange-500">Hal</span>.
              </h2>
              <p className="text-xl text-neutral-400 mb-6 leading-relaxed">
                Hal is an AI negotiator with one job: get the best deal for himself. 
                He has a hidden budget, secret tactics, and years of negotiation 
                training baked into his neural networks.
              </p>
              <p className="text-xl text-neutral-400 mb-6 leading-relaxed">
                But here&apos;s what makes him different:{" "}
                <span className="text-white font-medium">
                  Hal can read your stress in real-time.
                </span>{" "}
                When your heart rate spikes or your breathing quickens, he knows 
                you&apos;re nervous. He&apos;ll use that against you.
              </p>
              <p className="text-xl text-neutral-400">
                After each session, you&apos;ll see exactly what Hal knew, when he 
                exploited you, and how to do better next time.
              </p>
            </div>
            
            <div className="bg-[#0f0f0f] rounded-3xl p-8 border border-neutral-800">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="text-2xl font-bold">Hal&apos;s Arsenal</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-neutral-800/50 rounded-2xl">
                  <div>
                    <div className="font-medium text-white">Hidden Limits</div>
                    <div className="text-sm text-neutral-400">Secret walk-away price and target you&apos;ll never see</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-neutral-800/50 rounded-2xl">
                  <div>
                    <div className="font-medium text-white">Proven Tactics</div>
                    <div className="text-sm text-neutral-400">Anchoring, silence, time pressure, empathy plays</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-neutral-500/10 rounded-2xl border border-red-500/20">
                  <div>
                    <div className="font-medium text-red-400">Stress Detection</div>
                    <div className="text-sm text-neutral-400">Reads your biometrics and adapts in real-time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom fade to blend into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-32 px-6 bg-[#0a0a0a] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-neutral-500 text-lg">
              A 5-minute session that&apos;ll change how you negotiate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-[#141414] p-8 rounded-3xl border border-neutral-800 hover:border-neutral-700 transition-colors relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">1</div>
              <h3 className="text-xl font-bold mb-3 text-white">
                Pick a scenario
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                Choose from job offers, vendor contracts, used cars, or freelance gigs. 
                Each has different stakes and tactics.
              </p>
            </div>

            <div className="bg-[#141414] p-8 rounded-3xl border border-neutral-800 hover:border-neutral-700 transition-colors relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">2</div>
              <h3 className="text-xl font-bold mb-3 text-white">
                Negotiate with Hal
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                Talk out loud — Hal responds in real-time voice. Your camera tracks 
                your stress while you try to get the best deal.
              </p>
            </div>

            <div className="bg-[#141414] p-8 rounded-3xl border border-neutral-800 hover:border-neutral-700 transition-colors relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">3</div>
              <h3 className="text-xl font-bold mb-3 text-white">See the reveal</h3>
              <p className="text-neutral-400 leading-relaxed">
                After the deal, see Hal&apos;s hidden state, your stress timeline, 
                and exactly how much money you left on the table.
              </p>
            </div>
          </div>

          {/* What you'll need */}
          <div className="bg-[#141414] rounded-3xl p-8 border border-neutral-800">
            <h3 className="text-xl font-bold mb-6 text-center">What you&apos;ll need</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-2xl">🎤</div>
                <div>
                  <div className="font-medium text-white">A microphone</div>
                  <div className="text-sm text-neutral-500">To talk with Hal</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-2xl">📷</div>
                <div>
                  <div className="font-medium text-white">The Haggle iOS app</div>
                  <div className="text-sm text-neutral-500">For camera-based stress detection</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-2xl">🔇</div>
                <div>
                  <div className="font-medium text-white">A quiet space</div>
                  <div className="text-sm text-neutral-500">Hal listens carefully</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom fade to blend into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      </section>

      {/* The problem */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-8">The uncomfortable truth</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-6xl font-bold font-mono text-red-500 mb-2">
                85%
              </div>
              <p className="text-neutral-500">
                of people accept the first offer without negotiating
              </p>
            </div>
            <div>
              <div className="text-6xl font-bold font-mono text-red-500 mb-2">
                63%
              </div>
              <p className="text-neutral-500">
                report feeling anxious or stressed during negotiations
              </p>
            </div>
            <div>
              <div className="text-6xl font-bold font-mono text-green-500 mb-2">
                2.5x
              </div>
              <p className="text-neutral-500">
                better outcomes with practice and preparation
              </p>
            </div>
          </div>

          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            You know you should negotiate. But when there&apos;s money on the
            line and pressure in the room, your body takes over. Your heart
            races. You settle.{" "}
            <br />
            <span className="text-white">Haggle fixes that.</span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
          <div>TAMUhack 2026</div>
          <div className="flex items-center gap-6">
            <span>Analysis by Google Gemini · Voice by ElevenLabs · Biometrics by
            Presage</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
