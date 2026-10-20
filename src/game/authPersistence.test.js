import test from 'node:test'
import assert from 'node:assert/strict'
import { createSupabaseSetup } from '../lib/supabaseSetup.js'
import { createAuthService } from '../lib/authService.js'

// Exercise the installed SDK with browser storage and a local Auth HTTP double.
// No real account, credentials or Supabase requests are involved.
const env={VITE_SUPABASE_URL:'https://persist-test.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test-only'}
const userA={id:'11111111-1111-4111-8111-111111111111',email:'a@example.test'}
const userB={id:'22222222-2222-4222-8222-222222222222',email:'b@example.test'}
const storageKey='sb-persist-test-auth-token'
const turn=()=>new Promise(resolve=>setImmediate(resolve))
function session(user,expiresAt=Math.floor(Date.now()/1000)+3600) {
 const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')
 const payload=Buffer.from(JSON.stringify({sub:user.id,exp:expiresAt})).toString('base64url')
 return {access_token:`${header}.${payload}.test`,refresh_token:`refresh-${user.id}`,token_type:'bearer',expires_at:expiresAt,expires_in:3600,user}
}

test('production Auth options persist across restarts, refresh expired sessions and clear logout before account switching',async()=>{
 const originals=Object.fromEntries(['window','document','localStorage','sessionStorage','fetch','BroadcastChannel'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]))
 const saved=new Map([['fcm-game-state','untouched']]),temporary=new Map(),calls=[],clients=[]
 const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,String(value)),removeItem:key=>saved.delete(key)}
 Object.defineProperties(globalThis,{
  window:{value:{location:{href:'https://games.example/higher-or-lower/#profil'}},configurable:true},
  document:{value:{visibilityState:'hidden'},configurable:true},
  localStorage:{value:storage,configurable:true},
  sessionStorage:{value:{getItem:key=>temporary.get(key)??null,setItem:(key,value)=>temporary.set(key,String(value)),removeItem:key=>temporary.delete(key)},configurable:true},
  BroadcastChannel:{value:undefined,configurable:true},
  fetch:{configurable:true,value:async(input,options={})=>{
   const url=new URL(input),body=options.body?JSON.parse(options.body):null
   calls.push({url,body})
   if(url.pathname==='/auth/v1/logout')return new Response('{}',{status:200})
   assert.equal(url.pathname,'/auth/v1/token')
   const grant=url.searchParams.get('grant_type')
   if(grant==='password')return Response.json(session(body.email===userB.email?userB:userA))
   assert.equal(grant,'refresh_token')
   if(body.refresh_token==='revoked')return Response.json({code:'refresh_token_not_found',message:'Invalid refresh token'},{status:400})
   assert.equal(body.refresh_token,`refresh-${userA.id}`)
   return Response.json(session(userA))
  }},
 })
 async function open() {
  const {client,ok,authSessionStorage}=createSupabaseSetup(env,{enableAuth:true});assert.equal(ok,true)
  clients.push(client)
  const service=createAuthService(client,{sessionStorage:authSessionStorage})
  await service.getSession();await client.auth.stopAutoRefresh()
  return {client,service}
 }
 try {
  const first=await open()
  assert.equal(first.client.auth.persistSession,true)
  assert.equal(first.client.auth.autoRefreshToken,true)
  assert.equal((await first.service.signIn({email:userA.email,password:'test-password'})).ok,true)
  assert.equal(JSON.parse(saved.get(storageKey)).user.id,userA.id)
  assert.ok(!saved.get(storageKey).includes('test-password'))

  // A fresh client has no shared in-memory session; it must restore from storage.
  const reopened=await open()
  assert.equal((await reopened.service.getSession()).data.session.user.id,userA.id)
  assert.equal(calls.filter(call=>call.url.searchParams.get('grant_type')==='password').length,1)

  saved.set(storageKey,JSON.stringify(session(userA,Math.floor(Date.now()/1000)-60)))
  const afterExpiry=await open()
  assert.equal((await afterExpiry.service.getSession()).data.session.user.id,userA.id)
  assert.equal(calls.filter(call=>call.url.searchParams.get('grant_type')==='refresh_token').length,1)
  assert.ok(JSON.parse(saved.get(storageKey)).expires_at>Date.now()/1000)

  const events=[]
  const unsubscribe=afterExpiry.service.subscribe((event,value)=>events.push([event,value?.user?.id??null]))
  await turn()
  assert.equal((await afterExpiry.service.signOut()).ok,true)
  assert.equal(saved.has(storageKey),false)
  assert.equal(calls.at(-1).url.searchParams.get('scope'),'local')
  assert.ok(events.some(([event,id])=>event==='SIGNED_OUT'&&id===null))
  unsubscribe()
  const loggedOutRestart=await open()
  assert.equal((await loggedOutRestart.service.getSession()).data.session,null)
  await loggedOutRestart.service.signIn({email:userB.email,password:'other-test-password'})
  const switched=await open()
  assert.equal((await switched.service.getSession()).data.session.user.id,userB.id)
  assert.equal(saved.get('fcm-game-state'),'untouched')
  await switched.service.signOut()
  const sessionOnly=await open()
  assert.equal((await sessionOnly.service.signIn({email:userA.email,password:'test-password',remember:false})).ok,true)
  assert.equal(saved.has(storageKey),false)
  assert.equal(JSON.parse(temporary.get(storageKey)).user.id,userA.id)
  const sameTabReload=await open()
  assert.equal((await sameTabReload.service.getSession()).data.session.user.id,userA.id)
  temporary.set(storageKey,JSON.stringify(session(userA,Math.floor(Date.now()/1000)-60)))
  const refreshedTemporary=await open()
  assert.equal((await refreshedTemporary.service.getSession()).data.session.user.id,userA.id)
  assert.equal(saved.has(storageKey),false)
  assert.ok(JSON.parse(temporary.get(storageKey)).expires_at>Date.now()/1000)
  // A browser/PWA restoring its tab storage may keep this session. A genuinely
  // new browser session has empty sessionStorage and must not recover a login.
  temporary.clear()
  const newBrowserSession=await open()
  assert.equal((await newBrowserSession.service.getSession()).data.session,null)
  await newBrowserSession.service.signIn({email:userB.email,password:'other-test-password',remember:false})
  assert.equal(JSON.parse(temporary.get(storageKey)).user.id,userB.id)
  assert.equal((await newBrowserSession.service.signOut()).ok,true)
  assert.equal(temporary.has(storageKey),false);assert.equal(saved.has(storageKey),false)
  const afterTemporaryLogout=await open()
  assert.equal((await afterTemporaryLogout.service.getSession()).data.session,null)
  await afterTemporaryLogout.service.signIn({email:userA.email,password:'test-password',remember:true})
  assert.equal(JSON.parse(saved.get(storageKey)).user.id,userA.id)
  assert.equal(temporary.has(storageKey),false)
  await afterTemporaryLogout.service.signOut()
  saved.set(storageKey,JSON.stringify({...session(userA,Math.floor(Date.now()/1000)-60),refresh_token:'revoked'}))
  const revokedRestart=await open()
  assert.equal((await revokedRestart.service.getSession()).data.session,null)
  assert.equal(saved.has(storageKey),false)
 } finally {
  for(const client of clients)await client.auth.stopAutoRefresh()
  for(const [key,descriptor] of Object.entries(originals)) {
   if(descriptor)Object.defineProperty(globalThis,key,descriptor)
   else delete globalThis[key]
  }
 }
})
