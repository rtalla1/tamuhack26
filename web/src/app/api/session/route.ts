// API route for creating and managing sessions
import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSession, completeSession } from '@/lib/store';

interface CreateSessionRequest {
  openingOffer?: number;
  targetPrice?: number;
  walkAwayPrice?: number;
}

// POST - Create a new session
export async function POST(request: NextRequest) {
  let prices: CreateSessionRequest = {};
  
  try {
    prices = await request.json();
  } catch {
    // Use defaults if no body provided
  }

  const session = createSession({
    currentOffer: prices.openingOffer,
    targetPrice: prices.targetPrice,
    walkAwayPrice: prices.walkAwayPrice,
  });
  
  return NextResponse.json({
    id: session.id,
    status: session.status,
    createdAt: session.createdAt,
  });
}

// GET - Get session status (without hidden state)
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('id');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }
  
  const session = getSession(sessionId);
  
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  
  // Don't expose hidden state during active session
  if (session.status !== 'completed') {
    return NextResponse.json({
      id: session.id,
      status: session.status,
      conversationCount: session.conversation.length,
      hasBaseline: session.baseline !== null,
    });
  }
  
  // If completed, return everything for the reveal
  return NextResponse.json(session);
}

// PATCH - Complete a session
export async function PATCH(request: NextRequest) {
  const { sessionId, finalDeal } = await request.json();
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }
  
  completeSession(sessionId, finalDeal);
  
  // Return full session for reveal
  const session = getSession(sessionId);
  return NextResponse.json(session);
}
