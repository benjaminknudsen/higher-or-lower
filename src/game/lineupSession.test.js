import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadLineupStore, saveLineupStore, clearSavedLineupRound } from '../services/lineupStorage.js'
import { LINEUP_KEY, emptyStore, createRound, guess, buyHint, tick, recordResult, statistics, remaining, averageCorrectPercentage } from './lineup.js'
const match=JSON.parse(readFileSync(new URL('../data/lineupMatches.json',import.meta.url))).find(m=>m.active)
function storageDouble(){const data=new Map();return {data,getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)}}
test('old saved round is cleared without touching results, match history or other local data',()=>{
 const storage=storageDouble();storage.setItem('profile','Benjamin');storage.setItem('theme','fcm')
 let completed=createRound(match,10000,'complete');completed=guess(completed,match.players[0].name,11000).round
 let store=recordResult(emptyStore(),tick(completed,completed.deadline))
 let active=createRound(match,200000,'abandoned');active=guess(active,match.players[0].name,201000).round;active=buyHint(active,match.players[1].id,202000)
 store={...store,played:[match.id],round:active}
 storage.setItem(LINEUP_KEY,JSON.stringify(store));const before=statistics(store)
 clearSavedLineupRound(storage)
 const reloaded=loadLineupStore(storage)
 assert.equal(reloaded.round,null);assert.equal(JSON.parse(storage.getItem(LINEUP_KEY)).round,null)
 assert.deepEqual(statistics(reloaded),before);assert.deepEqual(reloaded.results,store.results);assert.deepEqual(reloaded.played,[match.id])
 assert.equal(storage.getItem('profile'),'Benjamin');assert.equal(storage.getItem('theme'),'fcm')
 assert.equal(averageCorrectPercentage(statistics(reloaded)),9)
})
test('rounds are never persisted, and a new round starts fully concealed with three minutes',()=>{
 const storage=storageDouble()
 let round=createRound(match,10000,'old');round=guess(round,match.players[0].name,11000).round
 round=buyHint(round,match.players[1].id,12000)
 assert.equal(saveLineupStore({...emptyStore(),round},storage),true)
 assert.equal(loadLineupStore(storage).round,null);assert.equal(loadLineupStore(storage).results.length,0)
 const next=createRound(match,300000,'new')
 assert.deepEqual(next.guessed,[]);assert.deepEqual(next.hints,[]);assert.equal(next.errors,0)
 assert.equal(next.status,'playing');assert.equal(remaining(next,300000),180)
})
test('a completed round counts once and survives leaving or reload; abandonment does not count',()=>{
 const storage=storageDouble();let round=createRound(match,10000,'finished')
 round=guess(round,match.players[0].name,11000).round
 round=tick(round,round.deadline)
 let store=recordResult(emptyStore(),round);store=recordResult(store,round)
 saveLineupStore(store,storage)
 assert.equal(loadLineupStore(storage).results.length,1);assert.equal(statistics(loadLineupStore(storage)).correct,1)
 saveLineupStore({...loadLineupStore(storage),round:createRound(match,300000,'abandoned')},storage)
 assert.equal(loadLineupStore(storage).round,null);assert.equal(statistics(loadLineupStore(storage)).rounds,1)
})
test('loading discards legacy snapshots even if storage cannot be updated',()=>{
 const snapshot=JSON.stringify({...emptyStore(),round:createRound(match,10000,'legacy')})
 const blocked={getItem:()=>snapshot,setItem(){throw new Error('denied')}}
 clearSavedLineupRound(blocked);assert.equal(loadLineupStore(blocked).round,null)
 assert.equal(saveLineupStore(emptyStore(),blocked),false)
 assert.equal(loadLineupStore(null).round,null)
})
