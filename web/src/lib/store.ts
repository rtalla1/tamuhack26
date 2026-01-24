// In-memory session store for Haggle
// No database needed - sessions persist for the demo duration

import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  createdAt: number;
  status: 'calibrating' | 'active' | 'completed';
  
  // Hidden state - Hal's secret information
  hiddenState: {
    walkAwayPrice: number;    // Maximum Hal will pay
    targetPrice: number;      // What Hal wants to pay
    currentOffer: number;     // Hal's current offer
    tactics: string[];        // Queue of tactics to use
    currentTacticIndex: number;
    stressThreshold: number;  // When to exploit stress (0-100)
  };
  
  // Conversation history
  conversation: Array<{
    role: 'user' | 'hal';
    content: string;
    timestamp: number;
    stressAtTime?: number;
    tacticUsed?: string;
  }>;
  
  // Biometrics timeline
  biometrics: Array<{
    timestamp: number;
    heartRate: number;
    breathingRate: number;
    stressScore: number;
  }>;
  
  // Tactics that were deployed
  tacticsUsed: Array<{
    timestamp: number;
    tactic: string;
    stressAtTime: number;
    exploitedStress: boolean;
  }>;
  
  // Baseline (set during calibration)
  baseline: {
    heartRate: number;
    breathingRate: number;
  } | null;
  
  // Final result
  finalDeal: number | null;
}

// Simple in-memory store
const sessions = new Map<string, Session>();

export function createSession(): Session {
  const session: Session = {
    id: uuidv4(),
    createdAt: Date.now(),
    status: 'calibrating',
    hiddenState: {
      walkAwayPrice: 95000,   // Hal will pay up to $95k
      targetPrice: 82000,     // Hal wants to pay $82k
      currentOffer: 78000,    // Hal starts at $78k
      tactics: [
        'anchor',           // Start with low offer
        'budget_constraint', // "Our budget is limited"
        'urgency',          // "We need to decide soon"
        'silence',          // Strategic pauses
        'final_offer',      // "This is our best offer"
      ],
      currentTacticIndex: 0,
      stressThreshold: 65,  // Exploit when stress > 65
    },
    conversation: [],
    biometrics: [],
    tacticsUsed: [],
    baseline: null,
    finalDeal: null,
  };
  
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function updateSession(id: string, updates: Partial<Session>): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  
  const updated = { ...session, ...updates };
  sessions.set(id, updated);
  return updated;
}

export function addMessage(
  id: string, 
  role: 'user' | 'hal', 
  content: string,
  stressAtTime?: number,
  tacticUsed?: string
): void {
  const session = sessions.get(id);
  if (!session) return;
  
  session.conversation.push({
    role,
    content,
    timestamp: Date.now(),
    stressAtTime,
    tacticUsed,
  });
}

export function addBiometric(id: string, data: Omit<Session['biometrics'][0], 'timestamp'>): void {
  const session = sessions.get(id);
  if (!session) return;
  
  session.biometrics.push({
    ...data,
    timestamp: Date.now(),
  });
  
  // Set baseline from first 20 readings (calibration phase)
  if (!session.baseline && session.biometrics.length >= 20) {
    const calibrationData = session.biometrics.slice(0, 20);
    session.baseline = {
      heartRate: average(calibrationData.map(b => b.heartRate)),
      breathingRate: average(calibrationData.map(b => b.breathingRate)),
    };
    session.status = 'active';
  }
}

export function logTactic(
  id: string, 
  tactic: string, 
  stressAtTime: number, 
  exploitedStress: boolean
): void {
  const session = sessions.get(id);
  if (!session) return;
  
  session.tacticsUsed.push({
    timestamp: Date.now(),
    tactic,
    stressAtTime,
    exploitedStress,
  });
}

export function completeSession(id: string, finalDeal: number | null): void {
  const session = sessions.get(id);
  if (!session) return;
  
  session.status = 'completed';
  session.finalDeal = finalDeal;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
