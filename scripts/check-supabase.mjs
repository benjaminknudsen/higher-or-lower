import { loadEnv } from 'vite'
import { createSupabaseSetup, checkSupabaseConnection } from '../src/lib/supabaseSetup.js'

const mode = process.argv[2] || 'development'
const loaded = loadEnv(mode, process.cwd(), 'VITE_SUPABASE_')
const env = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? loaded.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? loaded.VITE_SUPABASE_PUBLISHABLE_KEY,
}
const setup = createSupabaseSetup(env)
const result = setup.ok ? await checkSupabaseConnection(env) : setup
// Never log the client, URL, key, remote response body or raw exceptions.
console.log(`Supabase [${result.status}]: ${result.message}`)
if (result.httpStatus) console.log(`HTTP-status: ${result.httpStatus}`)
if (!result.ok) process.exitCode = 1
