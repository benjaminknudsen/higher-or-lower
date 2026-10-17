// Presentation only: bounded tiers, independent of scoring and round timing.
export function celebrationForScore(score) {
  const level = score >= 20 ? 4 : score >= 10 ? 3 : score >= 5 ? 2 : 1
  return { level, particles: 8 + level * 4 }
}

// Exact milestones: no repeated headline on the following rounds.
export function milestoneForScore(score) {
  return {
    10: { title: 'STÆRKT!', sparks: 0 },
    20: { title: 'DU KENDER DINE ULVE!', sparks: 0 },
    50: { title: 'ULVELEGENDE!', sparks: 24 },
    100: { title: 'DU ER JO FCM!', sparks: 48 },
  }[score] ?? null
}
