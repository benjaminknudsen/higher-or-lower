// Presentation only. Anonymous silhouettes never represent actual player appearance.
export const SILHOUETTES = Object.freeze([
  '/images/silhouettes/stocky-crop.webp',
  '/images/silhouettes/slim-curls.webp',
  '/images/silhouettes/athletic-bun.webp',
  '/images/silhouettes/broad-bald.webp',
  '/images/silhouettes/lean-locks.webp',
])

export function assignSilhouettes(players, random = Math.random) {
  let bag = []
  let previous = null
  return Object.fromEntries(players.map(player => {
    if (!bag.length) {
      bag = [...SILHOUETTES]
      for (let index = bag.length - 1; index > 0; index--) {
        const other = Math.floor(random() * (index + 1))
        ;[bag[index], bag[other]] = [bag[other], bag[index]]
      }
      // Adjacent cards always have different figures, including across bag boundaries.
      if (bag[0] === previous) [bag[0], bag[1]] = [bag[1], bag[0]]
    }
    previous = bag.shift()
    return [player.id, previous]
  }))
}
