export const HIGH_SCORE_MEDAL_TIERS = Object.freeze([
  { id: 'gray', minScore: 0, color: '#a8b0be', glow: '#a8b0be24', edge: '#a8b0be' },
  { id: 'green', minScore: 10, color: '#73db91', glow: '#73db9130', edge: '#73db91' },
  { id: 'yellow', minScore: 25, color: '#f0cd62', glow: '#f0cd6230', edge: '#f0cd62' },
  { id: 'red', minScore: 35, color: '#ff7183', glow: '#ff718330', edge: '#ff7183' },
  { id: 'cyan', minScore: 50, color: '#57dcf1', glow: '#57dcf130', edge: '#57dcf1' },
  {
    id: 'gold',
    minScore: 100,
    color: '#f2ca68',
    glow: '#f2ca6840',
    edge: 'linear-gradient(145deg, #fff0b5 0%, #d19a35 38%, #fff0b5 55%, #ad7618 100%)',
    scoreFill: 'linear-gradient(145deg, #fff2ba 0%, #e1b34f 48%, #fff0b5 72%, #bd861f 100%)',
  },
])

export function getHighScoreMedalTier(score) {
  const value = Number.isSafeInteger(score) && score >= 0 ? score : 0
  return HIGH_SCORE_MEDAL_TIERS.reduce((tier, candidate) => (
    candidate.minScore <= value ? candidate : tier
  ), HIGH_SCORE_MEDAL_TIERS[0])
}
