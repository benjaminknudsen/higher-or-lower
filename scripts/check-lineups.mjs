import { readFileSync } from 'node:fs'
import { validMatch, isActiveMatch } from '../src/game/lineup.js'
const matches = JSON.parse(readFileSync(new URL('../src/data/lineupMatches.json',import.meta.url)))
const invalid = matches.filter(m => !validMatch(m))
const active = matches.filter(isActiveMatch)
if (!active.length || invalid.length || new Set(matches.map(m => m.id)).size !== matches.length) {
  console.error('Ugyldige eller dublerede startopstillinger:', invalid.map(m => m?.id))
  process.exitCode = 1
} else console.log(`Startopstillinger OK: ${matches.length} verificerede kampe med 11 startere; ${active.length} aktive.`)
