'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const startSession = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.id) {
        router.push(`/session/${data.id}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Haggle
          </h1>
          <p className="text-2xl text-slate-300 mb-2">
            Your body betrays you.
          </p>
          <p className="text-xl text-slate-400 mb-12">
            Learn to beat it.
          </p>

          {/* Value Proposition */}
          <div className="bg-slate-800/50 rounded-2xl p-8 mb-12 border border-slate-700">
            <p className="text-lg text-slate-300 mb-6">
              The average person leaves <span className="text-red-400 font-bold">$7,000</span> on 
              the table in salary negotiations. Not because they don&apos;t know what to say—but 
              because their body gives them away.
            </p>
            <p className="text-lg text-slate-300">
              <span className="text-blue-400 font-semibold">Haggle</span> lets you practice 
              negotiating with <span className="text-blue-400 font-semibold">Hal</span>, an AI 
              that reads your stress in real-time and uses it against you—just like a real 
              opponent would.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={startSession}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-xl font-semibold px-12 py-4 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg shadow-blue-500/25"
          >
            {isCreating ? 'Creating Session...' : 'Start Negotiating'}
          </button>

          {/* How It Works */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-semibold text-white mb-2">Connect Your Phone</h3>
              <p className="text-slate-400 text-sm">
                Your phone&apos;s camera tracks your heart rate and breathing using Presage&apos;s 
                clinical-grade biometrics.
              </p>
            </div>
            
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-3xl mb-3">🎭</div>
              <h3 className="text-lg font-semibold text-white mb-2">Negotiate with Hal</h3>
              <p className="text-slate-400 text-sm">
                Hal has a secret budget. Hal reads your stress. Hal adapts tactics in real-time. 
                Can you keep your composure?
              </p>
            </div>
            
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">See The Reveal</h3>
              <p className="text-slate-400 text-sm">
                After negotiating, see Hal&apos;s hidden budget, when your stress spiked, and 
                exactly how much money you left on the table.
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-16 text-slate-500 text-sm">
            <p>Powered by Presage · Google Gemini · ElevenLabs</p>
          </div>
        </div>
      </div>
    </main>
  );
}
