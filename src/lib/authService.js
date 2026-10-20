import { canonicalUsername } from './accountPolicy.js'
import { signupError } from './signupError.js'
import { passwordError } from './passwordError.js'

const failure = message => ({ ok: false, message })
const emailValue = value => typeof value === 'string' ? value.trim() : ''
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const hasPassword = value => typeof value === 'string' && value.length > 0

// Inert until explicitly called by the account UI. Receives the existing
// Supabase client, never creates a parallel client or touches local game data.
export function createAuthService(client, { redirectTo, sessionStorage } = {}) {
  function validRedirect() {
    try {
      const url = new URL(redirectTo)
      return (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) && !url.username && !url.password && !url.search && !url.hash
    } catch { return false }
  }
  async function call(operation, message, mapError) {
    if (!client?.auth) return failure('Supabase er ikke konfigureret.')
    try {
      const result = await operation(client.auth)
      if (result.error) return failure(mapError ? mapError(result.error) : message)
      return { ok: true, data: result.data ?? null }
    } catch {
      return failure('Forbindelsen til Supabase kunne ikke gennemføres. Prøv igen.')
    }
  }
  return {
    async signUp({ username, email, password }) {
      const name = canonicalUsername(username), address = emailValue(email)
      if (!name) return Promise.resolve(failure('Brugernavnet skal have 3–24 bogstaver (a–z), tal eller underscore.'))
      if (!validEmail(address)) return failure('Angiv en gyldig e-mailadresse.')
      if (!hasPassword(password)) return failure('Skriv en adgangskode.')
      if (!validRedirect()) return Promise.resolve(failure('Auth-callbackens adresse er ikke konfigureret.'))
      // Public availability check improves feedback, but the database UNIQUE
      // constraint remains authoritative if concurrent signups race this request.
      if(client?.from){
        try {
          const {data,error}=await client.from('profiles').select('id').eq('username',name).limit(1)
          if(!error&&data?.length)return failure('Brugernavnet er optaget. Vælg et andet.')
        } catch { /* Auth will report a safe failure if the network remains down. */ }
      }
      return call(auth => { sessionStorage?.prepare(); return auth.signUp({ email: address, password, options: { data: { username: name }, emailRedirectTo: redirectTo } }) }, 'Kontoen kunne ikke oprettes.', signupError)
    },
    async signIn({ email, password, remember = true }) {
      const address = emailValue(email)
      if (!validEmail(address) || typeof password !== 'string' || !password) return Promise.resolve(failure('Angiv e-mail og adgangskode.'))
      if (sessionStorage) {
        // Revoke the old local session first; never migrate its tokens to a new login.
        const logout = await call(auth => auth.signOut({ scope: 'local' }), 'Det tidligere login kunne ikke afsluttes. Prøv igen.')
        if (!logout.ok) return logout
        try { sessionStorage.select(remember === true) }
        catch { return failure('Browseren kunne ikke ændre loginlagringen. Log ud, og prøv igen.') }
      }
      return call(auth => auth.signInWithPassword({ email: address, password }), 'Login mislykkedes. Kontrollér oplysningerne og e-mailbekræftelsen.')
    },
    signOut({ allDevices = false } = {}) {
      return call(auth => auth.signOut({ scope: allDevices ? 'global' : 'local' }), 'Logout kunne ikke gennemføres. Prøv igen.')
    },
    requestPasswordReset(email) {
      const address = emailValue(email)
      if (!validEmail(address)) return Promise.resolve(failure('Angiv en gyldig e-mail.'))
      if (!validRedirect()) return Promise.resolve(failure('Auth-callbackens adresse er ikke konfigureret.'))
      return call(auth => { sessionStorage?.prepare(); return auth.resetPasswordForEmail(address, { redirectTo }) }, 'Anmodningen kunne ikke behandles. Vent lidt, og prøv igen.')
    },
    exchangeCode(code) {
      if (typeof code !== 'string' || !code || code.length > 4096) return Promise.resolve(failure('Linket er ugyldigt. Bed om et nyt link.'))
      return call(auth => { sessionStorage?.prepare(); return auth.exchangeCodeForSession(code) }, 'Linket er udløbet, allerede brugt eller åbnet i en anden browser. Bed om et nyt link.')
    },
    updatePassword(password) {
      if (!hasPassword(password)) return Promise.resolve(failure('Skriv en ny adgangskode.'))
      return call(auth => auth.updateUser({ password }), 'Adgangskoden kunne ikke ændres. Åbn et nyt nulstillingslink, og prøv igen.', error => passwordError(error, 'Adgangskoden kunne ikke ændres. Åbn et nyt nulstillingslink, og prøv igen.'))
    },
    getSession() { return call(auth => auth.getSession(), 'Sessionen kunne ikke indlæses.') },
    subscribe(listener) {
      if (!client?.auth) return () => {}
      const { data } = client.auth.onAuthStateChange((event, session) => {
        // Supabase broadcasts Auth events between tabs, including session-only
        // logins. Accept an identity only when this tab can read its credentials.
        if (session && sessionStorage && !sessionStorage.ownsSession(session)) return
        if (event === 'SIGNED_OUT' && sessionStorage) {
          try { sessionStorage.clearTab() } catch { /* Supabase still reports logout. */ }
        }
        listener(event, session)
      })
      return () => data.subscription.unsubscribe()
    },
  }
}
