import { createSupabaseSetup, checkSupabaseConnection as checkConnection } from './supabaseSetup.js'

const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
}

const setup = createSupabaseSetup(env, { enableAuth: true })
export const supabase = setup.client
export const supabaseStatus = { ok: setup.ok, status: setup.status, message: setup.message }
export const checkSupabaseConnection = options => checkConnection(env, options)

// Prepared account API, not yet imported or called by any app screen.
// Auth persistence remains opt-in in createSupabaseSetup until the UI is ready.
export { createAuthService } from './authService.js'
