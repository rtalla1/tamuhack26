'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation } from '@elevenlabs/react';
import { buildHalPrompt, buildStressContext, DEFAULT_HIDDEN_STATE } from '@/lib/hal-prompt';

interface Message {
  role: 'user' | 'hal';
  content: string;
  timestamp: number;
}

interface StressData {
  score: number;
  trend: 'rising' | 'falling' | 'stable';
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [stress, setStress] = useState<StressData>({ score: 50, trend: 'stable' });
  const [sessionData, setSessionData] = useState({
    hiddenState: DEFAULT_HIDDEN_STATE,
    stressHistory: [] as number[],
    tacticsUsed: [] as Array<{ timestamp: number; stressAtTime: number }>,
  });
  
  // Simulated biometrics (replace with real Presage data via Socket.IO)
  const [biometrics, setBiometrics] = useState({
    heartRate: 72,
    breathingRate: 14,
    baseline: { heartRate: 72, breathingRate: 14 },
  });

  const lastStressUpdateRef = useRef<number>(0);

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      // Handle incoming messages
      if (message.message) {
        const role = message.source === 'user' ? 'user' : 'hal';
        setMessages(prev => [...prev, {
          role,
          content: message.message,
          timestamp: Date.now(),
        }]);

        // Log stress at time of Hal's response for The Reveal
        if (role === 'hal') {
          setSessionData(prev => ({
            ...prev,
            tacticsUsed: [...prev.tacticsUsed, {
              timestamp: Date.now(),
              stressAtTime: stress.score,
            }],
          }));
        }
      }
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
    },
  });

  // Start conversation with ElevenLabs
  const startConversation = useCallback(async () => {
    try {
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
        connectionType: 'webrtc',
        overrides: {
          agent: {
            prompt: {
              prompt: buildHalPrompt(sessionData.hiddenState),
            },
            firstMessage: `Hi there! I'm Hal, and I'll be handling the compensation discussion today. We're really excited about the possibility of you joining the team. Based on your experience and our budget for this role, we'd like to offer you $${sessionData.hiddenState.currentOffer.toLocaleString()}. How does that sound to you?`,
            language: 'en',
          },
        },
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation, sessionData.hiddenState]);

  // Send stress updates to the agent
  const sendStressUpdate = useCallback((stressScore: number, trend: 'rising' | 'falling' | 'stable') => {
    // Throttle updates to every 5 seconds
    const now = Date.now();
    if (now - lastStressUpdateRef.current < 5000) return;
    lastStressUpdateRef.current = now;

    if (conversation.status === 'connected') {
      const context = buildStressContext(stressScore, trend);
      conversation.sendContextualUpdate(context);
    }
  }, [conversation]);

  // Calculate stress from biometrics
  useEffect(() => {
    const hrChange = ((biometrics.heartRate - biometrics.baseline.heartRate) / biometrics.baseline.heartRate) * 100;
    const brChange = ((biometrics.breathingRate - biometrics.baseline.breathingRate) / biometrics.baseline.breathingRate) * 100;
    
    const hrScore = Math.max(0, Math.min(100, 50 + hrChange * 2.5));
    const brScore = Math.max(0, Math.min(100, 50 + brChange * 2));
    const newScore = Math.round(hrScore * 0.6 + brScore * 0.4);

    // Calculate trend
    const history = sessionData.stressHistory;
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (history.length >= 10) {
      const recent = history.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const older = history.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
      if (recent > older + 5) trend = 'rising';
      else if (recent < older - 5) trend = 'falling';
    }

    setStress({ score: newScore, trend });
    setSessionData(prev => ({
      ...prev,
      stressHistory: [...prev.stressHistory.slice(-100), newScore],
    }));

    // Send stress update to agent
    sendStressUpdate(newScore, trend);
  }, [biometrics, sessionData.stressHistory, sendStressUpdate]);

  // Simulate biometrics changing (replace with real Socket.IO data from Presage)
  useEffect(() => {
    const interval = setInterval(() => {
      setBiometrics(prev => ({
        ...prev,
        heartRate: Math.max(60, Math.min(120, prev.heartRate + (Math.random() - 0.5) * 4)),
        breathingRate: Math.max(10, Math.min(25, prev.breathingRate + (Math.random() - 0.5) * 2)),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-start conversation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (conversation.status === 'disconnected') {
        startConversation();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [conversation.status, startConversation]);

  const endNegotiation = async () => {
    await conversation.endSession();
    
    // Save session data for reveal
    localStorage.setItem(`haggle-session-${sessionId}`, JSON.stringify({
      hiddenState: sessionData.hiddenState,
      messages,
      stressHistory: sessionData.stressHistory,
      tacticsUsed: sessionData.tacticsUsed,
    }));
    
    router.push(`/reveal/${sessionId}`);
  };

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Negotiating with Hal</h1>
            <p className="text-slate-400 text-sm">
              {conversation.status === 'connecting' ? 'Connecting...' : 
               conversation.status === 'connected' ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <button
            onClick={endNegotiation}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            End Negotiation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Conversation Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Messages */}
            <div className="bg-slate-800/50 rounded-xl p-6 min-h-[400px] max-h-[500px] overflow-y-auto border border-slate-700">
              {messages.length === 0 && conversation.status === 'connecting' && (
                <div className="text-center text-slate-400 py-8">
                  <p>Connecting to Hal...</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-4 rounded-xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1 opacity-70">
                      {message.role === 'user' ? 'You' : 'Hal'}
                    </p>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
              
              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="text-left mb-4">
                  <div className="inline-block p-4 rounded-xl bg-slate-700/50 text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm">Hal is speaking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Voice Status Indicator */}
            <div className="flex justify-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${
                !isConnected
                  ? 'bg-slate-600'
                  : isSpeaking
                  ? 'bg-blue-600 animate-pulse'
                  : 'bg-green-600'
              }`}>
                {!isConnected ? '⏳' : isSpeaking ? '🔊' : '🎤'}
              </div>
            </div>
            <p className="text-slate-400 text-sm text-center">
              {!isConnected 
                ? 'Connecting to Hal...' 
                : isSpeaking 
                ? 'Hal is speaking - wait for your turn' 
                : 'Speak naturally - Hal is listening'}
            </p>
          </div>

          {/* Biometrics Panel */}
          <div className="lg:col-span-1">
            <div className={`bg-slate-800/50 rounded-xl p-6 border ${stress.score > 65 ? 'border-red-500/50' : 'border-slate-700'}`}>
              <h2 className="text-lg font-semibold text-white mb-4">Your Biometrics</h2>
              
              {/* Stress Score */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Stress Level</span>
                  <span className={`text-sm font-medium ${stress.score > 65 ? 'text-red-400' : 'text-green-400'}`}>
                    {stress.trend === 'rising' ? '↑' : stress.trend === 'falling' ? '↓' : '→'}
                  </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      stress.score > 70 ? 'bg-red-500' : stress.score > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${stress.score}%` }}
                  />
                </div>
                <p className="text-center text-2xl font-bold text-white mt-2">{Math.round(stress.score)}%</p>
              </div>

              {/* Heart Rate */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Heart Rate</span>
                  <span className="text-white font-medium">{Math.round(biometrics.heartRate)} BPM</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-red-400 transition-all duration-300"
                    style={{ width: `${Math.min((biometrics.heartRate / 120) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Breathing Rate */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Breathing Rate</span>
                  <span className="text-white font-medium">{Math.round(biometrics.breathingRate)}/min</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-blue-400 transition-all duration-300"
                    style={{ width: `${Math.min((biometrics.breathingRate / 25) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Connection Status */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-slate-400 text-xs">
                    {isConnected ? 'Voice connected' : 'Connecting...'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-slate-400 text-xs">Biometrics: Simulated</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <h3 className="text-sm font-medium text-white mb-2">💡 Tip</h3>
              <p className="text-slate-400 text-xs">
                Hal can sense when you&apos;re stressed. Take deep breaths and stay calm. 
                Remember: You have leverage too—they want to hire you!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
