'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface SessionData {
  hiddenState: {
    walkAwayPrice: number;
    targetPrice: number;
    currentOffer: number;
  };
  messages: Array<{
    role: 'user' | 'hal';
    content: string;
    timestamp: number;
  }>;
  stressHistory: number[];
  tacticsUsed: Array<{
    timestamp: number;
    stressAtTime: number;
  }>;
  finalDeal?: number;
}

export default function RevealPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealStage, setRevealStage] = useState(0);
  const [extractedDeal, setExtractedDeal] = useState<number | null>(null);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem(`haggle-session-${sessionId}`);
    if (stored) {
      const data = JSON.parse(stored) as SessionData;
      setSessionData(data);
      
      // Try to extract final deal from conversation
      const dealMatch = extractDealFromConversation(data.messages);
      setExtractedDeal(dealMatch);
    }
    setLoading(false);
  }, [sessionId]);

  // Simple extraction of any salary number mentioned in the last few messages
  function extractDealFromConversation(messages: SessionData['messages']): number | null {
    const lastMessages = messages.slice(-5).map(m => m.content).join(' ');
    const matches = lastMessages.match(/\$?([\d,]+)(?:k|K|,000)?/g);
    if (matches) {
      const lastMatch = matches[matches.length - 1];
      const num = parseInt(lastMatch.replace(/[$,kK]/g, ''));
      return num < 1000 ? num * 1000 : num;
    }
    return null;
  }

  // Animate reveal stages
  useEffect(() => {
    if (!sessionData) return;

    const timers = [
      setTimeout(() => setRevealStage(1), 500),
      setTimeout(() => setRevealStage(2), 2000),
      setTimeout(() => setRevealStage(3), 3500),
      setTimeout(() => setRevealStage(4), 5000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [sessionData]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading reveal...</p>
      </main>
    );
  }

  if (!sessionData) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Session not found</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-400 hover:text-blue-300"
          >
            Start a new session
          </button>
        </div>
      </main>
    );
  }

  const finalDeal = extractedDeal || sessionData.hiddenState.currentOffer;
  const moneyLeft = sessionData.hiddenState.walkAwayPrice - finalDeal;
  const stressExploitations = sessionData.tacticsUsed.filter(t => t.stressAtTime > 65);

  // Prepare chart data
  const chartData = sessionData.stressHistory.map((score, index) => ({
    time: index,
    stressScore: score,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">The Reveal</h1>
          <p className="text-slate-400">Let&apos;s see what Hal was hiding...</p>
        </div>

        {/* Hidden State Reveal */}
        <div className={`transition-all duration-1000 ${revealStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-slate-800/50 rounded-2xl p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">🎭 Hal&apos;s Hidden State</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">Hal&apos;s Walk-Away Price</p>
                <p className="text-4xl font-bold text-green-400">
                  ${sessionData.hiddenState.walkAwayPrice.toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-2">The maximum Hal would pay</p>
              </div>
              
              <div className="text-center p-6 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">Hal&apos;s Target</p>
                <p className="text-4xl font-bold text-yellow-400">
                  ${sessionData.hiddenState.targetPrice.toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-2">What Hal wanted to pay</p>
              </div>
              
              <div className="text-center p-6 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">You Settled At</p>
                <p className="text-4xl font-bold text-blue-400">
                  ${finalDeal.toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-2">Your final agreement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Money Left on Table */}
        <div className={`transition-all duration-1000 delay-300 ${revealStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className={`rounded-2xl p-8 mb-8 text-center ${
            moneyLeft > 5000 
              ? 'bg-red-900/20 border border-red-500/30' 
              : 'bg-green-900/20 border border-green-500/30'
          }`}>
            <p className={`text-lg mb-2 ${moneyLeft > 5000 ? 'text-red-400' : 'text-green-400'}`}>
              {moneyLeft > 5000 ? '💸 Money Left on the Table' : '🎉 Great Negotiation!'}
            </p>
            <p className={`text-6xl font-bold mb-4 ${moneyLeft > 5000 ? 'text-red-500' : 'text-green-500'}`}>
              ${Math.abs(moneyLeft).toLocaleString()}
            </p>
            <p className="text-slate-400">
              {moneyLeft > 5000 
                ? `Hal was willing to pay $${sessionData.hiddenState.walkAwayPrice.toLocaleString()}, but you agreed to $${finalDeal.toLocaleString()}.`
                : `You negotiated within $${moneyLeft.toLocaleString()} of Hal's maximum budget!`
              }
            </p>
          </div>
        </div>

        {/* Stress Timeline */}
        <div className={`transition-all duration-1000 delay-500 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-slate-800/50 rounded-2xl p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Your Stress Timeline</h2>
            
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" label={{ value: 'Time', position: 'bottom', fill: '#9CA3AF' }} />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} label={{ value: 'Stress %', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stressScore"
                    fill="#EF4444"
                    fillOpacity={0.2}
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Stress Score"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <p>No stress data recorded. Connect your phone with Presage to see real biometric data!</p>
              </div>
            )}
          </div>
        </div>

        {/* Stress Exploitation Analysis */}
        <div className={`transition-all duration-1000 delay-700 ${revealStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-slate-800/50 rounded-2xl p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">🎯 Stress Exploitation Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">Times Your Stress Was Elevated</p>
                <p className="text-4xl font-bold text-red-400">{stressExploitations.length}</p>
                <p className="text-slate-500 text-xs mt-2">Moments when Hal could apply pressure</p>
              </div>
              
              <div className="p-6 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">Peak Stress Level</p>
                <p className="text-4xl font-bold text-yellow-400">
                  {sessionData.stressHistory.length > 0 
                    ? `${Math.max(...sessionData.stressHistory)}%`
                    : 'N/A'
                  }
                </p>
                <p className="text-slate-500 text-xs mt-2">Your highest recorded stress</p>
              </div>
            </div>

            {stressExploitations.length > 0 && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">
                  ⚠️ During {stressExploitations.length} exchanges, your stress exceeded 65%. 
                  Hal detected these moments and may have used them to hold firm on offers 
                  or apply subtle pressure.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Replay */}
        <div className={`transition-all duration-1000 delay-700 ${revealStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-slate-800/50 rounded-2xl p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">💬 Conversation Replay</h2>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {sessionData.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-xl ${
                      message.role === 'user'
                        ? 'bg-blue-600/50 text-white'
                        : 'bg-slate-700/50 text-slate-100'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {message.role === 'user' ? 'You' : 'Hal'}
                    </p>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>

        {/* Financial Literacy Message */}
        <div className="mt-12 text-center text-slate-500 text-sm max-w-2xl mx-auto">
          <p>
            <strong className="text-slate-400">The average American leaves $7,000+ on the table in salary negotiations.</strong>
            {' '}Learning to negotiate effectively—and control your stress response—is one of the 
            highest-ROI financial skills you can develop. Practice with Haggle until you can 
            keep your composure under pressure.
          </p>
        </div>
      </div>
    </main>
  );
}
