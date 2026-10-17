// Checks local completeness only. A human must verify the number against its source.
export const APPEARANCES_SCOPE = 'fcm-transfermarkt-competition-total-v1'
const text = value => typeof value === 'string' && value.trim().length > 0
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(value)
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}
function validSource(value) {
  if (!text(value)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && url.hostname.includes('.')
  } catch { return false }
}
function validTransfermarktReference(value) {
  if (!validSource(value)) return false
  const url = new URL(value)
  return ['transfermarkt.com', 'www.transfermarkt.com'].includes(url.hostname)
    && /\/verein\/865(?:\/|$)/.test(url.pathname)
}
function rowProblem(player) {
  if (!player || typeof player !== 'object') return 'Posten er ikke et spillerobjekt'
  if (!text(player.id) || !text(player.name)) return 'Navn eller entydigt ID mangler'
  if (player.verified !== true) return 'Kamptallet er ikke markeret som kontrolleret'
  if (!Number.isSafeInteger(player.appearances) || player.appearances < 0) return 'Kamptallet skal være et heltal på mindst 0'
  if (!validSource(player.source)) return 'Gyldigt HTTPS-kildelink mangler'
  if (!validDate(player.lastChecked)) return 'Kontroldato skal være YYYY-MM-DD'
  if (player.scopeId !== APPEARANCES_SCOPE) return 'Statistikken bruger en anden turneringsdefinition'
  if (!validTransfermarktReference(player.transfermarktReference ?? player.source)) return 'Transfermarkt-reference til FCM (865) mangler'
  if (!text(player.verificationNote)) return 'Kontrolnote for Competition: Total mangler'
  return null
}
function inspectRows(players) {
  const complete = []
  const warnings = []
  for (const [index, player] of players.entries()) {
    const problem = rowProblem(player)
    if (problem) warnings.push(`Post ${index + 1}: ${problem}`)
    else complete.push(player)
  }
  const identities = new Map()
  const names = new Map()
  for (const player of complete) {
    const id = player.id.trim()
    const name = player.name.trim().toLocaleLowerCase('da-DK')
    identities.set(id, (identities.get(id) ?? 0) + 1)
    names.set(name, (names.get(name) ?? 0) + 1)
  }
  const eligible = complete.filter(player => {
    const duplicate = identities.get(player.id.trim()) > 1 || names.get(player.name.trim().toLocaleLowerCase('da-DK')) > 1
    if (duplicate) warnings.push(`Dublet udeladt: ${player.name}`)
    return !duplicate
  })
  return { eligible, warnings }
}
export function validateDatabase(database) {
  const errors = []
  if (database?.clubId !== 'fcm') errors.push('Spillerfilen skal tilhøre FCM')
  if (database?.scopeId !== APPEARANCES_SCOPE) errors.push('Filen skal bruge Transfermarkt Competition: Total-definitionen')
  if (database?.asOf !== null && !validDate(database?.asOf)) errors.push('Filens skæringsdato asOf skal være YYYY-MM-DD eller null, når ingen fælles statistikdato er fastlagt')
  if (!Array.isArray(database?.players)) errors.push('players skal være en liste')
  if (database?.isTestData === true) errors.push('Demo-data må ikke bruges i produktionsspillet')
  if (errors.length) return { valid: false, errors, warnings: [], playerCount: 0, eligibleCount: 0 }
  const { eligible, warnings } = inspectRows(database.players)
  return { valid: true, errors: [], warnings, playerCount: database.players.length, eligibleCount: eligible.length }
}
export function getVerifiedPlayers(database, clubId, statisticKey) {
  if (clubId !== database?.clubId || statisticKey !== 'appearances' || !validateDatabase(database).valid) return []
  return inspectRows(database.players).eligible.map(player => ({
    id: player.id.trim(), name: player.name.trim(),
    stats: { appearances: player.appearances },
    source: player.source, lastChecked: player.lastChecked,
    ...(player.localImage ? { localImage: player.localImage } : {}),
  }))
}
