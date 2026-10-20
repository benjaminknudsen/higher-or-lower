import { readStore, retireInactiveRound } from '../game/lineup'
import matches from '../data/lineupMatches.json'
export function loadLineupStore() {
  try { return retireInactiveRound(readStore(window.localStorage), matches) } catch { return readStore(null) }
}
