import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthSessionStorage } from '../lib/authSessionStorage.js'
const key='sb-test-auth-token'
function store() {
 const records=new Map()
 return {records,getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)}
}
function environment(localStorage=store(),sessionStorage=store()) { return {localStorage,sessionStorage} }
const credentials=id=>JSON.stringify({user:{id},access_token:`access-${id}`,refresh_token:`refresh-${id}`})

test('legacy remembered logins restore unchanged without touching game records',()=>{
 const env=environment();env.localStorage.setItem(key,credentials('a'));env.localStorage.setItem('game-record','99')
 const auth=createAuthSessionStorage(key,env)
 assert.equal(auth.storage.getItem(key),credentials('a'))
 assert.equal(env.localStorage.getItem('game-record'),'99')
})
test('remembered login survives a new browser/PWA storage context',()=>{
 const env=environment(),auth=createAuthSessionStorage(key,env)
 auth.select(true);auth.storage.setItem(key,credentials('a'))
 const reopened=createAuthSessionStorage(key,environment(env.localStorage))
 assert.equal(reopened.storage.getItem(key),credentials('a'))
 assert.equal(env.sessionStorage.getItem(key),null)
})
test('session-only login clears persistent credentials and restores only within the same session',()=>{
 const env=environment(),auth=createAuthSessionStorage(key,env)
 for(const suffix of ['','-user','-code-verifier'])env.localStorage.setItem(key+suffix,'old credentials')
 auth.select(false);auth.storage.setItem(key,credentials('b'))
 for(const suffix of ['','-user','-code-verifier'])assert.equal(env.localStorage.getItem(key+suffix),null)
 assert.equal(createAuthSessionStorage(key,env).storage.getItem(key),credentials('b'))
 const newBrowserSession=createAuthSessionStorage(key,environment(env.localStorage))
 assert.equal(newBrowserSession.storage.getItem(key),null)
 // Browser session-restore may retain sessionStorage; this intentionally remains valid.
 assert.equal(createAuthSessionStorage(key,env).storage.getItem(key),credentials('b'))
})
test('refresh writes stay session-only and stale writes from another tab are rejected',()=>{
 const local=store(),envA=environment(local),envB=environment(local)
 const a=createAuthSessionStorage(key,envA),b=createAuthSessionStorage(key,envB)
 a.select(true);a.storage.setItem(key,credentials('a'));b.storage.getItem(key)
 a.select(false);a.storage.setItem(key,credentials('b'))
 assert.throws(()=>b.storage.setItem(key,credentials('a')),/anden fane/)
 assert.equal(b.storage.getItem(key),null)
 assert.throws(()=>b.storage.setItem(key,credentials('a')),/anden fane/)
 a.storage.setItem(key,credentials('b-refreshed'))
 assert.equal(local.getItem(key),null)
 assert.equal(envA.sessionStorage.getItem(key),credentials('b-refreshed'))
})
test('logout clears auth keys from both stores without deleting profiles or game data',()=>{
 const env=environment(),auth=createAuthSessionStorage(key,env)
 auth.select(false);auth.storage.setItem(key,credentials('a'))
 env.localStorage.setItem('profile','keep');env.sessionStorage.setItem('game','keep')
 auth.clear()
 assert.equal(auth.storage.getItem(key),null)
 assert.equal(env.localStorage.getItem('profile'),'keep');assert.equal(env.sessionStorage.getItem('game'),'keep')
})
test('account and storage-mode changes never reuse the previous token',()=>{
 const env=environment(),auth=createAuthSessionStorage(key,env)
 for(const [remember,id] of [[true,'a'],[false,'b'],[true,'c'],[false,'d']]) {
  auth.select(remember)
  assert.equal(auth.storage.getItem(key),null)
  auth.storage.setItem(key,credentials(id))
  assert.equal(auth.ownsSession(JSON.parse(credentials(id))),true)
  assert.equal(auth.ownsSession(JSON.parse(credentials('wrong-account'))),false)
 }
 assert.equal(env.localStorage.getItem(key),null)
})
test('unavailable sessionStorage falls back to memory and never persistent token storage',()=>{
 const env=environment(store(),null),auth=createAuthSessionStorage(key,env)
 auth.select(false);auth.storage.setItem(key,credentials('a'))
 assert.equal(auth.storage.getItem(key),credentials('a'));assert.equal(env.localStorage.getItem(key),null)
 assert.equal(createAuthSessionStorage(key,env).storage.getItem(key),null)
})
test('failure to clear persistent storage aborts changing the persistence policy',()=>{
 const env=environment(),auth=createAuthSessionStorage(key,env)
 env.localStorage.setItem(key,credentials('a'))
 env.localStorage.removeItem=()=>{throw Error('storage denied')}
 assert.throws(()=>auth.select(false),/denied/)
 assert.equal(env.sessionStorage.getItem(key),null)
})
test('late logout broadcasts clear only this tab, never a newer shared login',()=>{
 const env=environment(),auth=createAuthSessionStorage(key,env)
 env.localStorage.setItem(key,credentials('new-account'))
 env.sessionStorage.setItem(key,credentials('old-account'))
 auth.clearTab()
 assert.equal(env.localStorage.getItem(key),credentials('new-account'))
 assert.equal(env.sessionStorage.getItem(key),null)
})
test('signup and reset can store PKCE verifiers after a session-only login/logout',()=>{
 const env=environment(),auth=createAuthSessionStorage(key,env)
 auth.select(false);auth.storage.setItem(key,credentials('a'));auth.clear()
 auth.prepare();auth.storage.setItem(key+'-code-verifier','verifier')
 assert.equal(env.sessionStorage.getItem(key+'-code-verifier'),'verifier')
 assert.equal(env.localStorage.getItem(key+'-code-verifier'),null)
})


test('session-only reloads still work when localStorage is unavailable',()=>{
 const env=environment(null,store()),auth=createAuthSessionStorage(key,env)
 auth.select(false);auth.storage.setItem(key,credentials('a'))
 assert.equal(createAuthSessionStorage(key,env).storage.getItem(key),credentials('a'))
 assert.equal(createAuthSessionStorage(key,environment(null,store())).storage.getItem(key),null)
})
