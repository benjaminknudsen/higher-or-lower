import { getHighScoreMedalTier, HIGH_SCORE_MEDAL_TIERS } from '../../game/highScoreMedal.js'

// Presentation only: derive milestones from the existing record and medal tiers.
export function medalProgress(score) {
  const best = Number.isSafeInteger(score) && score >= 0 ? score : 0
  const current = getHighScoreMedalTier(best)
  const next = HIGH_SCORE_MEDAL_TIERS[HIGH_SCORE_MEDAL_TIERS.indexOf(current) + 1] ?? null
  return { best, current, next, remaining: next ? next.minScore - best : 0 }
}
