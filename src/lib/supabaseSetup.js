import { createClient } from '@supabase/supabase-js'

// Keep this module independent of Vite so configuration and connectivity can be
// checked by Node tests and scripts without ever printing environment values.
export function readSupabaseConfig(env = {}) {
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !publishableKey) {
    return { ok: false, status: 'not-configured', message: 'Angiv VITE_SUPABASE_URL og VITE_SUPABASE_PUBLISHABLE_KEY i .env.' }
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    return { ok: false, status: 'invalid-config', message: 'Frontend kræver en Supabase publishable key (sb_publishable_…).' }
  }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('invalid URL')
    return { ok: true, url: parsed.origin, publishableKey }
  } catch {
    return { ok: false, status: 'invalid-config', message: 'VITE_SUPABASE_URL skal være projektets HTTPS-adresse uden sti eller loginoplysninger.' }
  }
}

export function createSupabaseSetup(env, { enableAuth = false } = {}) {
  const config = readSupabaseConfig(env)
  if (!config.ok) return { client: null, ...config }
  try {
    const client = createClient(config.url, config.publishableKey, {
      // Auth stays dormant by default. Future UI can explicitly opt into Supabase
      // session persistence/refresh; existing game storage is never migrated.
      // URL exchange stays explicit so hash routing is not interpreted as Auth.
      auth: { persistSession: enableAuth, autoRefreshToken: enableAuth, detectSessionInUrl: false, flowType: 'pkce' },
    })
    return { client, ok: true, status: 'configured', message: 'Supabase-klienten er konfigureret. Forbindelsen er endnu ikke kontrolleret.' }
  } catch {
    return { client: null, ok: false, status: 'invalid-config', message: 'Supabase-klienten kunne ikke initialiseres.' }
  }
}

// Read-only Auth settings endpoint: checks project reachability and API-key
// acceptance without requiring a table, signing in or creating a session.
export async function checkSupabaseConnection(env, { fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const config = readSupabaseConfig(env)
  if (!config.ok) return config
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`${config.url}/auth/v1/settings`, {
      method: 'GET', headers: { apikey: config.publishableKey },
      signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error',
    })
    if (!response.ok) {
      return { ok: false, status: 'http-error', httpStatus: response.status, message: 'Supabase afviste forbindelseskontrollen. Kontrollér projektstatus, URL og publishable key.' }
    }
    const settings = await response.json()
    if (!settings || typeof settings !== 'object' || typeof settings.disable_signup !== 'boolean') {
      return { ok: false, status: 'unexpected-response', message: 'Adressen returnerede ikke de forventede Supabase Auth-indstillinger.' }
    }
    return { ok: true, status: 'connected', message: 'Supabase svarer, og projektets publishable key accepteres.' }
  } catch {
    return { ok: false, status: controller.signal.aborted ? 'timeout' : 'connection-error', message: controller.signal.aborted ? 'Forbindelseskontrollen fik timeout. Prøv igen.' : 'Supabase kunne ikke kontaktes. Kontrollér netværk og projektstatus.' }
  } finally {
    clearTimeout(timeout)
  }
}
