import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { createOnlineGameResults } from '../services/onlineGameResults.js'
import { createGame, gameReducer } from './engine.js'

// Run the real hook with a small hook scheduler, including rerenders and retries.
// Keep the actual validation, durable queue and RPC adapter in the execution path.
let active
const loader=registerHooks({
 resolve(specifier,context,next) {
  if(specifier==='react')return {url:'fcm-test:react',shortCircuit:true}
  if(specifier.endsWith('/onlineGameResultsRuntime.js'))return {url:'fcm-test:runtime',shortCircuit:true}
  return next(specifier,context)
 },
 load(url,context,next) {
  if(url==='fcm-test:react')return {format:'module',source:'export const {useState,useRef,useCallback,useEffect}=globalThis.__fcmSyncHooks',shortCircuit:true}
  if(url==='fcm-test:runtime')return {format:'module',source:'export const onlineGameResults={submit:(...args)=>globalThis.__fcmSyncSubmit(...args)}',shortCircuit:true}
  return next(url,context)
 },
})
const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]))
globalThis.__fcmSyncHooks={
 useState(initial) {
  const owner=active,index=owner.cursor++
  owner.slots[index]??={value:initial}
  return [owner.slots[index].value,value=>{const slot=owner.slots[index];slot.value=typeof value==='function'?value(slot.value):value}]
 },
 useRef(initial) { const index=active.cursor++; return active.slots[index]??=( {current:initial} ) },
 useCallback(fn,deps) {
  const index=active.cursor++,old=active.slots[index]
  if(!old||!equal(old.deps,deps))active.slots[index]={fn,deps}
  return active.slots[index].fn
 },
 useEffect(fn,deps) {
  const index=active.cursor++,old=active.slots[index]
  if(!old||!equal(old.deps,deps)){active.slots[index]={deps};active.effects.push(fn)}
 },
}
const {default:useOnlineResultSync}=await import('../hooks/useOnlineResultSync.js')
loader.deregister()
const user='11111111-1111-4111-8111-111111111111'
function fixture(result) {
 const data=new Map(),calls=[],rows=new Set(),hooks={slots:[],cursor:0,effects:[]}
 let offline=false,acknowledged=true
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}
 const service=createOnlineGameResults({rpc:async(name,args)=>{
  calls.push({name,args})
  if(offline)return {error:new Error('offline')}
  if(!acknowledged)return {data:{accepted:false},error:null}
  rows.add(`${args.p_user_id}:${args.p_game_type}:${args.p_result_id}`)
  return {data:{accepted:true},error:null}
 }},storage)
 globalThis.__fcmSyncSubmit=(...args)=>service.submit(...args)
 return {calls,rows,service,setOffline:value=>{offline=value},setAcknowledged:value=>{acknowledged=value},render: function HookHarness() {
  active=hooks;hooks.cursor=0;hooks.effects=[]
  const view=useOnlineResultSync(user,result)
  hooks.effects.forEach(fn=>fn())
  return view
 }}
}
const settle=()=>new Promise(resolve=>setImmediate(resolve))
function finishedGame(correctAnswers,complete=false) {
 const players=Array.from({length:complete?correctAnswers+1:correctAnswers+2},(_,i)=>({id:`p${i}`,name:`P${i}`,stats:{appearances:10}}))
 let state=createGame({players,statisticKey:'appearances'},()=>.5)
 for(let i=0;i<correctAnswers;i++) {
  state=gameReducer(state,{type:'guess',direction:'higher',questionId:state.index})
  state=gameReducer(state,{type:'continue',questionId:state.index})
 }
 if(!complete) {
  // An unequal next pair makes a higher answer incorrect, without changing scoring.
  state={...state,deck:state.deck.map((p,i)=>({...p,stats:{appearances:i===state.index?0:10}}))}
  state=gameReducer(state,{type:'guess',direction:'higher',questionId:state.index})
  state=gameReducer(state,{type:'continue',questionId:state.index})
 }
 return {resultId:crypto.randomUUID(),gameType:'appearances',score:state.score,answers:state.index,correct:state.score,hints:null,errors:null,isPerfect:false,durationMs:0}
}
test('real hook preserves required null fields and submits zero, screenshot score and complete games',async()=>{
 for(const result of [finishedGame(0),finishedGame(4),finishedGame(149,true)]) {
  const f=fixture(result);f.render()
  assert.equal(f.render().status,'syncing')
  await settle()
  assert.equal(f.render().status,'synced')
  assert.equal(f.calls.length,1);assert.equal(f.rows.size,1)
  assert.equal(f.calls[0].args.p_hints,null);assert.equal(f.calls[0].args.p_errors,null)
  assert.equal(f.calls[0].args.p_score,result.score)
  assert.equal(f.calls[0].args.p_answers,result.answers)
  assert.equal(f.service.pendingCount(user),0)
  f.render().retry();f.render();await settle()
  assert.equal(f.calls.length,1)
 }
})
test('real hook keeps network failures queued and retries the same result ID',async()=>{
 const f=fixture(finishedGame(4));f.setOffline(true);f.render();await settle()
 assert.equal(f.render().status,'pending');assert.equal(f.service.pendingCount(user),1)
 f.setOffline(false);f.render().retry();f.render();await settle()
 assert.equal(f.render().status,'synced');assert.equal(f.rows.size,1)
 assert.equal(f.calls[0].args.p_result_id,f.calls[1].args.p_result_id)
 assert.equal(f.service.pendingCount(user),0)
})
test('missing server acceptance never reports a saved result',async()=>{
 const f=fixture(finishedGame(4));f.setAcknowledged(false);f.render();await settle()
 assert.equal(f.render().status,'pending');assert.equal(f.service.pendingCount(user),1)
 assert.equal(f.rows.size,0)
})
test('inconsistent scores remain rejected through the real hook without contacting RPC',async()=>{
 const f=fixture({...finishedGame(4),correct:3});f.render();await settle()
 assert.equal(f.render().status,'pending');assert.equal(f.calls.length,0)
 assert.equal(f.rows.size,0)
})
