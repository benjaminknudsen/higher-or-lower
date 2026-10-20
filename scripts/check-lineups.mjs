import { readFileSync } from 'node:fs'
import { validMatch, isActiveMatch } from '../src/game/lineup.js'
const matches = JSON.parse(readFileSync(new URL('../src/data/lineupMatches.json',import.meta.url)))
const pending = JSON.parse(readFileSync(new URL('../src/data/lineupMatches.pending.json',import.meta.url)))
const invalid = matches.filter(m => !validMatch(m))
const active = matches.filter(isActiveMatch)
// Pending research is deliberately outside the playable database and Vite bundle.
const invalidPending = pending.filter(m => m.active !== false || m.verified !== false || m.formation !== null || !m.verificationNote || !Array.isArray(m.sources) || !m.sources.length || !m.sources.every(s => /^https:\/\//.test(s)) || !Array.isArray(m.players) || m.players.length !== 11 || new Set(m.players.map(p => p.id)).size !== 11 || new Set(m.players.map(p => p.name)).size !== 11 || m.players.some(p => !p.id || !p.name || p.row !== null || p.slot !== null || p.shirtNumber !== null))
const all = [...matches,...pending]
const duplicateIds = new Set(all.map(m => m.id)).size !== all.length
const duplicateFixtures = new Set(all.map(m => `${m.date}:${[m.home,m.away].sort().join(':')}`)).size !== all.length
if (!active.length || invalid.length || invalidPending.length || duplicateIds || duplicateFixtures) {
  console.error('Ugyldige eller dublerede startopstillinger:', [...invalid,...invalidPending].map(m => m?.id), {duplicateIds,duplicateFixtures})
  process.exitCode = 1
} else console.log(`Startopstillinger OK: ${matches.length} verificerede kampe med 11 startere; ${active.length} aktive; ${pending.length} uafklarede uden for spilpuljen.`)
