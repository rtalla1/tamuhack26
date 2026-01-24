// Negotiation tactics for Hal

export interface Tactic {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  stressMultiplier: number; // How much this tactic increases stress
}

export const TACTICS: Record<string, Tactic> = {
  anchor: {
    id: 'anchor',
    name: 'Anchoring',
    description: 'Start with a low offer to set expectations',
    promptModifier: `Start with a firm, low offer ($78,000). Sound confident and justify it with market data. 
This sets the anchor for the entire negotiation. Don't apologize for the number.`,
    stressMultiplier: 1.2,
  },
  
  budget_constraint: {
    id: 'budget_constraint',
    name: 'Budget Constraint',
    description: 'Claim limited budget to reduce expectations',
    promptModifier: `Mention that your budget is constrained. Say something like "I wish I could go higher, 
but the budget for this role is quite firm" or "I need to work within what's been approved." 
Sound sympathetic but limited by external forces.`,
    stressMultiplier: 1.1,
  },
  
  urgency: {
    id: 'urgency',
    name: 'Time Pressure',
    description: 'Create urgency to force quick decisions',
    promptModifier: `Introduce time pressure. Mention that you have other candidates in the pipeline, 
or that you need to make a decision soon. Say something like "We're hoping to close this position 
by end of week" or "I do have other candidates I'm speaking with." Be matter-of-fact, not threatening.`,
    stressMultiplier: 1.4,
  },
  
  silence: {
    id: 'silence',
    name: 'Strategic Silence',
    description: 'Use pauses to create pressure',
    promptModifier: `After the candidate makes their point, respond with a thoughtful pause phrase like 
"Hmm, let me think about that..." or "That's interesting..." then continue with your response. 
Create a moment of tension before responding substantively.`,
    stressMultiplier: 1.3,
  },
  
  final_offer: {
    id: 'final_offer',
    name: 'Final Offer',
    description: 'Present a take-it-or-leave-it deal',
    promptModifier: `Present this as your absolute best offer. Say something like "Let me see what I can do... 
Okay, the best I can offer is [amount]. This is really stretching our budget." 
Sound like you've gone to bat for them. Be definitive that this is the limit.`,
    stressMultiplier: 1.4,
  },
  
  good_cop: {
    id: 'good_cop',
    name: 'Good Cop',
    description: 'Show empathy while holding firm',
    promptModifier: `Be warm and understanding. Show that you personally want to help them get more, 
but your hands are tied. Say things like "I totally understand where you're coming from" 
or "If it were up to me..." Build rapport while maintaining your position.`,
    stressMultiplier: 0.9,
  },
  
  small_concession: {
    id: 'small_concession',
    name: 'Small Concession',
    description: 'Give a little to get a lot',
    promptModifier: `Offer a small concession to show good faith. Increase your offer by $2,000-3,000 
but frame it as a significant gesture. Say "Let me see if I can move on this... 
I can go up to [new amount]. I'm really stretching here." Expect reciprocation.`,
    stressMultiplier: 0.8,
  },
};

export function selectTactic(
  tactics: string[],
  currentIndex: number,
  stressScore: number,
  stressThreshold: number
): { tactic: Tactic; newIndex: number; exploitedStress: boolean } {
  let exploitedStress = false;
  let selectedTactic: Tactic;
  
  // If stress is above threshold, use a pressure tactic
  if (stressScore >= stressThreshold) {
    const pressureTactics = ['urgency', 'silence', 'final_offer'];
    const available = pressureTactics.filter(t => TACTICS[t]);
    
    if (available.length > 0) {
      const randomPressure = available[Math.floor(Math.random() * available.length)];
      selectedTactic = TACTICS[randomPressure];
      exploitedStress = true;
      
      return { tactic: selectedTactic, newIndex: currentIndex, exploitedStress };
    }
  }
  
  // Otherwise, follow the queue
  const tacticId = tactics[currentIndex % tactics.length];
  selectedTactic = TACTICS[tacticId] || TACTICS.anchor;
  
  return {
    tactic: selectedTactic,
    newIndex: currentIndex + 1,
    exploitedStress: false,
  };
}
