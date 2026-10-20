import test from 'node:test'
import assert from 'node:assert/strict'
import { createOnlineGameResults } from '../services/onlineGameResults.js'

const userA='11111111-1111-4111-8111-111111111111'
const userB='22222222-2222-4222-8222-222222222222'
const result={gameType:'appearances',resultId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',score:12,answers:13,correct:12,hints:null,errors:null,isPerfect:false,durationMs:0}
function localStorageDouble(){
  const data=new Map()
  return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}
}
function rpcServer({fail=false}={}){
  const rows=new Map(),calls=[]
  const client={rpc:async(name,args)=>{
    assert.equal(name,'submit_game_result');calls.push(args)
    if(args.p_user_id!==userA&&args.p_user_id!==userB)return {error:new Error('owner mismatch')}
    if(fail.value)return {error:new Error('offline')}
    const id=`${args.p_user_id}:${args.p_game_type}:${args.p_result_id}`
    const duplicate=rows.has(id)
    rows.set(id,true)
    return {data:{accepted:true,duplicate},error:null}
  }}
  return {client,rows,calls}
}

test('result synchronization binds an idempotent request to the originating account',async()=>{
  const storage=localStorageDouble(),server=rpcServer(),sync=createOnlineGameResults(server.client,storage)
  assert.deepEqual(await sync.submit(userA,result),{ok:true,pending:0,message:''})
  assert.equal(server.rows.size,1);assert.equal(server.calls[0].p_user_id,userA)
  assert.equal(server.calls[0].p_score,12);assert.equal(server.calls[0].p_correct,12)
  assert.deepEqual(await sync.submit(userA,result),{ok:true,pending:0,message:''})
  assert.equal(server.rows.size,1)
})

test('network failures are queued per account and flush successfully after reconnection',async()=>{
  const storage=localStorageDouble(),fail={value:true},server=rpcServer({fail}),sync=createOnlineGameResults(server.client,storage)
  const first=await sync.submit(userA,result)
  assert.equal(first.ok,false);assert.equal(first.pending,1);assert.equal(sync.pendingCount(userA),1)
  fail.value=false
  assert.deepEqual(await sync.flush(userA),{ok:true,pending:0,message:''})
  assert.equal(sync.pendingCount(userA),0);assert.equal(server.rows.size,1)
})

test('a different account cannot inherit or flush the previous account queue',async()=>{
  const storage=localStorageDouble(),fail={value:true},server=rpcServer({fail}),sync=createOnlineGameResults(server.client,storage)
  await sync.submit(userA,result)
  fail.value=false
  const other={...result,resultId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}
  await sync.submit(userB,other)
  assert.equal(sync.pendingCount(userA),1);assert.equal(sync.pendingCount(userB),0)
  assert.equal(server.calls.at(-1).p_user_id,userB)
})

test('client result validation rejects inconsistent scores before any RPC',async()=>{
  const server=rpcServer(),sync=createOnlineGameResults(server.client,localStorageDouble())
  const invalid={...result,correct:1}
  const response=await sync.submit(userA,invalid)
  assert.equal(response.ok,false);assert.equal(server.calls.length,0)
})

test('streak results allow only a completed/abandoned final answer and do not report unmeasured time',async()=>{
  const server=rpcServer(),sync=createOnlineGameResults(server.client,localStorageDouble())
  for(const invalid of [
    {...result,answers:result.score+2},
    {...result,answers:result.score-1},
    {...result,durationMs:1},
  ]){
    assert.equal((await sync.submit(userA,{...invalid,resultId:crypto.randomUUID()})).ok,false)
  }
  assert.equal(server.calls.length,0)
  assert.equal((await sync.submit(userA,{...result,score:12,correct:12,answers:13,resultId:crypto.randomUUID()})).ok,true)
  assert.equal(server.calls.length,1)
})

test('lineup results enforce five-point hint increments and count hinted perfect rounds',async()=>{
  const server=rpcServer(),sync=createOnlineGameResults(server.client,localStorageDouble())
  const valid={gameType:'lineup',resultId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',score:105,answers:11,correct:11,hints:1,errors:0,isPerfect:true,durationMs:6500}
  assert.equal((await sync.submit(userA,valid)).ok,true)
  assert.equal(server.calls[0].p_is_perfect,true)
  const invalid={...valid,resultId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',score:104}
  assert.equal((await sync.submit(userA,invalid)).ok,false)
  assert.equal(server.calls.length,1)
})

test('previously queued results are normalized to the expanded RPC payload',async()=>{
  const storage=localStorageDouble(),server=rpcServer()
  storage.setItem(`fcm.online-results.v1:${userA}`,JSON.stringify([
    {...result,hints:undefined,errors:undefined},
    {gameType:'lineup',resultId:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',score:105,answers:11,correct:11,isPerfect:false,durationMs:6500},
  ]))
  const sync=createOnlineGameResults(server.client,storage)
  assert.deepEqual(await sync.flush(userA),{ok:true,pending:0,message:''})
  assert.equal(server.calls[0].p_hints,null)
  assert.equal(server.calls[0].p_errors,null)
  assert.equal(server.calls[1].p_hints,1)
  assert.equal(server.calls[1].p_errors,0)
  assert.equal(server.calls[1].p_is_perfect,true)
})


test('retry deduplicates identical payloads regardless of property order and rejects changed data',async()=>{
 const storage=localStorageDouble(),fail={value:true},server=rpcServer({fail}),sync=createOnlineGameResults(server.client,storage)
 await sync.submit(userA,result)
 const reordered=Object.fromEntries(Object.entries(result).reverse())
 await sync.submit(userA,reordered)
 assert.equal(sync.pendingCount(userA),1)
 const calls=server.calls.length
 assert.equal((await sync.submit(userA,{...result,score:11,correct:11,answers:12})).ok,false)
 assert.equal(server.calls.length,calls)
 fail.value=false
 assert.equal((await sync.submit(userA,reordered)).ok,true)
 assert.equal(sync.pendingCount(userA),0);assert.equal(server.rows.size,1)
})
