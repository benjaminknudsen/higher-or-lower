import test from 'node:test'
import assert from 'node:assert/strict'
import { createOnlinePlatform, rankLeaderboard } from '../services/onlinePlatform.js'

test('attempt rankings are deterministic, preserve input and assign consecutive places for equal scores',()=>{
  const entries=[
    {id:'a:1',playerId:'a',resultId:'1',createdAt:'2026-10-19T12:00:00Z',name:'A',score:10},
    {id:'b:1',playerId:'b',resultId:'1',createdAt:'2026-10-18T12:00:00Z',name:'B',score:10},
    {id:'a:2',playerId:'a',resultId:'2',createdAt:'2026-10-20T12:00:00Z',name:'A',score:7},
  ]
  const before=structuredClone(entries)
  const ranked=rankLeaderboard(entries)
  assert.deepEqual(ranked.map(entry=>[entry.id,entry.rank]),[['b:1',1],['a:1',2],['a:2',3]])
  assert.deepEqual(ranked,rankLeaderboard([...entries].reverse()))
  assert.deepEqual(entries,before)
  assert.deepEqual(rankLeaderboard([]),[])
})

test('invalid scores and duplicate attempt identities do not create ranking rows',()=>{
  const ranked=rankLeaderboard([{id:'a:1',name:'A',score:0},{id:'a:1',name:'A',score:8},{id:'b:1',name:'B',score:-1},{id:'c:1',name:'C',score:'10'}])
  assert.equal(ranked.length,1);assert.equal(ranked[0].score,0)
})

test('online leaderboard uses bounded server pages of individual attempts',async()=>{
  const calls=[]
  const client={rpc:async(name,args)=>{calls.push({name,args});return {data:{entries:[],own_entries:[],total:0,attempt_leaderboard_version:1},error:null}}}
  const repository=createOnlinePlatform(client)
  const result=await repository.listLeaderboard('lineup',{limit:25,offset:25})
  assert.equal(result.source,'online');assert.deepEqual(result.entries,[]);assert.deepEqual(result.ownEntries,[]);assert.equal(result.total,0)
  assert.deepEqual(calls,[{name:'get_game_leaderboard',args:{p_game_type:'lineup',p_limit:25,p_offset:25}}])
})
