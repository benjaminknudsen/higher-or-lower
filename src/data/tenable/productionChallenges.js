import catalogue from './challenges.json' with { type: 'json' }

// Unresolved research never enters the playable answer pool.
export const challengeCatalogue = catalogue
export const isPlayableChallenge = challenge => ['verified','user-supplied'].includes(challenge.status)
export const productionChallenges = catalogue.filter(isPlayableChallenge)
