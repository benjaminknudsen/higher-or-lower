import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthAccount } from '../lib/authAccount.js'
const flush=()=>new Promise(resolve=>setTimeout(resolve,0))
function fixture(){
 let listener,disposed=0,resolveProfile
 const service={subscribe:fn=>{listener=fn;return()=>disposed++},getSession:async()=>({ok:true,data:{session:null}}),exchangeCode:async()=>({ok:false,message:'Linket er udløbet.'})}
 const chain={select:()=>chain,eq:()=>chain,single:()=>Promise.resolve({data:{id:'user',username:'server_name'},error:null})}
 const client={from:()=>chain}
 const store=createAuthAccount(client,service)
 return {store,service,chain,event:(e,s)=>listener(e,s),disposed:()=>disposed,delay:()=>{chain.single=()=>new Promise(resolve=>{resolveProfile=resolve})},resolve:data=>resolveProfile({data,error:null})}
}
test('guest startup and missing Supabase never prevent playing or require a profile',async()=>{
 const f=fixture(),stop=f.store.start();await flush()
 assert.equal(f.store.getSnapshot().status,'guest');assert.equal(f.store.getSnapshot().profile,null)
 stop();assert.equal(f.disposed(),1)
})
test('auth events fetch only public profile columns and server username replaces guest identity',async()=>{
 const f=fixture();let selected
 f.chain.select=columns=>{selected=columns;return f.chain}
 const stop=f.store.start();await flush();f.event('SIGNED_IN',{user:{id:'user'}});await flush()
 assert.equal(f.store.getSnapshot().profile.username,'server_name');assert.equal(selected,'id,username,avatar_path')
 f.event('SIGNED_OUT',null);await flush();assert.equal(f.store.getSnapshot().profile,null);assert.equal(f.store.getSnapshot().status,'guest');stop()
})
test('a slow profile fetch cannot restore a signed-out identity',async()=>{
 const f=fixture(),stop=f.store.start();await flush();f.delay();f.event('SIGNED_IN',{user:{id:'user'}});await flush()
 f.event('SIGNED_OUT',null);await flush();f.resolve({id:'user',username:'old'});await flush()
 assert.equal(f.store.getSnapshot().status,'guest');assert.equal(f.store.getSnapshot().profile,null);stop()
})
test('initial session restoration cannot overwrite a newer auth event',async()=>{
 const f=fixture();let resolveSession
 f.service.getSession=()=>new Promise(resolve=>resolveSession=resolve)
 const stop=f.store.start();f.event('SIGNED_IN',{user:{id:'user'}});await flush()
 resolveSession({ok:true,data:{session:null}});await flush()
 assert.equal(f.store.getSnapshot().status,'signed-in');stop()
})
test('recovery event opens password form; query cleanup preserves base, unrelated query and hash',async()=>{
 const f=fixture(),stop=f.store.start();await flush()
 f.event('PASSWORD_RECOVERY',{user:{id:'user'}});await flush();assert.equal(f.store.getSnapshot().mode,'password')
 let replaced
 await f.store.callback({href:'https://example.com/higher-or-lower/?code=private&keep=yes#profil'},{state:null,replaceState:(_,__,url)=>replaced=url})
 assert.equal(replaced,'/higher-or-lower/?keep=yes#profil');assert.equal(f.store.getSnapshot().error,'Linket er udløbet.');stop()
})
test('expired link error is sanitized without exposing query descriptions',async()=>{
 const f=fixture();await f.store.callback({href:'https://example.com/higher-or-lower/?error=bad&error_description=secret#profil'},{replaceState:()=>{}})
 assert.equal(f.store.getSnapshot().mode,'login');assert.ok(!f.store.getSnapshot().error.includes('secret'))
})
test('profile fetch failure keeps account identity separate from guest and supports retry',async()=>{
 const f=fixture();f.chain.single=async()=>({error:{message:'secret'}})
 const stop=f.store.start();await flush();f.event('SIGNED_IN',{user:{id:'user'}});await flush()
 assert.equal(f.store.getSnapshot().status,'signed-in');assert.equal(f.store.getSnapshot().profile,null);assert.ok(f.store.getSnapshot().profileError)
 f.chain.single=async()=>({data:{id:'user',username:'recovered'}});await f.store.retryProfile();assert.equal(f.store.getSnapshot().profile.username,'recovered');stop()
})

test('Auth fragment errors and legacy token fragments are removed while normal routing is preserved',async()=>{
 for(const fragment of ['error=access_denied&error_code=otp_expired','access_token=secret&refresh_token=private']){
  const f=fixture();let replaced
  await f.store.callback({href:`https://example.com/higher-or-lower/#${fragment}`},{replaceState:(_,__,url)=>replaced=url})
  assert.equal(replaced,'/higher-or-lower/');assert.equal(f.store.getSnapshot().mode,'login')
 }
 const f=fixture();await f.store.callback({href:'https://example.com/higher-or-lower/#profil'},{replaceState:()=>assert.fail('normal hash is untouched')})
})

test('recovery marker resumes only for the same authenticated user and is cleared on logout',async()=>{
 const memory=new Map([['fcm.auth.recovery.v1','user']])
 const storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)}
 const f=fixture(),store=createAuthAccount({from:()=>f.chain},f.service,storage)
 const stop=store.start();await flush()
 // Initial guest clears a stale marker. A verified recovery event starts it anew.
 assert.equal(memory.size,0)
 f.event('PASSWORD_RECOVERY',{user:{id:'user'}});await flush()
 assert.equal(store.getSnapshot().mode,'password');assert.equal(memory.get('fcm.auth.recovery.v1'),'user')
 f.event('SIGNED_OUT',null);await flush();assert.equal(memory.size,0);stop()
})
test('a persisted normal login restores public username without starting recovery',async()=>{
 const f=fixture();f.service.getSession=async()=>({ok:true,data:{session:{user:{id:'user'}}}})
 const stop=f.store.start();await flush()
 assert.equal(f.store.getSnapshot().status,'signed-in');assert.equal(f.store.getSnapshot().profile.username,'server_name');assert.equal(f.store.getSnapshot().recovery,false);stop()
})

test('a late avatar response cannot be applied to a different signed-in account',async()=>{
 const f=fixture(),stop=f.store.start();await flush()
 f.event('SIGNED_IN',{user:{id:'account-a'}});await flush()
 assert.equal(f.store.setAvatarPath('account-a','account-a/photo.webp'),true)
 f.event('SIGNED_IN',{user:{id:'account-b'}});await flush()
 assert.equal(f.store.setAvatarPath('account-a','account-a/late.webp'),false)
 assert.equal(f.store.getSnapshot().profile.avatar_path,undefined)
 assert.equal(f.store.setAvatarPath('account-b','account-b/photo.webp'),true)
 assert.equal(f.store.getSnapshot().profile.avatar_path,'account-b/photo.webp')
 stop()
})
