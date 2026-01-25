"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import LightRays from "@/components/LightRays";

interface SessionData {
  hiddenState: {
    walkAwayPrice: number;
    targetPrice: number;
    currentOffer: number;
  };
  messages: Array<{
    role: "user" | "hal";
    content: string;
    timestamp: number;
  }>;
  stressHistory: number[];
  halContextLogs?: Array<{
    timestamp: number;
    stressScore: number;
    trend: string;
    contextSent: string;
    messageIndex: number;
  }>;
  tacticsUsed: Array<{
    timestamp: number;
    stressAtTime: number;
  }>;
}

interface Analysis {
  agreedPrice: number | null;
  dealReached: boolean;
  userPerformance: {
    score: number;
    grade: string;
    summary: string;
  };
  tactics: {
    halUsed: string[];
    userUsed: string[];
  };
  keyMoments: Array<{
    description: string;
    impact: "positive" | "negative" | "neutral";
  }>;
  feedback: {
    strengths: string[];
    improvements: string[];
    tips: string[];
  };
  financialLiteracy?: {
    concept: string;
    realWorldApplication: string;
    savingsImpact?: string;
  };
  moneyLeftOnTable: number;
}

export default function RevealPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [revealStage, setRevealStage] = useState(0);
  const hasAnalyzedRef = useRef(false);

  useEffect(() => {
    if (hasAnalyzedRef.current) return;

    const stored = localStorage.getItem(`haggle-session-${sessionId}`);
    if (stored) {
      const data = JSON.parse(stored) as SessionData;
      setSessionData(data);

      hasAnalyzedRef.current = true;
      runAnalysis(data);
    }
    setLoading(false);
  }, [sessionId]);

  async function runAnalysis(data: SessionData) {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: data.messages,
          hiddenState: data.hiddenState,
          stressHistory: data.stressHistory,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      } else if (response.status === 429) {
        setAnalysisError("Rate limit reached. Click to retry.");
      } else {
        console.error("Analysis failed:", await response.text());
        setAnalysisError("Analysis failed. Click to retry.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError("Analysis error. Click to retry.");
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (!sessionData) return;

    const timers = [
      setTimeout(() => setRevealStage(1), 300),
      setTimeout(() => setRevealStage(2), 1500),
      setTimeout(() => setRevealStage(3), 2700),
      setTimeout(() => setRevealStage(4), 3900),
      setTimeout(() => setRevealStage(5), 5100),
      setTimeout(() => setRevealStage(6), 6300),
    ];

    return () => timers.forEach(clearTimeout);
  }, [sessionData]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!sessionData) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Session not found</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Start new session
          </button>
        </div>
      </main>
    );
  }

  const finalDeal =
    analysis?.agreedPrice || sessionData.hiddenState.currentOffer;
  const moneyLeft =
    analysis?.moneyLeftOnTable ??
    sessionData.hiddenState.walkAwayPrice - finalDeal;

  const chartData = sessionData.stressHistory.map((score, index) => ({
    time: index,
    stress: score,
  }));

  const gradeColors: Record<string, string> = {
    A: "text-green-400",
    B: "text-blue-400",
    C: "text-yellow-400",
    D: "text-orange-400",
    F: "text-red-400",
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative">
      {/* LightRays Background */}
      <div className="fixed inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={0.5}
          lightSpread={0.4}
          rayLength={2}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={0.5}
        />
      </div>

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a 
            href="/"
            className="flex items-center gap-2 bg-gradient-to-r from-neutral-600/80 to-neutral-900/80 backdrop-blur-md rounded-full px-3 py-2 border border-white/10 hover:border-white/20 transition-colors"
          >
            <Image src="/favicon.ico" alt="Haggle" width={24} height={24} />
            <span className="font-bold">Haggle</span>
          </a>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-white text-black gap-2 px-3 py-2 rounded-full font-semibold hover:bg-neutral-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div
            className={`text-center mb-12 transition-all duration-700 ${revealStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <h2 className="text-5xl font-bold text-white mb-2">The Reveal</h2>
            <p className="text-neutral-500">Powered by Google Gemini</p>
          </div>

          {/* Score Card */}
          {analysis && (
            <div
              className={`mb-8 transition-all duration-700 ${revealStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="bg-neutral-900 rounded-3xl p-8 text-center border border-neutral-800">
                <div className="mb-6">
                  <span
                    className={`text-9xl font-bold font-mono ${gradeColors[analysis.userPerformance.grade] || "text-white"}`}
                  >
                    {analysis.userPerformance.grade}
                  </span>
                </div>
                <div className="text-2xl text-white mb-2 font-mono">
                  {analysis.userPerformance.score}/100
                </div>
                <p className="text-neutral-400 max-w-lg mx-auto">
                  {analysis.userPerformance.summary}
                </p>
              </div>
            </div>
          )}

          {/* Analyzing or Error State */}
          {analyzing && (
            <div
              className={`mb-8 transition-all duration-700 ${revealStage >= 2 ? "opacity-100" : "opacity-0"}`}
            >
              <div className="bg-neutral-900 rounded-3xl p-8 text-center border border-neutral-800">
                <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-neutral-400">
                  Analyzing your negotiation...
                </p>
              </div>
            </div>
          )}

          {analysisError && !analyzing && (
            <div
              className={`mb-8 transition-all duration-700 ${revealStage >= 2 ? "opacity-100" : "opacity-0"}`}
            >
              <div className="bg-neutral-900 rounded-3xl p-8 text-center border border-yellow-500/30">
                <p className="text-yellow-400 mb-4">{analysisError}</p>
                <button
                  onClick={() => sessionData && runAnalysis(sessionData)}
                  className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-neutral-200 transition-colors"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
          )}

          {/* Hal's Perspective - Proof of AI Adaptation */}
          {sessionData && sessionData.halContextLogs && sessionData.halContextLogs.length > 0 && (
            <div
              className={`mb-8 transition-all duration-700 ${revealStage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-3xl p-8 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">👁️</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Hal&apos;s Perspective
                    </h3>
                    <p className="text-purple-400 text-sm">
                      The exact stress context Hal received during your conversation
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <p className="text-yellow-300 text-sm">
                    <strong>Proof of AI adaptation:</strong> Below are the actual contextual updates sent to Gemini every 2 seconds. 
                    This is what informed Hal&apos;s tactics in real-time.
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sessionData.halContextLogs
                    .filter((_, idx) => idx % 3 === 0 || idx === sessionData.halContextLogs!.length - 1) // Sample every 3rd + last
                    .slice(0, 8) // Max 8 examples
                    .map((log, idx) => {
                      const relativeTime = Math.floor(
                        (log.timestamp - (sessionData.messages[0]?.timestamp || log.timestamp)) / 1000
                      );
                      const minutes = Math.floor(relativeTime / 60);
                      const seconds = relativeTime % 60;
                      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                      const halMessage = sessionData.messages.find(
                        (m, i) => m.role === 'hal' && i >= log.messageIndex && i <= log.messageIndex + 1
                      );

                      return (
                        <div key={idx} className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-neutral-400 text-xs font-mono">[{timeStr}]</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              log.stressScore > 65 ? 'bg-red-500/20 text-red-400' :
                              log.stressScore > 50 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {log.stressScore}% ({log.trend})
                            </span>
                          </div>

                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
                            <p className="text-purple-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                              {log.contextSent}
                            </p>
                          </div>

                          {halMessage && (
                            <div className="mt-3 pt-3 border-t border-neutral-800">
                              <p className="text-neutral-500 text-xs mb-1">Hal&apos;s Response:</p>
                              <p className="text-neutral-300 text-sm italic">
                                &quot;{halMessage.content.slice(0, 150)}{halMessage.content.length > 150 ? '...' : ''}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-neutral-500 text-xs">
                    {sessionData.halContextLogs.length} total updates sent to Hal during negotiation
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Transformation Story - USAA Challenge Feature */}
          {analysis && sessionData && sessionData.tacticsUsed.length > 0 && (
            <div
              className={`mb-8 transition-all duration-700 ${revealStage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-3xl p-8 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🧠</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      AI Transformation Pipeline
                    </h3>
                    <p className="text-purple-400 text-sm">
                      How your stress transformed Gemini&apos;s responses in real-time
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Show key moments where stress influenced AI */}
                  {sessionData.tacticsUsed
                    .filter((_, idx) => idx % 3 === 0 || idx === sessionData.tacticsUsed.length - 1) // Sample every 3rd + last
                    .slice(0, 4) // Max 4 examples
                    .map((tactic, idx) => {
                      const relativeTime = Math.floor(
                        (tactic.timestamp - (sessionData.messages[0]?.timestamp || tactic.timestamp)) / 1000
                      );
                      const minutes = Math.floor(relativeTime / 60);
                      const seconds = relativeTime % 60;
                      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                      
                      const halMessage = sessionData.messages.find(
                        (m) => m.role === 'hal' && Math.abs(m.timestamp - tactic.timestamp) < 2000
                      );

                      const stressLevel = tactic.stressAtTime;
                      const stressLabel = 
                        stressLevel > 70 ? 'High Stress' :
                        stressLevel > 50 ? 'Elevated Stress' :
                        'Normal Stress';
                      const stressColor = 
                        stressLevel > 70 ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                        stressLevel > 50 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
                        'text-green-400 bg-green-500/10 border-green-500/30';

                      return (
                        <div key={idx} className="bg-neutral-900/50 rounded-2xl p-5 border border-neutral-800">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-neutral-400 text-sm font-mono">[{timeStr}]</span>
                            <span className={`text-xs px-3 py-1 rounded-full border ${stressColor}`}>
                              {stressLabel}: {Math.round(stressLevel)}%
                            </span>
                          </div>

                          {/* Transformation Flow */}
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-24 flex-shrink-0">
                                <span className="text-xs text-purple-400">Gemini Input:</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-neutral-400">
                                  Base negotiation prompt + conversation history
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-center py-1">
                              <span className="text-purple-400">↓</span>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-24 flex-shrink-0">
                                <span className="text-xs text-blue-400">+ Stress Data:</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-blue-300">
                                  {stressLevel > 70 
                                    ? "User highly stressed - strategic opportunity to push harder" 
                                    : stressLevel > 50
                                    ? "User showing stress - apply moderate pressure"
                                    : "User calm - maintain professional tone"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-center py-1">
                              <span className="text-blue-400">↓</span>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-24 flex-shrink-0">
                                <span className="text-xs text-green-400">Hal&apos;s Response:</span>
                              </div>
                              <div className="flex-1 bg-neutral-800 rounded-xl p-3 border border-neutral-700">
                                <p className="text-sm text-white">
                                  &ldquo;{halMessage?.content.slice(0, 120) || 'Continuing negotiation...'}
                                  {(halMessage?.content.length || 0) > 120 ? '...' : ''}&rdquo;
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-6 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-purple-300 text-sm text-center">
                    <strong>Novel Transformation:</strong> Real-time biometric data from Presage SDK → 
                    Contextual AI updates → Stress-adaptive responses from Gemini 2.5 Flash
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* The Numbers */}
          <div
            className={`mb-8 transition-all duration-700 ${revealStage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800">
              <h3 className="text-xl font-semibold text-white mb-6">
                Hal&apos;s Hidden State
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-800 rounded-2xl p-5 text-center border border-neutral-700">
                  <p className="text-neutral-500 text-sm mb-1">Opening</p>
                  <p className="text-2xl font-bold font-mono text-white">
                    ${sessionData.hiddenState.currentOffer.toLocaleString()}
                  </p>
                </div>
                <div className="bg-neutral-800 rounded-2xl p-5 text-center border border-neutral-700">
                  <p className="text-neutral-500 text-sm mb-1">Target</p>
                  <p className="text-2xl font-bold font-mono text-yellow-400">
                    ${sessionData.hiddenState.targetPrice.toLocaleString()}
                  </p>
                </div>
                <div className="bg-neutral-800 rounded-2xl p-5 text-center border border-neutral-700">
                  <p className="text-neutral-500 text-sm mb-1">Maximum</p>
                  <p className="text-2xl font-bold font-mono text-green-400">
                    ${sessionData.hiddenState.walkAwayPrice.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-5 text-center">
                  <p className="text-neutral-600 text-sm mb-1">You Got</p>
                  <p className="text-2xl font-bold font-mono text-black">
                    ${finalDeal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Money Left */}
          <div
            className={`mb-8 transition-all duration-700 ${revealStage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div
              className={`rounded-3xl p-8 text-center ${moneyLeft > 5000 ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"}`}
            >
              <p
                className={`text-lg mb-2 ${moneyLeft > 5000 ? "text-red-400" : "text-green-400"}`}
              >
                {moneyLeft > 5000
                  ? "Money left on the table"
                  : "Great negotiation!"}
              </p>
              <p
                className={`text-6xl font-bold font-mono ${moneyLeft > 5000 ? "text-red-500" : "text-green-500"}`}
              >
                ${Math.abs(moneyLeft).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Stress Timeline */}
          <div
            className={`mb-8 transition-all duration-700 ${revealStage >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800">
              <h3 className="text-xl font-semibold text-white mb-6">
                Your Stress Timeline
              </h3>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="time" stroke="#525252" tick={false} />
                    <YAxis stroke="#525252" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#171717",
                        border: "1px solid #262626",
                        borderRadius: "12px",
                      }}
                      labelStyle={{ color: "#F5F5F5" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="stress"
                      fill="#EF4444"
                      fillOpacity={0.2}
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Stress %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-neutral-600">
                  <p>No stress data recorded</p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback */}
          {analysis && (
            <div
              className={`mb-8 transition-all duration-700 ${revealStage >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
                  <h4 className="text-green-400 font-semibold mb-3">
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysis.feedback.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-neutral-300 text-sm flex items-start gap-2"
                      >
                        <span className="text-green-400">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
                  <h4 className="text-yellow-400 font-semibold mb-3">
                    Improve
                  </h4>
                  <ul className="space-y-2">
                    {analysis.feedback.improvements.map((s, i) => (
                      <li
                        key={i}
                        className="text-neutral-300 text-sm flex items-start gap-2"
                      >
                        <span className="text-yellow-400">!</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
                  <h4 className="text-blue-400 font-semibold mb-3">Tips</h4>
                  <ul className="space-y-2">
                    {analysis.feedback.tips.map((s, i) => (
                      <li
                        key={i}
                        className="text-neutral-300 text-sm flex items-start gap-2"
                      >
                        <span className="text-blue-400">*</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Financial Literacy Section - Capital One Track */}
          {analysis && analysis.financialLiteracy && (
            <div
              className={`mb-8 transition-all duration-700 ${revealStage >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="bg-gradient-to-br from-blue-900/20 to-green-900/20 rounded-3xl p-8 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">💡</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Financial Literacy Lesson
                    </h3>
                    <p className="text-blue-400 text-sm">
                      How negotiation skills build long-term wealth
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-neutral-900/50 rounded-2xl p-6">
                    <h4 className="text-green-400 font-semibold mb-2 text-sm">Key Concept</h4>
                    <p className="text-white text-base">
                      {analysis.financialLiteracy.concept}
                    </p>
                  </div>

                  <div className="bg-neutral-900/50 rounded-2xl p-6">
                    <h4 className="text-blue-400 font-semibold mb-2 text-sm">Real-World Application</h4>
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      {analysis.financialLiteracy.realWorldApplication}
                    </p>
                  </div>

                  {analysis.financialLiteracy.savingsImpact && (
                    <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl p-6 border border-green-500/20">
                      <h4 className="text-green-400 font-semibold mb-2 text-sm flex items-center gap-2">
                        <span>💰</span> Long-Term Financial Impact
                      </h4>
                      <p className="text-green-300 text-sm font-medium">
                        {analysis.financialLiteracy.savingsImpact}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tactics */}
          {analysis && (
            <div
              className={`mb-8 transition-all duration-700 ${revealStage >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Tactics Used
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-neutral-500 text-sm mb-3">
                      Hal&apos;s Tactics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.tactics.halUsed.map((tactic, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm border border-red-500/20"
                        >
                          {tactic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-sm mb-3">
                      Your Tactics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.tactics.userUsed.length > 0 ? (
                        analysis.tactics.userUsed.map((tactic, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20"
                          >
                            {tactic}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-600 text-sm">
                          None identified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation */}
          <div
            className={`mb-8 transition-all duration-700 ${revealStage >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800">
              <h3 className="text-xl font-semibold text-white mb-6">
                Conversation
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {sessionData.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 text-sm ${
                        message.role === "user"
                          ? "bg-white text-black rounded-2xl rounded-br-sm"
                          : "bg-neutral-800 text-neutral-300 rounded-2xl rounded-bl-sm border border-neutral-700"
                      }`}
                    >
                      <span className="font-medium">
                        {message.role === "user" ? "You" : "🎭 Hal"}:
                      </span>{" "}
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-neutral-600 text-sm">
            <p>
              Analysis by Google Gemini · Voice by ElevenLabs · Biometrics by
              Presage
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
