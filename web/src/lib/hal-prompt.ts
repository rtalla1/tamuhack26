// Hal's persona and hidden state for the negotiation

export type ScenarioType = "salary" | "b2b" | "consumer";

export interface HiddenState {
  walkAwayPrice: number;    // Maximum Hal will pay (or minimum for selling scenarios)
  targetPrice: number;      // What Hal wants to pay/receive
  currentOffer: number;     // Hal's starting offer
  stressThreshold: number;  // When to exploit stress (0-100)
  scenarioType?: ScenarioType;
  scenarioId?: string;
}

export const DEFAULT_HIDDEN_STATE: HiddenState = {
  walkAwayPrice: 95000,
  targetPrice: 82000,
  currentOffer: 78000,
  stressThreshold: 65,
  scenarioType: "salary",
};

// Scenario-specific persona configurations
const SCENARIO_CONFIGS: Record<string, {
  persona: string;
  context: string;
  openingLine: string;
}> = {
  // Salary scenarios - Hal is hiring manager
  "mid": {
    persona: "a hiring manager at a growing tech company",
    context: "a software engineering position",
    openingLine: "Hi there! I'm Hal, and I'll be handling the compensation discussion today. We're really excited about the possibility of you joining the team.",
  },
  "senior": {
    persona: "a VP of Engineering at a Series B startup",
    context: "a senior technical lead position",
    openingLine: "Thanks for making time for this call. I'm Hal, VP of Engineering. We've been impressed with your background and think you'd be a great fit for the team.",
  },
  // B2B scenarios - Hal is a vendor/sales rep
  "saas-vendor": {
    persona: "an enterprise sales rep at a SaaS company",
    context: "an annual software license contract",
    openingLine: "Hey there! I'm Hal from the enterprise team. I've put together a proposal for your team's software needs. Let me walk you through the pricing.",
  },
  "consulting": {
    persona: "a partner at a consulting firm",
    context: "a monthly consulting retainer agreement",
    openingLine: "Thanks for considering us for this engagement. I'm Hal, one of the partners here. Based on the scope you described, I've prepared a proposal.",
  },
  // Consumer scenarios - Hal is a seller
  "used-car": {
    persona: "a private seller on Facebook Marketplace",
    context: "a used 2019 Honda Civic with 45k miles",
    openingLine: "Hey! Thanks for coming by to see the car. I'm Hal. So yeah, as I mentioned in the listing, I'm asking eighteen thousand for it.",
  },
  "freelance": {
    persona: "a potential client looking for web development work",
    context: "a custom website project",
    openingLine: "Hi there, thanks for getting back to me. I'm Hal. So I need a website for my small business - nothing too crazy, but it needs to look professional.",
  },
};

// Build stress context update message
export function buildStressContext(
  stressScore: number,
  trend: 'rising' | 'falling' | 'stable',
  additionalMetrics?: {
    breathingAmplitude?: number;
    isTalking?: boolean;
    heartRate?: number;
    breathingRate?: number;
  }
): string {
  let advice: string;

  if (stressScore < 40) {
    advice = 'The other party seems calm. Build rapport.';
  } else if (stressScore < 65) {
    advice = 'They show some tension. Continue balanced negotiation.';
  } else {
    advice = 'They appear stressed. This is a strategic opportunity - hold firm while staying professional.';
  }

  // Build enriched context with additional biometric signals
  let enrichedContext = `[INTERNAL CONTEXT - Do not mention to the other party]
Their stress level: ${stressScore}% (${trend})`;

  if (additionalMetrics) {
    const signals: string[] = [];
    
    if (additionalMetrics.heartRate && additionalMetrics.heartRate > 85) {
      signals.push('elevated heart rate');
    }
    
    if (additionalMetrics.breathingAmplitude && additionalMetrics.breathingAmplitude < 50) {
      signals.push('shallow breathing');
    }
    
    if (additionalMetrics.breathingRate && additionalMetrics.breathingRate > 18) {
      signals.push('rapid breathing');
    }
    
    if (additionalMetrics.isTalking) {
      signals.push('actively speaking (engaged)');
    }
    
    if (signals.length > 0) {
      enrichedContext += `\nPhysiological signals: ${signals.join(', ')}`;
    }
  }

  enrichedContext += `\n${advice}
NEVER mention stress, biometrics, or sensing anything. If asked how you know they're nervous, say "Just a sense from the conversation."`;

  return enrichedContext;
}
