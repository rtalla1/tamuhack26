"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useConversation } from "@elevenlabs/react";
import {
  buildHalPrompt,
  buildStressContext,
  DEFAULT_HIDDEN_STATE,
} from "@/lib/hal-prompt";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import QRCode from "qrcode";

interface Message {
  role: "user" | "hal";
  content: string;
  timestamp: number;
}

interface StressData {
  score: number;
  trend: "rising" | "falling" | "stable";
}

const NEGOTIATION_TIPS = [
  { highlight: "Silence is a tactic.", rest: "Don't rush to fill it." },
  {
    highlight: "Never accept the first offer.",
    rest: "There's almost always room to negotiate.",
  },
  {
    highlight: "Know your walk-away number.",
    rest: "And be prepared to use it.",
  },
  {
    highlight: "Use 'I' statements.",
    rest: "Focus on your value, not their budget.",
  },
  {
    highlight: "Ask open-ended questions.",
    rest: "Get them to reveal their constraints.",
  },
  {
    highlight: "Anchor high.",
    rest: "The first number shapes the entire negotiation.",
  },
  {
    highlight: "Take your time.",
    rest: "Rushed decisions favor the other side.",
  },
  { highlight: "Be confident.", rest: "Even if you don't feel it." },
];

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const isDevMode = searchParams.get("dev") === "true";

  const [messages, setMessages] = useState<Message[]>([]);
  const [stress, setStress] = useState<StressData>({
    score: 50,
    trend: "stable",
  });
  const [hiddenState, setHiddenState] = useState(DEFAULT_HIDDEN_STATE);
  const [sessionData, setSessionData] = useState({
    hiddenState: DEFAULT_HIDDEN_STATE,
    stressHistory: [] as number[],
    tacticsUsed: [] as Array<{ timestamp: number; stressAtTime: number }>,
  });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Scenario context for ElevenLabs
  const [scenarioContext, setScenarioContext] = useState({
    role: "a hiring manager at a tech company",
    situation: "a job offer negotiation",
    opener:
      "Thanks for coming in today. I've reviewed your background and I'm impressed.",
  });
  const [contextLoaded, setContextLoaded] = useState(false);

  // Load configured prices from localStorage
  useEffect(() => {
    const config = localStorage.getItem(`haggle-config-${sessionId}`);
    if (config) {
      const parsed = JSON.parse(config);
      const newHiddenState = {
        ...DEFAULT_HIDDEN_STATE,
        currentOffer: parsed.openingOffer || DEFAULT_HIDDEN_STATE.currentOffer,
        targetPrice: parsed.targetPrice || DEFAULT_HIDDEN_STATE.targetPrice,
        walkAwayPrice:
          parsed.walkAwayPrice || DEFAULT_HIDDEN_STATE.walkAwayPrice,
        scenarioId: parsed.scenarioId,
        scenarioType: parsed.scenarioCategory,
      };
      setHiddenState(newHiddenState);
      hiddenStateRef.current = newHiddenState; // Keep ref in sync
      setSessionData((prev) => ({ ...prev, hiddenState: newHiddenState }));

      // Set scenario context if available
      if (parsed.scenarioRole) {
        setScenarioContext({
          role: parsed.scenarioRole,
          situation: parsed.scenarioSituation || "a negotiation",
          opener: parsed.scenarioOpener || "Let's discuss the terms.",
        });
      }
    }
    // Mark context as loaded so conversation can start
    setContextLoaded(true);

    // Generate QR code for iOS pairing
    const qrData = `haggle://${sessionId}`;
    QRCode.toDataURL(qrData, { width: 200, margin: 2 })
      .then(setQrCodeUrl)
      .catch(console.error);
  }, [sessionId]);

  // Socket.IO connection for iOS biometric data
  useEffect(() => {
    // Initialize socket connection
    const socket = io({
      path: '/api/biometrics/socket',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to biometrics server');
      // Web client joins its own session room to receive updates
      socket.emit('join-session', sessionId);
    });

    socket.on('ios-connected', (data) => {
      console.log('📱 iOS device connected:', data);
      setIosConnected(true);
      usingRealBiometricsRef.current = true;
    });

    socket.on('stress-update', (data: {
      heartRate: number;
      breathingRate: number;
      stressScore: number;
      confidence: number;
      timestamp: number;
    }) => {
      console.log('💓 Real biometric data received:', data);
      
      // Update biometrics with real data from iOS
      setBiometrics(prev => ({
        ...prev,
        heartRate: data.heartRate,
        breathingRate: data.breathingRate,
      }));

      // Update stress directly from iOS calculation
      const newStress: StressData = {
        score: data.stressScore,
        trend: data.stressScore > stressRef.current.score + 5 ? 'rising' :
               data.stressScore < stressRef.current.score - 5 ? 'falling' : 'stable'
      };
      
      stressRef.current = newStress;
      setStress(newStress);

      // Add to history
      stressHistoryRef.current = [...stressHistoryRef.current.slice(-100), data.stressScore];
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from biometrics server');
      setIosConnected(false);
      usingRealBiometricsRef.current = false;
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  // Simulated biometrics (replace with real Presage data via Socket.IO)
  const [biometrics, setBiometrics] = useState({
    heartRate: 72,
    breathingRate: 14,
    baseline: { heartRate: 72, breathingRate: 14 },
  });

  // iOS connection state
  const [iosConnected, setIosConnected] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const usingRealBiometricsRef = useRef(false);

  const lastStressUpdateRef = useRef<number>(0);
  const stressHistoryRef = useRef<number[]>([]);
  const stressRef = useRef<StressData>({ score: 50, trend: "stable" });
  const hasStartedRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const hiddenStateRef = useRef(DEFAULT_HIDDEN_STATE);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const endingRef = useRef(false); // Track if we're already ending
  const conversationStartTimeRef = useRef<number>(0);

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      conversationStartTimeRef.current = Date.now();
    },
    onDisconnect: (details) => {
      console.log(
        "Disconnected from ElevenLabs - reason:",
        JSON.stringify(details, null, 2),
      );
    },
    onMessage: (message) => {
      // Handle incoming messages - check message exists and has content
      console.log("Message received:", JSON.stringify(message, null, 2));
      try {
        const content = message?.message;
        if (content && typeof content === "string") {
          const role: "user" | "hal" =
            message.source === "user" ? "user" : "hal";
          setMessages((prev) => {
            const newMessages: Message[] = [
              ...prev,
              {
                role,
                content,
                timestamp: Date.now(),
              },
            ];
            messagesRef.current = newMessages; // Keep ref in sync
            return newMessages;
          });

          // Log stress at time of Hal's response for The Reveal
          if (role === "hal") {
            setSessionData((prev) => ({
              ...prev,
              tacticsUsed: [
                ...prev.tacticsUsed,
                {
                  timestamp: Date.now(),
                  stressAtTime: stressRef.current.score,
                },
              ],
            }));
          }
        }
      } catch (e) {
        console.error("Error processing message:", e, message);
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", JSON.stringify(error, null, 2));
    },
    onStatusChange: (status) => {
      console.log("ElevenLabs status changed:", status);
    },
  });

  // Start conversation with ElevenLabs
  const startConversation = useCallback(async () => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    if (!agentId || agentId === "your_agent_id_here") {
      console.error("ElevenLabs Agent ID not configured");
      return;
    }

    // Check microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");
      // Stop the test stream
      stream.getTracks().forEach((track) => track.stop());
    } catch (micError) {
      console.error("Microphone access denied:", micError);
      alert(
        "Microphone access is required for the negotiation. Please allow microphone access and try again.",
      );
      return;
    }

    console.log("Starting conversation with agent:", agentId);
    console.log("Using prices:", {
      opening: hiddenState.currentOffer,
      target: hiddenState.targetPrice,
      walkaway: hiddenState.walkAwayPrice,
    });
    console.log("Using scenario context:", scenarioContext);

    try {
      // Pass dynamic variables to populate {{variable}} placeholders in the agent prompt
      const dynamicVars = {
        opening_offer: hiddenState.currentOffer.toLocaleString(),
        target_price: hiddenState.targetPrice.toLocaleString(),
        walkaway_price: hiddenState.walkAwayPrice.toLocaleString(),
        hal_role: scenarioContext.role,
        scenario_situation: scenarioContext.situation,
        scenario_opener: scenarioContext.opener,
      };
      console.log("Sending dynamic variables:", dynamicVars);
      
      await conversation.startSession({
        agentId,
        connectionType: "websocket",
        dynamicVariables: dynamicVars,
      });
      console.log("Conversation started successfully");
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation, hiddenState, scenarioContext]);

  // Simulate biometrics and calculate stress (all in one interval to avoid loops)
  // Skip simulation if using real biometrics from iOS
  useEffect(() => {
    const interval = setInterval(() => {
      // Only simulate if NOT using real biometrics from iOS
      if (!usingRealBiometricsRef.current) {
        // Update biometrics
        setBiometrics((prev) => {
          const newHR = Math.max(
            60,
            Math.min(120, prev.heartRate + (Math.random() - 0.5) * 4),
          );
          const newBR = Math.max(
            10,
            Math.min(25, prev.breathingRate + (Math.random() - 0.5) * 2),
          );

          // Calculate stress from new biometrics
          const hrChange =
            ((newHR - prev.baseline.heartRate) / prev.baseline.heartRate) * 100;
          const brChange =
            ((newBR - prev.baseline.breathingRate) /
              prev.baseline.breathingRate) *
            100;

          const hrScore = Math.max(0, Math.min(100, 50 + hrChange * 2.5));
          const brScore = Math.max(0, Math.min(100, 50 + brChange * 2));
          const newScore = Math.round(hrScore * 0.6 + brScore * 0.4);

          // Calculate trend
          const history = stressHistoryRef.current;
          let trend: "rising" | "falling" | "stable" = "stable";
          if (history.length >= 10) {
            const recent = history.slice(-5).reduce((a, b) => a + b, 0) / 5;
            const older = history.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
            if (recent > older + 5) trend = "rising";
            else if (recent < older - 5) trend = "falling";
          }

          // Update stress history ref
          stressHistoryRef.current = [...history.slice(-100), newScore];
          stressRef.current = { score: newScore, trend };

          return {
            ...prev,
            heartRate: newHR,
            breathingRate: newBR,
          };
        });

        // Update stress state (read from ref to avoid stale closure)
        setStress(stressRef.current);
      }

      // Send stress update to agent (throttled) - works for both simulated and real data
      const now = Date.now();
      if (now - lastStressUpdateRef.current >= 5000) {
        lastStressUpdateRef.current = now;
        if (conversation.status === "connected") {
          const context = buildStressContext(
            stressRef.current.score,
            stressRef.current.trend,
          );
          conversation.sendContextualUpdate(context);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [conversation]);

  // Auto-start conversation on mount (only once) - skip in dev mode
  // Wait for context to load before starting
  useEffect(() => {
    if (hasStartedRef.current || isDevMode || !contextLoaded) return;

    const timer = setTimeout(() => {
      if (conversation.status === "disconnected" && !hasStartedRef.current) {
        hasStartedRef.current = true;
        startConversation();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [conversation.status, startConversation, isDevMode, contextLoaded]);

  // Cycle through negotiation tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % NEGOTIATION_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Watch for conversation ending (after it was started) and redirect to reveal
  useEffect(() => {
    const conversationDuration = Date.now() - conversationStartTimeRef.current;
    const hasEnoughMessages = messagesRef.current.length >= 2; // At least a back-and-forth
    const hasMinDuration = conversationDuration > 10000; // At least 10 seconds

    console.log("Status changed:", conversation.status, {
      hasStarted: hasStartedRef.current,
      messageCount: messagesRef.current.length,
      duration: Math.round(conversationDuration / 1000) + "s",
      hasEnoughMessages,
      hasMinDuration,
    });

    // If we've started, had a real conversation, and now disconnected - redirect to reveal
    // Require at least 2 messages AND 10 seconds to prevent premature redirects
    if (
      conversation.status === "disconnected" &&
      hasStartedRef.current &&
      hasEnoughMessages &&
      hasMinDuration &&
      !endingRef.current
    ) {
      endingRef.current = true;
      console.log("Conversation ended by agent, redirecting to reveal...");

      // Save session data
      localStorage.setItem(
        `haggle-session-${sessionId}`,
        JSON.stringify({
          hiddenState: hiddenStateRef.current,
          messages: messagesRef.current,
          stressHistory: stressHistoryRef.current,
          tacticsUsed: [],
        }),
      );

      // Redirect after brief delay to let user see Hal's farewell
      setTimeout(() => {
        router.push(`/reveal/${sessionId}`);
      }, 2000);
    }
  }, [conversation.status, sessionId, router]);

  const endNegotiation = async () => {
    await conversation.endSession();

    // Save session data for reveal (use ref for latest stress history)
    localStorage.setItem(
      `haggle-session-${sessionId}`,
      JSON.stringify({
        hiddenState: hiddenState,
        messages,
        stressHistory: stressHistoryRef.current,
        tacticsUsed: sessionData.tacticsUsed,
      }),
    );

    router.push(`/reveal/${sessionId}`);
  };

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a 
              href="/"
              className="flex items-center gap-2 bg-gradient-to-r from-neutral-600/80 to-neutral-900/80 backdrop-blur-md rounded-full px-3 py-2 border border-white/10 hover:border-white/20 transition-colors"
            >
              <Image src="/favicon.ico" alt="Haggle" width={24} height={24} />
              <span className="font-bold">Haggle</span>
            </a>
            <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
              <div
                className={`w-2 h-2 rounded-full ${isDevMode ? "bg-purple-500" : isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
              />
              <span className="text-neutral-400 text-sm">
                {isDevMode
                  ? "🛠️ dev mode"
                  : conversation.status === "connecting"
                    ? "connecting..."
                    : conversation.status === "connected"
                      ? "live"
                      : "offline"}
              </span>
            </div>
          </div>
          <button
            onClick={endNegotiation}
            className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            End & See Results
          </button>
        </div>
      </nav>

      <div className="pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Conversation Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="bg-neutral-900 rounded-3xl p-6 min-h-[500px] max-h-[600px] overflow-y-auto border border-neutral-800"
              >
                {messages.length === 0 &&
                  conversation.status === "connecting" && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-neutral-400">Hal is preparing...</p>
                        <p className="text-neutral-600 text-sm mt-1">
                          Take a deep breath
                        </p>
                      </div>
                    </div>
                  )}

                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          message.role === "user"
                            ? "bg-white text-black rounded-2xl rounded-br-sm"
                            : "bg-neutral-800 text-white rounded-2xl rounded-bl-sm border border-neutral-700"
                        } px-5 py-3`}
                      >
                        <p className="text-base font-semibold mb-1 opacity-60">
                          {message.role === "user" ? "You" : "Hal"}
                        </p>
                        <p className="text-[15px] leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Speaking indicator */}
                  {isSpeaking && (
                    <div className="flex justify-start">
                      <div className="bg-neutral-800 text-white rounded-2xl rounded-bl-sm px-5 py-4 border border-neutral-700">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <span
                              className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                          <span className="text-neutral-500 text-sm">
                            hal is thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Status / Dev Mode Panel */}
              {isDevMode ? (
                <div className="bg-purple-900/20 rounded-3xl p-6 border border-purple-500/30">
                  <h3 className="text-purple-400 font-semibold mb-4 text-sm">
                    🛠️ Dev Mode Controls
                  </h3>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setMessages((prev) => [
                          ...prev,
                          {
                            role: "hal",
                            content: `Hello! Thanks for coming in today. I've reviewed your background and I'm impressed. Let's talk compensation. Based on our budget and the role's scope, I'd like to offer you $${hiddenState.currentOffer.toLocaleString()} annually. How does that sound?`,
                            timestamp: Date.now(),
                          },
                        ]);
                      }}
                      className="w-full bg-purple-500/20 text-purple-300 py-2 px-4 rounded-xl text-sm hover:bg-purple-500/30 transition-colors text-left"
                    >
                      + Add Hal message
                    </button>

                    <button
                      onClick={() => {
                        setMessages((prev) => [
                          ...prev,
                          {
                            role: "user",
                            content:
                              "I appreciate the offer, but based on my experience and market research, I was hoping for something closer to $" +
                              (
                                hiddenState.currentOffer + 10000
                              ).toLocaleString() +
                              ".",
                            timestamp: Date.now(),
                          },
                        ]);
                      }}
                      className="w-full bg-purple-500/20 text-purple-300 py-2 px-4 rounded-xl text-sm hover:bg-purple-500/30 transition-colors text-left"
                    >
                      + Add User message
                    </button>

                    <button
                      onClick={() => {
                        setStress((prev) => ({
                          ...prev,
                          score: Math.min(100, prev.score + 15),
                        }));
                      }}
                      className="w-full bg-red-500/20 text-red-300 py-2 px-4 rounded-xl text-sm hover:bg-red-500/30 transition-colors"
                    >
                      ↑ Increase Stress (+15)
                    </button>

                    <button
                      onClick={() => {
                        setStress((prev) => ({
                          ...prev,
                          score: Math.max(0, prev.score - 15),
                        }));
                      }}
                      className="w-full bg-green-500/20 text-green-300 py-2 px-4 rounded-xl text-sm hover:bg-green-500/30 transition-colors"
                    >
                      ↓ Decrease Stress (-15)
                    </button>
                  </div>

                  <p className="text-purple-400/60 text-xs mt-4 text-center">
                    No ElevenLabs credits used
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
                  <div className="flex items-center justify-center gap-6">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        conversation.status === "disconnected"
                          ? "bg-red-500/20"
                          : conversation.status === "connecting"
                            ? "bg-neutral-800"
                            : isSpeaking
                              ? "bg-white"
                              : "bg-green-500"
                      }`}
                    >
                      {conversation.status === "disconnected" ? (
                        <span className="text-2xl">⚠️</span>
                      ) : conversation.status === "connecting" ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isSpeaking ? (
                        <span className="text-2xl">🎭</span>
                      ) : (
                        <span className="text-2xl">🎤</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {conversation.status === "disconnected"
                          ? "Connection lost"
                          : conversation.status === "connecting"
                            ? "Connecting..."
                            : isSpeaking
                              ? "Hal is speaking"
                              : "Your turn"}
                      </p>
                      <p className="text-neutral-500 text-sm">
                        {conversation.status === "disconnected"
                          ? "Tap below to reconnect"
                          : conversation.status === "connecting"
                            ? "Hal is getting ready"
                            : isSpeaking
                              ? "Listen carefully..."
                              : "Speak your mind"}
                      </p>
                    </div>
                  </div>

                  {/* Reconnect button when disconnected - with warning */}
                  {conversation.status === "disconnected" &&
                    !endingRef.current && (
                      <div className="mt-4 space-y-2">
                        <p className="text-yellow-400 text-xs text-center">
                          ⚠️ Each reconnect uses credits
                        </p>
                        <button
                          onClick={() => {
                            if (
                              !confirm(
                                "Reconnecting will use more ElevenLabs credits. Continue?",
                              )
                            )
                              return;
                            hasStartedRef.current = false;
                            startConversation();
                          }}
                          className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-neutral-200 transition-colors"
                        >
                          Reconnect
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Biometrics Panel */}
            <div className="lg:col-span-1 space-y-4">
              {/* Stress Meter */}
              <div
                className={`bg-neutral-900 rounded-3xl p-6 border ${stress.score > 65 ? "border-red-500/50 bg-red-500/5" : "border-neutral-800"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-neutral-400 text-sm">Stress Level</h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      stress.score > 70
                        ? "bg-red-500/20 text-red-400"
                        : stress.score > 50
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {stress.trend === "rising"
                      ? "↑ rising"
                      : stress.trend === "falling"
                        ? "↓ falling"
                        : "→ stable"}
                  </span>
                </div>

                <div className="text-center mb-4">
                  <span
                    className={`text-6xl font-bold font-mono ${
                      stress.score > 70
                        ? "text-red-500"
                        : stress.score > 50
                          ? "text-yellow-500"
                          : "text-green-500"
                    }`}
                  >
                    {Math.round(stress.score)}
                  </span>
                  <span className="text-neutral-600 text-2xl">%</span>
                </div>

                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      stress.score > 70
                        ? "bg-red-500"
                        : stress.score > 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${stress.score}%` }}
                  />
                </div>

                {stress.score > 65 && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-400 text-xs text-center">
                      ⚠️ Hal knows you&apos;re nervous
                    </p>
                  </div>
                )}
              </div>

              {/* iOS Connection Status */}
              <div className={`bg-neutral-900 rounded-3xl p-6 border ${iosConnected ? 'border-green-500/50 bg-green-500/5' : 'border-neutral-800'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-neutral-400 text-sm">Biometric Source</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${iosConnected ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-400'}`}>
                    {iosConnected ? '📱 iPhone' : '🤖 Simulated'}
                  </span>
                </div>

                {iosConnected ? (
                  <div className="text-center py-2">
                    <p className="text-green-400 text-sm mb-1">✓ Real-time biometrics active</p>
                    <p className="text-neutral-500 text-xs">Using Presage SmartSpectra SDK</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {showQR ? '📱 Hide QR Code' : '📱 Connect iPhone'}
                    </button>

                    {showQR && qrCodeUrl && (
                      <div className="bg-white p-3 rounded-xl">
                        <img 
                          src={qrCodeUrl} 
                          alt="Connect iPhone"
                          className="w-full h-auto"
                        />
                        <p className="text-neutral-900 text-xs text-center mt-2 font-mono">
                          {sessionId}
                        </p>
                      </div>
                    )}

                    <p className="text-neutral-500 text-xs text-center">
                      {showQR ? 'Scan with Haggle iOS app' : 'Using simulated stress data'}
                    </p>
                  </div>
                )}
              </div>

              {/* Vitals */}
              <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
                <h2 className="text-neutral-400 text-sm mb-4">Your Vitals</h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-500 text-sm">
                        Heart Rate
                      </span>
                      <span className="text-white font-mono text-sm">
                        {Math.round(biometrics.heartRate)} bpm
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min((biometrics.heartRate / 120) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-500 text-sm">
                        Breathing
                      </span>
                      <span className="text-white font-mono text-sm">
                        {Math.round(biometrics.breathingRate)}/min
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min((biometrics.breathingRate / 25) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
                <h2 className="text-neutral-400 text-sm mb-4">Connections</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
                    />
                    <span className="text-neutral-300 text-sm">
                      {isConnected
                        ? "voice: connected"
                        : "voice: connecting..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-neutral-300 text-sm">
                      biometrics: demo mode
                    </span>
                  </div>
                </div>
              </div>

              {/* Tip Carousel */}
              <div className="bg-neutral-800/30 rounded-2xl p-4 border border-neutral-800/50">
                <p className="text-neutral-500 text-sm transition-opacity duration-300">
                  💡{" "}
                  <span className="text-neutral-400">
                    {NEGOTIATION_TIPS[currentTipIndex].highlight}
                  </span>{" "}
                  {NEGOTIATION_TIPS[currentTipIndex].rest}
                </p>
                <div className="flex justify-center gap-1 mt-3">
                  {NEGOTIATION_TIPS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTipIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === currentTipIndex
                          ? "bg-neutral-400"
                          : "bg-neutral-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
