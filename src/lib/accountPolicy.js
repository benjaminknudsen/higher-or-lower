// Public username policy, shared with the planned database constraints.
// Login itself uses email, never this public identifier.
export function canonicalUsername(input) {
  if (typeof input !== 'string') return null
  const value = input.trim()
  if (!/^[A-Za-z0-9_]{3,24}$/.test(value)) return null
  return value.toLowerCase()
}
