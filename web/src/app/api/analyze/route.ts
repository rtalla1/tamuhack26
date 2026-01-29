// Gemini-powered post-conversation analysis
import { NextRequest, NextResponse } from "next/server";

interface AnalysisRequest {
  messages: Array<{
    role: "user" | "hal";
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

export async function POST(request: NextRequest) {
  try {
    const { messages, hiddenState, stressHistory }: AnalysisRequest =
      await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Build conversation transcript
    const transcript = messages
      .map((m) => `${m.role === "user" ? "USER" : "HAL"}: ${m.content}`)
      .join("\n");

    // Calculate average and peak stress
    const avgStress =
      stressHistory.length > 0
        ? Math.round(
            stressHistory.reduce((a, b) => a + b, 0) / stressHistory.length,
          )
        : 50;
    const peakStress =
      stressHistory.length > 0 ? Math.max(...stressHistory) : 50;

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
- Elevated stress (>65%) occurred ${stressHistory.filter((s) => s > 65).length} times
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
  },
  "financialLiteracy": {
    "concept": <1-sentence explanation of the key financial concept demonstrated (e.g., "Knowing your walk-away number prevents costly emotional decisions", "Anchoring bias affects perceived value", "Negotiation can significantly impact lifetime earnings")>,
    "realWorldApplication": <2-3 sentences on how this applies to personal finance, salary negotiations, major purchases, or financial planning>,
    "savingsImpact": <Optional: if applicable, estimate potential savings/earnings impact, e.g., "$5,000 better negotiation = $150,000+ over 30-year mortgage" or "Negotiating a $5k salary increase = $200k+ over career">
  }
}

SCORING GUIDANCE:
- Score should reflect how close they got to Hal's walk-away limit ($${hiddenState.walkAwayPrice.toLocaleString()})
- Accepting the first offer ($${hiddenState.currentOffer.toLocaleString()}) with no pushback = poor (D/F range)
- Getting near or past Hal's target ($${hiddenState.targetPrice.toLocaleString()}) = good (B/C range)
- Getting close to or exceeding Hal's walk-away ($${hiddenState.walkAwayPrice.toLocaleString()}) = excellent (A range)
- Factor in: composure under stress, use of tactics, information gathering, and confidence
- Be constructive but honest - this is a learning tool

HANDLING INCOMPLETE NEGOTIATIONS:
- If the conversation ended without an agreed price, set agreedPrice to null and dealReached to false
- Walking away CAN be a good tactic if the terms were unfavorable - score based on the reasoning shown
- If the user barely engaged (1-2 exchanges), note this but still provide constructive feedback
- If the negotiation was cut short, assess what WAS demonstrated and suggest what they could try next time
- A short negotiation with good technique is better than a long one with poor technique

FINANCIAL LITERACY GUIDANCE:
- Emphasize how negotiation skills translate to real financial impact
- Connect stress management to better financial decision-making
- Highlight the compound effect of negotiation (e.g., salary increases compound over careers)
- Frame feedback in terms of financial empowerment and long-term wealth building
- If discussing salary: mention that a $5k increase can become $200k+ over a career
- If discussing purchases: show how negotiation saves more than discounts/coupons ever could

Return ONLY the JSON object. No markdown formatting or extra explanation.`;

    // Call Gemini API directly via REST
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API error:", errorData);

      // Check if it's a rate limit error
      if (geminiResponse.status === 429) {
        // Try to extract retry delay from error response
        let retryAfter = 30;
        try {
          const errorJson = JSON.parse(errorData);
          const retryInfo = errorJson?.error?.details?.find(
            (d: { "@type": string }) => d["@type"]?.includes("RetryInfo"),
          );
          if (retryInfo?.retryDelay) {
            retryAfter = parseInt(retryInfo.retryDelay) || 30;
          }
        } catch {
          // Use default retry time
        }

        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message:
              "Gemini API rate limit reached. The analysis will automatically retry.",
            retryAfter,
            isRateLimit: true,
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Gemini API error", details: errorData },
        { status: 500 },
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!responseText) {
      return NextResponse.json(
        { error: "Empty response from Gemini" },
        { status: 500 },
      );
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonText = responseText;
    if (responseText.includes("```json")) {
      jsonText = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      jsonText = responseText.split("```")[1].split("```")[0];
    }

    const analysis: AnalysisResult = JSON.parse(jsonText.trim());

    // Calculate money left on table (only if a deal was actually reached)
    if (analysis.dealReached && analysis.agreedPrice !== null) {
      // Determine direction: user wants higher (salary) or lower (buying)
      const userWantsHigher =
        hiddenState.currentOffer < hiddenState.walkAwayPrice;
      analysis.moneyLeftOnTable = userWantsHigher
        ? hiddenState.walkAwayPrice - analysis.agreedPrice // Could've gotten more
        : analysis.agreedPrice - hiddenState.walkAwayPrice; // Could've paid less
    } else {
      // No deal reached - can't calculate money left on table
      analysis.moneyLeftOnTable = 0;
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to analyze conversation", details: errorMessage },
      { status: 500 },
    );
  }
}
