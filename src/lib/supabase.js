import { createSupabaseSetup, checkSupabaseConnection as checkConnection } from './supabaseSetup.js'

const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
}

const setup = createSupabaseSetup(env, { enableAuth: true })
export const supabase = setup.client
export const authSessionStorage = setup.authSessionStorage
export const supabaseStatus = { ok: setup.ok, status: setup.status, message: setup.message }
export const checkSupabaseConnection = options => checkConnection(env, options)

// The account UI shares this client, including the selected session storage and automatic refresh.
export { createAuthService } from './authService.js'
