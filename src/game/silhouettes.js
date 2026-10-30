// Presentation only. Anonymous silhouettes never represent actual player appearance.
export const SILHOUETTES = Object.freeze([
  '/images/footballers/player-1.png',
  '/images/footballers/player-2.png',
  '/images/footballers/player-3.png',
  '/images/footballers/player-4.png',
  '/images/footballers/player-5.png',
])

export const REAR_SILHOUETTES = Object.freeze(Array.from({ length:5 }, (_, index) => `/images/silhouettes/footballer-rear-${index+1}.png`))

export function assignSilhouettes(players, random = Math.random, artwork = SILHOUETTES) {
  let bag = []
  let previous = null
  return Object.fromEntries(players.map(player => {
    if (!bag.length) {
      bag = [...artwork]
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
