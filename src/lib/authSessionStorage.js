// One Supabase client, with a storage destination selected before password login.
// The shared policy contains no tokens. It prevents other tabs from writing a
// session back to localStorage after this device switches to session-only login.
export function createAuthSessionStorage(storageKey, env = globalThis) {
  function available(name) { try { return env[name] ?? null } catch { return null } }
  const local = available('localStorage'), session = available('sessionStorage')
  const memory = new Map()
  const policyKey = `${storageKey}:persistence`
  const generationKey = `${storageKey}:session-generation`
  const keys = new Set([storageKey, `${storageKey}-user`, `${storageKey}-code-verifier`])
  let memoryPolicy = { remember: true, generation: 'legacy' }
  let memoryGeneration = ''
  function policy() {
    try {
      const raw = (local ?? session)?.getItem(policyKey)
      if (raw) {
        const value = JSON.parse(raw)
        if (typeof value.remember === 'boolean' && typeof value.generation === 'string') return value
      }
    } catch { /* Blocked storage falls back to this page's memory, never another store. */ }
    return memoryPolicy
  }
  let observedGeneration = policy().generation
  function tabOwns(value) {
    try { return (session ? session.getItem(generationKey) : memoryGeneration) === value.generation }
    catch { return false }
  }
  function target(value) { return value.remember ? local : session }
  const storage = {
    getItem(key) {
      keys.add(key)
      const value = policy()
      observedGeneration = value.generation
      if (!value.remember && !tabOwns(value)) return null
      try { return target(value)?.getItem(key) ?? memory.get(key) ?? null }
      catch { return memory.get(key) ?? null }
    },
    setItem(key, data) {
      keys.add(key)
      const value = policy()
      // Reject an in-flight write started before another tab changed account/mode.
      if (value.generation !== observedGeneration || (!value.remember && !tabOwns(value))) {
        throw new Error('Login er ændret i en anden fane. Log ind igen.')
      }
      const destination = target(value)
      if (destination) destination.setItem(key, data)
      else memory.set(key, data)
      // Session-only tokens must never leave a persistent copy behind.
      if (!value.remember) local?.removeItem(key)
      else session?.removeItem(key)
    },
    removeItem(key) {
      keys.add(key)
      local?.removeItem(key)
      session?.removeItem(key)
      memory.delete(key)
    },
  }
  function clear() {
    for (const key of keys) storage.removeItem(key)
    session?.removeItem(generationKey)
    memoryGeneration = ''
  }
  return {
    storage,
    select(remember) {
      clear()
      const value = { remember, generation: env.crypto?.randomUUID?.() ?? `${Date.now()}:${Math.random()}` }
      // Never silently keep old persistent credentials if clearing them fails.
      const policyStorage = local ?? session
      policyStorage?.setItem(policyKey, JSON.stringify(value))
      if (!remember) {
        if (session) session.setItem(generationKey, value.generation)
        else memoryGeneration = value.generation
      }
      memoryPolicy = value
      observedGeneration = value.generation
    },
    clear,
    clearTab() {
      // A delayed logout broadcast must not delete a newer shared login.
      for (const key of keys) { session?.removeItem(key); memory.delete(key) }
    },
    prepare() {
      // Signup/reset/PKCE may start in a new tab without a password-login choice.
      const value = policy()
      observedGeneration = value.generation
      if (!value.remember && !tabOwns(value)) {
        if (session) session.setItem(generationKey, value.generation)
        else memoryGeneration = value.generation
      }
    },
    ownsSession(value) {
      if (!value) return false
      try {
        const stored = JSON.parse(storage.getItem(storageKey) ?? 'null')
        return stored?.user?.id === value.user?.id && stored?.access_token === value.access_token
      } catch { return false }
    },
  }
}
