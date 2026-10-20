import test from 'node:test'
import assert from 'node:assert/strict'
import { createOnlinePlatform, rankLeaderboard } from '../services/onlinePlatform.js'

function statsClient() {
  const calls=[]
  const client={from(table){
    assert.equal(table,'game_stats')
    const query={select(columns){calls.push({columns});return query},eq(column,value){calls.at(-1)[column]=value;return query},maybeSingle:async()=>({data:{game_type:'appearances',games_played:2,best_score:14,total_answers:20,total_correct:14,perfect_games:0},error:null})}
    return query
  }}
  return {client,calls}
}

test('online statistics are queried by the exact account ID and game type',async()=>{
  const f=statsClient(),service=createOnlinePlatform(f.client)
  const stats=await service.getStats('account-a','appearances')
  assert.equal(stats.best_score,14)
  assert.deepEqual(f.calls,[{columns:'game_type,games_played,best_score,total_answers,total_correct,perfect_games,updated_at',user_id:'account-a',game_type:'appearances'}])
})

test('no result for a new account is represented as empty cloud data, not guest data',async()=>{
  const f=statsClient()
  f.client.from=()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:null,error:null})};return q}
  const stats=await createOnlinePlatform(f.client).getStats('account-b','lineup')
  assert.equal(stats.games_played,0);assert.equal(stats.best_score,0);assert.equal(stats.game_type,'lineup')
})

test('leaderboard service maps attempt rows and the current user’s up to three global placements',async()=>{
  const calls=[]
  const client={rpc:async(name,args)=>{calls.push({name,args});return {data:{
    entries:[{user_id:'a',result_id:'result-a1',username:'alpha',avatar_path:'a/photo.webp',score:25,rank:1}],
    own_entries:[
      {user_id:'b',result_id:'result-b1',username:'beta',avatar_path:null,score:20,rank:2},
      {user_id:'b',result_id:'result-b2',username:'beta',avatar_path:null,score:10,rank:7},
    ],total:31,attempt_leaderboard_version:1,
  },error:null}}}
  const service=createOnlinePlatform(client)
  const page=await service.listLeaderboard('appearances',{limit:25,offset:25})
  assert.deepEqual(calls,[{name:'get_game_leaderboard',args:{p_game_type:'appearances',p_limit:25,p_offset:25}}])
  assert.deepEqual(page.entries[0],{id:'a:result-a1',playerId:'a',name:'alpha',avatarPath:'a/photo.webp',score:25,rank:1,resultId:'result-a1'})
  assert.deepEqual(page.ownEntries.map(({rank,score,isSelf})=>({rank,score,isSelf})),[
    {rank:2,score:20,isSelf:true},{rank:7,score:10,isSelf:true},
  ])
  assert.equal(page.total,31)
  await assert.rejects(service.listLeaderboard('appearances',{limit:100,offset:0}),/Ugyldig/)
})

test('private top-three RPC requests only the signed-in account results and maps dates',async()=>{
  const calls=[]
  const client={rpc:async(name,args)=>{calls.push({name,args});return {data:{attempts:[
    {result_id:'b',score:18,created_at:'2026-10-19T12:00:00Z'},
    {result_id:'a',score:18,created_at:'2026-10-20T12:00:00Z'},
  ],top_three_version:1},error:null}}}
  const attempts=await createOnlinePlatform(client).getMyTopThreeResults('account-a','lineup')
  assert.deepEqual(calls,[{name:'get_my_top_three_results',args:{p_game_type:'lineup'}}])
  assert.deepEqual(attempts,[
    {id:'b',score:18,createdAt:'2026-10-19T12:00:00.000Z'},
    {id:'a',score:18,createdAt:'2026-10-20T12:00:00.000Z'},
  ])
})

test('profile top-three rejects invalid dates and leaderboard maps independent attempt rows',async()=>{
  const client={rpc:async(name)=>({data:name==='get_game_leaderboard'?{
    entries:[{user_id:'a',result_id:'result-1',username:'alpha',score:5,rank:1}],
    own_entries:[],total:1,attempt_leaderboard_version:1,
  }:{attempts:[{result_id:'bad',score:4,created_at:'invalid'}],top_three_version:1},error:null})}
  const platform=createOnlinePlatform(client)
  assert.deepEqual((await platform.listLeaderboard('appearances')).entries[0],{
    id:'a:result-1',playerId:'a',name:'alpha',avatarPath:undefined,score:5,rank:1,resultId:'result-1',
  })
  await assert.rejects(platform.getMyTopThreeResults('account-a','appearances'),/ugyldige data/)
})

test('leaderboard gives a direct migration notice if version 005 is not active',async()=>{
  const service=createOnlinePlatform({rpc:async()=>({data:{entries:[],own_entries:[],total:0},error:null})})
  await assert.rejects(service.listLeaderboard('appearances'),/migration 005/)
})

test('private profile gives a direct migration notice when its RPC is not active',async()=>{
  const service=createOnlinePlatform({rpc:async()=>({data:{attempts:[]},error:null})})
  await assert.rejects(service.getMyTopThreeResults('account-a','lineup'),/migration 004/)
})

test('attempt ties use oldest result and result ID, with consecutive ranks',()=>{
  const entries=rankLeaderboard([
    {id:'c:3',playerId:'c',resultId:'3',createdAt:'2026-10-20T12:00:00Z',name:'C',score:9},
    {id:'b:2',playerId:'b',resultId:'2',createdAt:'2026-10-19T12:00:00Z',name:'B',score:10},
    {id:'a:1',playerId:'a',resultId:'1',createdAt:'2026-10-19T12:00:00Z',name:'A',score:10},
  ])
  assert.deepEqual(entries.map(entry=>[entry.id,entry.rank]),[['a:1',1],['b:2',2],['c:3',3]])
})
