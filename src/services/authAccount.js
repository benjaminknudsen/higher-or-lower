import { supabase, createAuthService, authSessionStorage } from '../lib/supabase.js'
import { createAuthAccount } from '../lib/authAccount.js'
const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).href
export const authService=createAuthService(supabase,{redirectTo,sessionStorage:authSessionStorage})
let recoveryStorage
try{recoveryStorage=window.sessionStorage}catch{/* Storage may be blocked. */}
export const authAccount=createAuthAccount(supabase,authService,recoveryStorage)
