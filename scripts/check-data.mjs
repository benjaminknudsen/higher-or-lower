import { readFile } from 'node:fs/promises'
import { validateDatabase } from '../src/data/quality.js'

try {
  const database = JSON.parse(await readFile(new URL('../src/data/players.json', import.meta.url), 'utf8'))
  const result = validateDatabase(database)
  if (!result.valid) {
    console.error(result.errors.join('\n'))
    process.exitCode = 1
  } else {
    console.log(JSON.stringify({
      file: 'src/data/players.json',
      rows: result.playerCount,
      verifiedAppearancesPlayers: result.eligibleCount,
      ignoredRows: result.playerCount - result.eligibleCount,
      playable: result.eligibleCount >= 2,
      target: '150–200',
      statisticsAsOf: database.asOf,
    }, null, 2))
    for (const warning of result.warnings) console.warn(warning)
    if (process.argv.includes('--require-playable') && result.eligibleCount < 2) process.exitCode = 1
    if (process.argv.includes('--require-minimum') && result.eligibleCount < 150) process.exitCode = 1
  }
} catch {
  console.error('Spillerfilen kan ikke læses som JSON. Kontroller kommaer, anførselstegn og filformat i src/data/players.json.')
  process.exitCode = 1
}
