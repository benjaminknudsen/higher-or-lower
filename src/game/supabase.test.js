import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readSupabaseConfig, createSupabaseSetup, checkSupabaseConnection } from '../lib/supabaseSetup.js'
const env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test-only' }

test('missing configuration disables Supabase without throwing or making requests', async () => {
  for (const input of [{}, { VITE_SUPABASE_URL: env.VITE_SUPABASE_URL }]) {
    assert.equal(createSupabaseSetup(input).client, null)
    const result = await checkSupabaseConnection(input, { fetchImpl: () => assert.fail('must not fetch') })
    assert.equal(result.status, 'not-configured')
  }
})
test('only publishable keys and clean HTTPS project URLs are accepted', () => {
  for (const key of ['sb_secret_forbidden', 'eyJhbGciOiJIUzI1NiJ9.service_role.signature', 'not-a-publishable-key']) {
    const result = readSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: key })
    assert.equal(result.ok, false)
    assert.ok(!JSON.stringify(result).includes(key))
  }
  for (const url of ['bad', 'http://example.supabase.co', 'https://user:password@example.supabase.co', 'https://example.supabase.co/rest/v1', 'https://example.supabase.co/?key=private']) {
    assert.equal(readSupabaseConfig({ ...env, VITE_SUPABASE_URL: url }).ok, false)
  }
  assert.equal(readSupabaseConfig({ ...env, VITE_SUPABASE_URL: ` ${env.VITE_SUPABASE_URL}/ ` }).url, env.VITE_SUPABASE_URL)
})
test('central client is usable without persistence, automatic auth or hash routing side effects', () => {
  const result = createSupabaseSetup(env)
  assert.equal(result.status, 'configured')
  assert.equal(typeof result.client.from, 'function')
  assert.equal(result.client.auth.persistSession, false)
  assert.equal(result.client.auth.autoRefreshToken, false)
  assert.equal(result.client.auth.detectSessionInUrl, false)
})
test('connection check is read-only, accepts key via apikey and returns no settings or credentials', async () => {
  const result = await checkSupabaseConnection(env, { fetchImpl: async (url, options) => {
    assert.equal(url, `${env.VITE_SUPABASE_URL}/auth/v1/settings`)
    assert.equal(options.method, 'GET')
    assert.deepEqual(options.headers, { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY })
    assert.equal(options.credentials, 'omit')
    assert.equal(options.redirect, 'error')
    assert.equal(options.cache, 'no-store')
    return { ok: true, json: async () => ({ disable_signup: false, external: {} }) }
  } })
  assert.equal(result.status, 'connected')
  assert.ok(!JSON.stringify(result).includes(env.VITE_SUPABASE_PUBLISHABLE_KEY))
  assert.ok(!JSON.stringify(result).includes('disable_signup'))
})
test('HTTP errors, offline failures, unexpected responses and timeouts are sanitized', async () => {
  const http = await checkSupabaseConnection(env, { fetchImpl: async () => ({ ok: false, status: 401, json: () => assert.fail('never read error body') }) })
  assert.equal(http.httpStatus, 401)
  const offline = await checkSupabaseConnection(env, { fetchImpl: async () => { throw new Error(env.VITE_SUPABASE_PUBLISHABLE_KEY) } })
  assert.equal(offline.status, 'connection-error')
  assert.ok(!JSON.stringify(offline).includes(env.VITE_SUPABASE_PUBLISHABLE_KEY))
  const malformed = await checkSupabaseConnection(env, { fetchImpl: async () => ({ ok: true, json: async () => ({}) }) })
  assert.equal(malformed.status, 'unexpected-response')
  const timed = await checkSupabaseConnection(env, { timeoutMs: 5, fetchImpl: async (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) })
  assert.equal(timed.status, 'timeout')
})
test('Vite entry uses only named public env variables and database checks stay opt-in', () => {
  const source = readFileSync(new URL('../lib/supabase.js', import.meta.url), 'utf8')
  assert.match(source, /import.meta.env.VITE_SUPABASE_URL/)
  assert.match(source, /import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY/)
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url)))
  assert.ok(!pkg.scripts.build.includes('supabase:check'))
})

test('explicit account mode enables persistence and refresh while retaining manual PKCE callbacks', async () => {
  const {client}=createSupabaseSetup(env,{enableAuth:true})
  assert.equal(client.auth.persistSession,true)
  assert.equal(client.auth.autoRefreshToken,true)
  assert.equal(client.auth.detectSessionInUrl,false)
  assert.equal(client.auth.flowType,'pkce')
  await client.auth.stopAutoRefresh()
})
