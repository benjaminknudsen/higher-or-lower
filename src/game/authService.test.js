import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthService } from '../lib/authService.js'
const redirectTo = 'https://example.github.io/higher-or-lower/'
function fixture(result = { data: {}, error: null }) {
  const calls = [], auth = {}
  for (const name of ['signUp','signInWithPassword','signOut','resetPasswordForEmail','exchangeCodeForSession','updateUser','getSession']) {
    auth[name] = async (...args) => { calls.push([name,...args]); return result }
  }
  return { calls, auth, service: createAuthService({ auth }, { redirectTo }) }
}

test('prepared service is inert, reuses supplied client and never starts a session automatically', () => {
  const f = fixture()
  assert.deepEqual(f.calls, [])
})
test('signup passes only normalized public username as metadata and keeps email private to Auth', async () => {
  const f = fixture({ data: { user: { id: 'user' }, session: null }, error: null })
  const password = '  strong password  '
  const result = await f.service.signUp({ username: ' Benjamin ', email: '  private@example.com ', password })
  assert.equal(result.ok, true)
  assert.equal(result.data.session, null)
  assert.deepEqual(f.calls, [['signUp', { email: 'private@example.com', password, options: { data: { username: 'benjamin' }, emailRedirectTo: redirectTo } }]])
})
test('invalid signup input fails before any auth or database request', async () => {
  const f = fixture()
  for (const value of [{username:'ab', email:'private@example.com', password:'valid-password'}, {username:'ben', email:'bad', password:'valid-password'}, {username:'ben',email:'private@example.com',password:''}]) {
    assert.equal((await f.service.signUp(value)).ok, false)
  }
  assert.deepEqual(f.calls, [])
})
test('login uses email/password and does not impose new signup policy on legacy passwords', async () => {
  const f = fixture()
  await f.service.signIn({ email:' private@example.com ', password:'old' })
  assert.deepEqual(f.calls, [['signInWithPassword', { email:'private@example.com', password:'old' }]])
})
test('logout defaults to this device, with explicit global signout and no game-data operations', async () => {
  const f = fixture()
  await f.service.signOut();await f.service.signOut({ allDevices:true })
  assert.deepEqual(f.calls, [['signOut',{scope:'local'}],['signOut',{scope:'global'}]])
})
test('password-reset request uses configured base URL and sanitized failures', async () => {
  const f = fixture()
  await f.service.requestPasswordReset(' private@example.com ')
  assert.deepEqual(f.calls, [['resetPasswordForEmail','private@example.com',{redirectTo}]])
  for(const bad of [undefined,'https://user:secret@example.com/','https://example.com/#untrusted','javascript:alert(1)']) {
    const blocked=createAuthService({auth:f.auth},{redirectTo:bad})
    assert.equal((await blocked.requestPasswordReset('private@example.com')).ok,false)
  }
  assert.equal(f.calls.length,1)
})
test('PKCE exchange is explicit and supports invalid, expired or already-used links without raw errors', async () => {
  const f=fixture({data:null,error:{message:'private@example.com secret-token',code:'expired'}})
  assert.equal((await f.service.exchangeCode('')).ok,false)
  assert.deepEqual(f.calls,[])
  const result=await f.service.exchangeCode('one-time-code')
  assert.equal(result.ok,false);assert.ok(!JSON.stringify(result).includes('secret-token'))
  assert.deepEqual(f.calls,[['exchangeCodeForSession','one-time-code']])
})
test('password changes call Supabase updateUser without trimming or writing local passwords', async () => {
  const f=fixture()
  assert.equal((await f.service.updatePassword('')).ok,false)
  await f.service.updatePassword('  valid password  ')
  assert.deepEqual(f.calls,[['updateUser',{password:'  valid password  '}]])
})
test('session subscription has explicit cleanup and no eager subscription', async () => {
  const f=fixture();let listener,unsubscribed=0
  f.auth.onAuthStateChange=callback=>{listener=callback;return {data:{subscription:{unsubscribe:()=>unsubscribed++}}}}
  let seen
  const cleanup=f.service.subscribe((event,session)=>{seen={event,session}})
  listener('SIGNED_IN',{user:{id:'user'}})
  assert.equal(seen.event,'SIGNED_IN');cleanup();assert.equal(unsubscribed,1)
  await f.service.getSession();assert.deepEqual(f.calls,[['getSession']])
})
test('missing client and offline errors do not reveal credentials or throw', async () => {
  const absent=createAuthService(null,{redirectTo})
  assert.equal((await absent.getSession()).ok,false);absent.subscribe(()=>{})()
  const broken=createAuthService({auth:{getSession:async()=>{throw new Error('private@example.com token')}}})
  const result=await broken.getSession()
  assert.equal(result.ok,false);assert.ok(!JSON.stringify(result).includes('private@example.com'))
})

test('signup database failures do not falsely claim a taken username or leak SQL/email details', async () => {
  for(const code of ['unexpected_failure','23505','23514']) {
    const f=fixture({data:null,error:{code,message:'duplicate key private@example.com profiles_username_unique SQL secret'}})
    const result=await f.service.signUp({username:'benjamin',email:'private@example.com',password:'valid-password'})
    assert.equal(result.ok,false)
    assert.match(result.message,/teknisk problem/)
    assert.ok(!result.message.includes('optaget'))
    assert.ok(!result.message.includes('private@example.com'))
    assert.ok(!result.message.includes('profiles_username_unique'))
  }
})
test('known signup errors have actionable Danish feedback while unknown failures stay generic', async () => {
  for(const [code,expected] of [['weak_password',/stærkere/],['email_address_invalid',/E-mailadressen er ugyldig/],['over_request_rate_limit',/Vent lidt/],['over_email_send_rate_limit',/Vent lidt/],['signup_disabled',/ikke tilgængelig/],['email_provider_disabled',/ikke tilgængelig/]]) {
    const f=fixture({data:null,error:{code,message:'sensitive server content'}})
    const result=await f.service.signUp({username:'benjamin',email:'private@example.com',password:'valid-password'})
    assert.equal(result.ok,false);assert.match(result.message,expected)
    assert.ok(!result.message.includes('sensitive'))
  }
})

test('public username availability gives specific feedback without bypassing database uniqueness',async()=>{
 const f=fixture()
 const query={select:()=>query,eq:()=>query,limit:async()=>({data:[{id:'other'}],error:null})}
 const service=createAuthService({auth:f.auth,from:()=>query},{redirectTo})
 const result=await service.signUp({username:'Benjamin',email:'private@example.com',password:'valid-password'})
 assert.equal(result.ok,false);assert.match(result.message,/optaget/);assert.deepEqual(f.calls,[])
})

test('signup returns an immediate session when email confirmation is disabled',async()=>{
 const session={user:{id:'account'}}
 const f=fixture({data:{session,user:session.user},error:null})
 const result=await f.service.signUp({username:'new_user',email:'private@example.com',password:'valid-password'})
 assert.equal(result.ok,true);assert.equal(result.data.session,session)
})


test('login applies the actual remember choice only after safely signing out the previous session',async()=>{
 for(const remember of [true,false]) {
  const f=fixture(),order=[]
  f.auth.signOut=async options=>{order.push(['logout',options.scope]);return {error:null}}
  f.auth.signInWithPassword=async()=>{order.push(['login']);return {data:{session:{user:{id:'new'}}},error:null}}
  const service=createAuthService({auth:f.auth},{sessionStorage:{select:choice=>order.push(['select',choice])}})
  assert.equal((await service.signIn({email:'new@example.com',password:'password',remember})).ok,true)
  assert.deepEqual(order,[['logout','local'],['select',remember],['login']])
 }
})
test('failed logout or storage changes abort login without reusing old credentials',async()=>{
 for(const failLogout of [true,false]) {
  const f=fixture(),choices=[]
  f.auth.signOut=async()=>({error:failLogout?new Error('offline'):null})
  const service=createAuthService({auth:f.auth},{sessionStorage:{select:value=>{choices.push(value);throw Error('storage denied')}}})
  assert.equal((await service.signIn({email:'new@example.com',password:'password',remember:false})).ok,false)
  assert.equal(f.calls.length,0)
  assert.deepEqual(choices,failLogout?[]:[false])
 }
})
test('Auth broadcasts cannot sign a tab into a session whose credentials it does not own',()=>{
 const f=fixture(),seen=[];let callback,cleared=0
 f.auth.onAuthStateChange=listener=>{callback=listener;return {data:{subscription:{unsubscribe(){}}}}}
 const owned={user:{id:'a'},access_token:'a'}
 const service=createAuthService({auth:f.auth},{sessionStorage:{ownsSession:value=>value===owned,clearTab:()=>cleared++}})
 service.subscribe((event,value)=>seen.push([event,value]))
 callback('SIGNED_IN',{user:{id:'other'},access_token:'other'})
 callback('SIGNED_IN',owned)
 callback('TOKEN_REFRESHED',owned)
 callback('SIGNED_OUT',null)
 assert.deepEqual(seen,[['SIGNED_IN',owned],['TOKEN_REFRESHED',owned],['SIGNED_OUT',null]])
 assert.equal(cleared,1)
})
