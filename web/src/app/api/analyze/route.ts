// Gemini-powered post-conversation analysis
import { NextRequest, NextResponse } from 'next/server';

interface AnalysisRequest {
  messages: Array<{
    role: 'user' | 'hal';
    content: string;
  }>;
  hiddenState: {
    walkAwayPrice: number;
    targetPrice: number;
    currentOffer: number;
  };
  stressHistory: number[];
}

interface AnalysisResult {
  agreedPrice: number | null;
  dealReached: boolean;
  userPerformance: {
    score: number; // 0-100
    grade: string; // A, B, C, D, F
    summary: string;
  };
  tactics: {
    halUsed: string[];
    userUsed: string[];
  };
  keyMoments: Array<{
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  feedback: {
    strengths: string[];
    improvements: string[];
    tips: string[];
  };
  moneyLeftOnTable: number;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, hiddenState, stressHistory }: AnalysisRequest = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Build conversation transcript
    const transcript = messages.map(m => 
      `${m.role === 'user' ? 'USER' : 'HAL'}: ${m.content}`
    ).join('\n');

    // Calculate average and peak stress
    const avgStress = stressHistory.length > 0 
      ? Math.round(stressHistory.reduce((a, b) => a + b, 0) / stressHistory.length)
      : 50;
    const peakStress = stressHistory.length > 0 
      ? Math.max(...stressHistory)
      : 50;

    const prompt = `You are an expert negotiation coach analyzing a negotiation practice session.

## CONTEXT
- Hal (the AI) was the other party in this negotiation
- Hal's HIDDEN information (the user didn't know this):
  - Starting position: $${hiddenState.currentOffer.toLocaleString()}
  - Target (what Hal ideally wanted): $${hiddenState.targetPrice.toLocaleString()}
  - Walk-away limit (Hal's absolute boundary): $${hiddenState.walkAwayPrice.toLocaleString()}

## USER'S STRESS DATA
- Average stress level: ${avgStress}%
- Peak stress level: ${peakStress}%
- Elevated stress (>65%) occurred ${stressHistory.filter(s => s > 65).length} times
- Stress can indicate moments of pressure, uncertainty, or being caught off-guard

## CONVERSATION TRANSCRIPT
${transcript}

## YOUR TASK
Analyze this negotiation objectively. The user's goal was to get the best deal for themselves. Return a JSON object with this structure:

{
  "agreedPrice": <number or null if no deal was reached>,
  "dealReached": <boolean>,
  "userPerformance": {
    "score": <0-100 based on how well they negotiated>,
    "grade": <"A", "B", "C", "D", or "F">,
    "summary": <2-3 sentence overall assessment of their performance>
  },
  "tactics": {
    "halUsed": [<list of tactics Hal used, e.g., "anchoring", "time pressure", "budget constraint", "empathy play", "strategic silence">],
    "userUsed": [<list of tactics the user employed, e.g., "counter-offer", "asked questions", "walked away", "cited alternatives", "stayed firm">]
  },
  "keyMoments": [
    {
      "description": <brief description of a pivotal moment in the negotiation>,
      "impact": <"positive", "negative", or "neutral" for the user>
    }
  ],
  "feedback": {
    "strengths": [<2-3 things they did well, be specific>],
    "improvements": [<2-3 things they could improve, be actionable>],
    "tips": [<2-3 specific, practical tips for their next negotiation>]
  }
}

SCORING GUIDANCE:
- Score should reflect how close they got to Hal's walk-away limit ($${hiddenState.walkAwayPrice.toLocaleString()})
- Accepting the first offer ($${hiddenState.currentOffer.toLocaleString()}) with no pushback = poor (D/F range)
- Getting near or past Hal's target ($${hiddenState.targetPrice.toLocaleString()}) = good (B/C range)
- Getting close to or exceeding Hal's walk-away ($${hiddenState.walkAwayPrice.toLocaleString()}) = excellent (A range)
- Factor in: composure under stress, use of tactics, information gathering, and confidence
- If no price was agreed upon, assess based on their approach and process
- Be constructive but honest - this is a learning tool

Return ONLY the JSON object. No markdown formatting or extra explanation.`;

    // Call Gemini API directly via REST
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      
      // Check if it's a rate limit error
      if (geminiResponse.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          retryAfter: 30 
        }, { status: 429 });
      }
      
      return NextResponse.json({ error: 'Gemini API error', details: errorData }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!responseText) {
      return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 });
    }
    
    // Parse JSON from response (handle potential markdown wrapping)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0];
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0];
    }

    const analysis: AnalysisResult = JSON.parse(jsonText.trim());

    // Calculate money left on table
    const finalPrice = analysis.agreedPrice || hiddenState.currentOffer;
    analysis.moneyLeftOnTable = hiddenState.walkAwayPrice - finalPrice;

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to analyze conversation', details: errorMessage },
      { status: 500 }
    );
  }
}
