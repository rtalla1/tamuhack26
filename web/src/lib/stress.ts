// Stress calculation from biometric data

export interface BiometricInput {
  heartRate: number;
  breathingRate: number;
  breathingAmplitude?: number;
}

export interface Baseline {
  heartRate: number;
  breathingRate: number;
}

export interface StressResult {
  score: number;           // 0-100
  trend: 'rising' | 'falling' | 'stable';
  isElevated: boolean;     // Above threshold
  components: {
    heartRate: number;     // 0-100
    breathing: number;     // 0-100
  };
}

export function calculateStress(
  current: BiometricInput,
  baseline: Baseline | null,
  history: Array<{ stressScore: number }>
): StressResult {
  // If no baseline yet, return neutral
  if (!baseline) {
    return {
      score: 50,
      trend: 'stable',
      isElevated: false,
      components: { heartRate: 50, breathing: 50 },
    };
  }

  // Heart rate component: increase from baseline = stress
  // Normal: baseline, Stressed: +20-40%
  const hrChange = ((current.heartRate - baseline.heartRate) / baseline.heartRate) * 100;
  const hrScore = clamp(50 + hrChange * 2.5, 0, 100);

  // Breathing component: faster breathing = stress
  const brChange = ((current.breathingRate - baseline.breathingRate) / baseline.breathingRate) * 100;
  const breathingScore = clamp(50 + brChange * 2, 0, 100);

  // Weighted overall score
  const score = Math.round(hrScore * 0.6 + breathingScore * 0.4);

  // Calculate trend from recent history
  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  if (history.length >= 10) {
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    const recentAvg = average(recent.map(h => h.stressScore));
    const olderAvg = average(older.map(h => h.stressScore));
    
    if (recentAvg > olderAvg + 5) trend = 'rising';
    else if (recentAvg < olderAvg - 5) trend = 'falling';
  }

  return {
    score,
    trend,
    isElevated: score > 65,
    components: {
      heartRate: Math.round(hrScore),
      breathing: Math.round(breathingScore),
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
