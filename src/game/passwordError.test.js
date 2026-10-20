import test from 'node:test'
import assert from 'node:assert/strict'
import { passwordError } from '../lib/passwordError.js'
import { signupError } from '../lib/signupError.js'
import { createAuthService } from '../lib/authService.js'

test('Supabase short-password reasons give natural feedback without inventing a configured length',()=>{
 for(const reasons of [['length'],['min_length'],['length','characters']]) {
  const message=passwordError({code:'weak_password',reasons,message:'sensitive server content'},'fallback')
  assert.match(message,/for kort/);assert.ok(!message.includes('12'));assert.ok(!message.includes('sensitive'))
 }
 assert.match(signupError({code:'validation_failed',message:'Password should be at least 8 characters.'}),/for kort/)
})
test('other server password restrictions stay enforced and raw text is not exposed',()=>{
 assert.match(passwordError({code:'weak_password',reasons:['pwned']},'fallback'),/datalæk/)
 assert.match(passwordError({code:'weak_password',reasons:['characters']},'fallback'),/stærkere/)
 assert.equal(passwordError({code:'validation_failed',message:'private@example.com secret'},'safe fallback'),'safe fallback')
})
test('signup and reset defer actual policy to Supabase rather than imposing an unverified local minimum',async()=>{
 const calls=[]
 const client={auth:{signUp:async input=>{calls.push(input.password);return {data:{},error:{code:'weak_password',reasons:['length']}}},updateUser:async input=>{calls.push(input.password);return {data:{},error:{code:'weak_password',reasons:['length']}}}}}
 const service=createAuthService(client,{redirectTo:'https://example.com/higher-or-lower/'})
 assert.match((await service.signUp({username:'benjamin',email:'private@example.com',password:'short'})).message,/for kort/)
 assert.match((await service.updatePassword('short')).message,/for kort/)
 assert.deepEqual(calls,['short','short'])
})
test('a password accepted by Supabase is not rejected by stale frontend length rules',async()=>{
 const auth={signUp:async()=>({data:{session:null},error:null}),updateUser:async()=>({data:{},error:null})}
 const service=createAuthService({auth},{redirectTo:'https://example.com/higher-or-lower/'})
 assert.equal((await service.signUp({username:'benjamin',email:'private@example.com',password:'accepted'})).ok,true)
 assert.equal((await service.updatePassword('accepted')).ok,true)
})
