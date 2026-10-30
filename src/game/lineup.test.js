import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validMatch, selectMatch, createRound, maskName, letterCount, guess, buyHint, tick, remaining, scoreRound, recordResult, emptyStore, readStore, statistics, LINEUP_KEY, validRound, isActiveMatch, retireInactiveRound, averageCorrectPercentage } from './lineup.js'
const matches = JSON.parse(readFileSync(new URL('../data/lineupMatches.json',import.meta.url)))
const start = () => createRound(matches[0],10000,'test-round')
test('real dataset has complete verified lineups and unique positions', () => {
 assert.ok(matches.length >= 2)
 for (const m of matches) { assert.ok(validMatch(m)); assert.equal(new Set(m.players.map(p => `${p.row}:${p.slot}`)).size,11) }
 for (const mutate of [m=>m.players.pop(),m=>m.verified=false,m=>m.formation='4-4-4',m=>m.players[1].slot=99,m=>m.players[0].numberSource=null,m=>m.sources=[]]) { const m=structuredClone(matches[0]); mutate(m); assert.equal(validMatch(m),false) }
})
test('selection exhausts verified pool and avoids immediate repeat on reset', () => {
 const pool = matches.slice(0,2).map(m => ({...m,active:true}))
 let played=[],last
 for(let i=0;i<12;i++) { const pick=selectMatch([...pool,{verified:false}],played,()=>.9); assert.ok(pick); assert.notEqual(pick.match.id,last); last=pick.match.id;played=pick.played }
 assert.equal(selectMatch([]),null)
 assert.notEqual(selectMatch(pool,[],()=>0).match.id,selectMatch(pool,[],()=>.99).match.id)
})
test('name masks preserve Danish letters, spaces and hyphens', () => {
 assert.equal(maskName('Marc Dal Hende'),'•••• ••• •••••')
 assert.equal(maskName('Han-beom Ærø'),'•••-•••• •••'); assert.equal(letterCount('Han-beom Ærø'),10)
 assert.equal(maskName('Jose\u0301'),'••••')
})
test('matching trims spaces, ignores case and accents; duplicates and empty guesses are free', () => {
 let r=start(); r=guess(r,'  JONAS   LOSSL ',11000).round
 assert.deepEqual(r.guessed,['lossl']); assert.equal(scoreRound(r),10)
 assert.equal(guess(r,'Lössl',12000).round,r); assert.equal(guess(r,'   ',13000).round,r)
 r=guess(r,'Dreyer',14000).round; assert.equal(r.guessed.length,2)
})
test('ambiguous aliases require full name', () => {
 const r=start();r.match.players[0].aliases=['shared'];r.match.players[1].aliases=['shared']
 const a=guess(r,'shared',11000);assert.equal(a.round.errors,0);assert.match(a.feedback,/tvetydigt/)
})
test('three errors finish once; double submission is ignored; substitutes are wrong', () => {
 let r=guess(start(),'Mads Hansen',11000).round; assert.equal(r.errors,1)
 r=guess(r,'Mads Hansen',11100).round;assert.equal(r.errors,1)
 r=guess(r,'wrong',12000).round; assert.equal(r.status,'playing')
 r=guess(r,'wrong',13000).round;assert.equal(r.errors,3);assert.equal(r.status,'errors')
 assert.equal(guess(r,'Lössl',14000).round,r)
})
test('deadline uses elapsed real time and disallows late guesses and hints', () => {
 const r=start();assert.equal(remaining(r,10000),300);assert.equal(remaining(r,309001),1)
 assert.equal(tick(r,310000).status,'time');assert.equal(remaining(r,999999),0)
 assert.equal(guess(r,'Lössl',310000).round.guessed.length,0)
 assert.equal(buyHint(r,'lossl',310000).status,'time')
})
test('hints cost five, cannot repeat, require verified numbers and available points', () => {
 let r=start();assert.equal(buyHint(r,'dreyer',11000),r)
 r=guess(r,'Lössl',11000).round;r=buyHint(r,'dreyer',12000);assert.equal(scoreRound(r),5)
 assert.equal(buyHint(r,'dreyer',13000),r)
 r=buyHint(r,'sisto',13000);assert.equal(scoreRound(r),0);assert.equal(buyHint(r,'evander',14000),r)
 const x=structuredClone(r);x.match.players.find(p=>p.id==='evander').shirtNumber=null
 assert.equal(buyHint(x,'evander',14000),x)
})
test('eleven guesses finish perfectly and stop timer; result statistics are idempotent', () => {
 let r=start();r.match.players.forEach((p,i)=>{r=guess(r,p.name,11000+i*1000).round})
 assert.equal(r.status,'perfect');assert.equal(scoreRound(r),110);assert.equal(remaining(r,999999),remaining(r,r.endedAt))
 let store=recordResult(emptyStore(),r);store=recordResult(store,r)
 assert.deepEqual(statistics(store),{rounds:1,best:110,perfect:1,correct:11})
})
test('active snapshot restores guesses, hints, errors, match and original deadline', () => {
 let r=guess(start(),'Lössl',11000).round;r=buyHint(r,'sisto',12000);r=guess(r,'wrong',13000).round
 const store={...emptyStore(),played:[r.match.id],round:r}
 const storage={ getItem:key=>key===LINEUP_KEY?JSON.stringify(store):null }
 assert.deepEqual(readStore(storage),store);assert.equal(tick(readStore(storage).round,310000).status,'time')
 assert.equal(readStore({getItem:()=>'{bad'}).round,null)
 assert.equal(readStore({getItem:()=>JSON.stringify({...store,round:{...r,errors:99}})}).round,null)
 assert.ok(validRound(r))
})
test('generic formations support 4-4-2 and 3-5-2 without hardcoded slots', () => {
 for(const formation of ['4-4-2','3-5-2']) { const m=structuredClone(matches[0]);m.formation=formation;let i=0;[1,...formation.split('-').map(Number)].forEach((n,row)=>{for(let slot=0;slot<n;slot++){Object.assign(m.players[i],{row,slot,position:row===0?'GK':'OUTFIELD'});i++}});assert.ok(validMatch(m)) }
})
test('invalid JSON field types are rejected without crashing selection', () => {
 for(const players of [null,{},[null],Array(11).fill({name:123})]) { assert.equal(validMatch({...matches[0],players}),false) }
 const duplicate=structuredClone(matches[0]);duplicate.players[1].id=duplicate.players[0].id;assert.equal(validMatch(duplicate),false)
 const missingNumber=structuredClone(matches[0]);missingNumber.players[1].shirtNumber=null;delete missingNumber.players[1].numberSource;assert.ok(validMatch(missingNumber))
})
test('a single active match repeats safely with stale Celtic history', () => {
 const pool = matches.map(m=>({...m,active:m.id==='viborg-fcm-2026-10-19'}))
 const active = pool.filter(isActiveMatch)
 assert.equal(active.length,1);assert.equal(active[0].id,'viborg-fcm-2026-10-19')
 let played=matches.filter(m=>!m.active).map(m=>m.id)
 for(let i=0;i<30;i++) { const pick=selectMatch(pool,played,()=>i%2 ? .99 : 0);assert.equal(pick.match.id,active[0].id);played=pick.played }
 assert.equal(selectMatch(matches.map(m=>({...m,active:false}))),null)
})
test('verified Viborg lineup has five formation chains and correct starters and numbers', () => {
 const m=matches.find(m=>m.id==='viborg-fcm-2026-10-19')
 assert.equal(m.date,'2026-10-19');assert.deepEqual(m.score,[1,2]);assert.equal(m.formation,'3-4-1-2')
 assert.deepEqual([0,1,2,3,4].map(row=>m.players.filter(p=>p.row===row).sort((a,b)=>a.slot-b.slot).map(p=>[p.name,p.shirtNumber])),[
 [['Nordin Bakker',25]], [['Mads Bech Sørensen',22],['Andreas Maxsø',2],['Ousmane Diao',4]],
 [['Kjell Wätjen',29],['Pedro Bravo',19],['Philip Billing',8],['Rasmus Nissen Kristensen',5]],
 [['Denil Castillo',21]], [['Friday Etim',90],['Stanley Iheanacho',18]]
 ])
 let r=createRound(m,10000,'viborg')
 for(const name of ['Kevin Wätjen','Franculino Djú','Cho Gue-sung']) { const answer=guess(r,name,r.startedAt+1000);assert.equal(answer.round.guessed.length,0) }
 r=guess(r,'Bakker',11000).round;assert.equal(scoreRound(r),10)
 r=buyHint(r,'watjen',12000);assert.equal(scoreRound(r),5)
 assert.equal(r.match.players.find(p=>p.id==='watjen').shirtNumber,29)
})
test('retired saved Celtic rounds are archived without losing results or statistics', () => {
 const round=start();delete round.match.active
 const old=recordResult(emptyStore(),tick(round,round.deadline))
 const before=statistics(old)
 const migrated=retireInactiveRound(old,matches)
 assert.equal(migrated.round,null);assert.deepEqual(migrated.archivedRounds,[old.round]);assert.deepEqual(statistics(migrated),before)
 assert.deepEqual(retireInactiveRound(migrated,matches),migrated)
 const restored=readStore({getItem:()=>JSON.stringify(migrated)})
 assert.deepEqual(restored.archivedRounds,migrated.archivedRounds)
 const next=createRound(selectMatch(matches,restored.played).match,210000,'next')
 assert.ok(validRound(next));assert.ok(isActiveMatch(next.match))
 const inProgress={...emptyStore(),round:start()}
 assert.equal(retireInactiveRound(inProgress,matches).archivedRounds[0].status,'playing')
})
test('reactivating historical matches automatically restores the random pool', () => {
 const pool=matches.map(m=>({...m,active:true}));let played=[];const seen=new Set()
 for(let i=0;i<pool.length;i++) {const pick=selectMatch(pool,played,()=>.5);assert.ok(!seen.has(pick.match.id));seen.add(pick.match.id);played=pick.played}
 assert.equal(seen.size,pool.length)
})
test('each full-name word accepts first, middle and last names with existing normalization', () => {
 const m=matches.find(m=>m.id==='viborg-fcm-2026-10-19')
 for(const [input,id] of [['Philip','billing'],['Billing','billing'],['Mads','bech'],['Bech','bech'],['Sørensen','bech'],['Denil','castillo'],['Castillo','castillo'],['  pHiLiP  ','billing'],['  Mads   Bech   Sørensen  ','bech']]) {
  const result=guess(createRound(m,10000,'word-test'),input,11000)
  assert.deepEqual(result.round.guessed,[id],input)
  assert.equal(scoreRound(result.round),10,input)
  assert.equal(result.round.errors,0,input)
  assert.equal(result.kind,'correct',input)
 }
 // A separate matching fixture exercises the requested name without changing match data.
 const r=start();r.match.players[0].name='Franculino Djú';r.match.players[0].aliases=[]
 for(const input of ['Franculino','Djú','DJU','Franculino   Djú']) {
  assert.deepEqual(guess(r,input,11000).round.guessed,['lossl'])
 }
})
test('every unambiguous word in every stored full name can identify its player', () => {
 for(const m of matches) {
  for(const p of m.players) {
   for(const word of p.name.split(/\s+/u)) {
    const result=guess(createRound(m,10000,'all-words'),word,11000)
    const shared=m.players.filter(other=>[other.name,...other.aliases,...other.name.split(/\s+/u)].some(n=>n.localeCompare(word,'da',{sensitivity:'base'})===0)).length>1
    if(!shared) assert.deepEqual(result.round.guessed,[p.id],`${p.name}: ${word}`)
   }
  }
 }
})
test('shared first and last names require a specific name without errors or multiple reveals', () => {
 for(const names of [['Philip Billing','Philip Hansen','Philip'],['Philip Billing','Mads Billing','Billing']]) {
  const r=start();Object.assign(r.match.players[0],{name:names[0],aliases:[]});Object.assign(r.match.players[1],{name:names[1],aliases:[]})
  const ambiguous=guess(r,names[2],11000)
  assert.deepEqual(ambiguous.round.guessed,[]);assert.equal(ambiguous.round.errors,0);assert.match(ambiguous.feedback,/tvetydigt/)
  const specific=guess(r,names[0],12000)
  assert.deepEqual(specific.round.guessed,['lossl']);assert.equal(scoreRound(specific.round),10)
  // A shared word stays ambiguous even after one of its owners was guessed.
  const again=guess(specific.round,names[2],13000)
  assert.deepEqual(again.round.guessed,['lossl']);assert.equal(scoreRound(again.round),10);assert.equal(again.round.errors,0);assert.match(again.feedback,/tvetydigt/)
 }
})
test('different words of an already guessed player cannot award extra points', () => {
 const m=matches.find(m=>m.id==='viborg-fcm-2026-10-19')
 let r=guess(createRound(m,10000,'repeat-words'),'Mads',11000).round
 for(const [i,name] of ['Bech','Sørensen','Mads Bech Sørensen'].entries()) {
  const answer=guess(r,name,12000+i*1000)
  assert.equal(answer.round,r);assert.equal(scoreRound(answer.round),10);assert.equal(answer.round.errors,0);assert.match(answer.feedback,/allerede/)
  r=answer.round
 }
})
test('completed rounds accumulate 7 + 9 + 11 guesses on the same match, never hints or revealed players', () => {
 const match=matches.find(m=>m.active)
 let store=emptyStore()
 for(const [index,count] of [7,9,11].entries()) {
  let r=createRound(match,10000,`cumulative-${index}`)
  for(let i=0;i<count;i++) r=guess(r,match.players[i].name,11000+i*1000).round
  if(count<11)r=buyHint(r,match.players[count].id,25000)
  // Active rounds do not yet contribute, even if they contain correct guesses.
  assert.equal(recordResult(store,r).results.length,store.results.length+(count===11?1:0))
  if(index===0)r=tick(r,r.deadline)
  if(index===1)for(let i=0;i<3;i++)r=guess(r,'wrong',30000+i*1000).round
  store=recordResult(store,r);store=recordResult(store,r)
  assert.equal(store.results.length,index+1)
 }
 assert.deepEqual(store.results.map(r=>r.status),['time','errors','perfect'])
 assert.equal(statistics(store).correct,27)
 const restored=readStore({getItem:()=>JSON.stringify(store)})
 assert.equal(statistics(restored).correct,27);assert.equal(restored.results.length,3)
 assert.equal(new Set(restored.results.map(r=>r.matchId)).size,1)
})

test('average correct percentage rounds to whole percent and handles zero rounds', () => {
 assert.equal(averageCorrectPercentage({rounds:0,correct:0}),0)
 assert.equal(averageCorrectPercentage({rounds:8,correct:13}),15)
 assert.equal(averageCorrectPercentage({rounds:1,correct:0}),0)
 assert.equal(averageCorrectPercentage({rounds:1,correct:11}),100)
 assert.equal(averageCorrectPercentage({rounds:1,correct:1}),9)
 assert.equal(averageCorrectPercentage({rounds:2,correct:11}),50)
})
test('profile percentage uses only completed personal guesses and preserves best score', () => {
 const store=emptyStore()
 let r=guess(start(),'Lössl',11000).round
 r=buyHint(r,'sisto',12000)
 assert.equal(averageCorrectPercentage(statistics(recordResult(store,r))),0)
 const finished=recordResult(store,tick(r,r.deadline))
 const before=JSON.stringify(finished)
 assert.equal(averageCorrectPercentage(statistics(finished)),9)
 assert.equal(statistics(finished).best,5)
 assert.equal(JSON.stringify(finished),before)
 const reloaded=readStore({getItem:()=>JSON.stringify(finished)})
 assert.equal(averageCorrectPercentage(statistics(reloaded)),9)
 let next=createRound(r.match,200000,'average-second')
 for(const [i,p] of next.match.players.entries())next=guess(next,p.name,201000+i*1000).round
 const updated=recordResult(reloaded,next)
 assert.equal(averageCorrectPercentage(statistics(updated)),55)
 assert.equal(statistics(updated).best,110)
})

const pending = JSON.parse(readFileSync(new URL('../data/lineupMatches.pending.json',import.meta.url)))
const historical = matches.filter(m => !['fcm-celtic-2021-07-20','fcm-celtic-2021-07-28','viborg-fcm-2026-10-19'].includes(m.id))
test('all ten requested historical matches are accounted for without duplicates', () => {
 const all=[...historical,...pending]
 assert.equal(all.length,10)
 assert.equal(new Set(all.map(m=>m.id)).size,10)
 assert.equal(new Set(all.map(m=>`${m.date}:${m.home}:${m.away}`)).size,10)
 for(const m of all) {
  assert.equal(m.players.length,11,m.id)
  assert.equal(new Set(m.players.map(p=>p.name)).size,11,m.id)
 }
 assert.equal(historical.length,7)
 assert.ok(historical.every(isActiveMatch))
 assert.equal(pending.length,3)
 for(const m of pending) {
  assert.equal(m.active,false);assert.equal(m.verified,false)
  assert.equal(m.formation,null);assert.ok(m.verificationNote)
  assert.equal(validMatch(m),false)
  assert.ok(m.players.every(p=>p.row===null && p.slot===null && p.shirtNumber===null))
 }
})
test('new playable fixtures retain verified dates, scores and formation chains', () => {
 const expected=[
  ['fcm-lazio-2022-09-15','2022-09-15',[5,1],'4-3-3'],
  ['fcm-slavia-2020-09-30','2020-09-30',[4,1],'4-3-3'],
  ['liverpool-fcm-2020-10-27','2020-10-27',[2,0],'4-2-3-1'],
  ['fcm-liverpool-2020-12-09','2020-12-09',[1,1],'4-2-3-1'],
  ['southampton-fcm-2015-08-20','2015-08-20',[1,1],'4-1-4-1'],
  ['fcm-southampton-2015-08-27','2015-08-27',[1,0],'4-1-4-1'],
  ['fcm-man-utd-2016-02-18','2016-02-18',[2,1],null],
  ['fcm-horsens-2018-05-21','2018-05-21',[1,0],null],
  ['man-city-fcm-2008-08-14','2008-08-14',[0,1],'4-4-2'],
  ['brondby-fcm-2019-05-17','2019-05-17',[1,1],null],
 ]
 for(const [id,date,score,formation] of expected) {
  const m=[...historical,...pending].find(m=>m.id===id)
  assert.equal(m.date,date);assert.deepEqual(m.score,score);assert.equal(m.formation,formation)
  if(formation===null) continue
  assert.deepEqual([1,...formation.split('-').map(Number)],Array.from({length:formation.split('-').length+1},(_,row)=>m.players.filter(p=>p.row===row).length))
 }
})
test('every new starter accepts its full name, finishes perfectly and keeps hints separate', () => {
 for(const m of historical) {
  let r=createRound(m,10000,m.id)
  assert.deepEqual(r.guessed,[]);assert.deepEqual(r.hints,[]);assert.equal(remaining(r,10000),300)
  for(const [i,p] of m.players.entries()) r=guess(r,`  ${p.name.toUpperCase()}  `,11000+i*1000).round
  assert.equal(r.status,'perfect',m.id);assert.equal(scoreRound(r),110,m.id)
  assert.equal(statistics(recordResult(emptyStore(),r)).correct,11)
  for(const p of m.players) {
   let hintRound=guess(createRound(m,10000,'hint'),m.players.find(other=>other.id!==p.id).name,11000).round
   hintRound=buyHint(hintRound,p.id,12000)
   assert.equal(hintRound.hints.length,p.shirtNumber===null?0:1)
   assert.equal(hintRound.guessed.length,1)
   assert.equal(scoreRound(hintRound),p.shirtNumber===null?10:5)
   assert.equal(buyHint(hintRound,p.id,13000),hintRound)
  }
 }
})
test('expanded active pool exhausts before repeats and excludes unresolved and retired matches', () => {
 const pool=[...matches,...pending], active=pool.filter(isActiveMatch)
 let history=['obsolete-id','fcm-celtic-2021-07-20'],last
 for(let cycle=0;cycle<3;cycle++) {
  const seen=new Set()
  for(let i=0;i<active.length;i++) {
   const pick=selectMatch(pool,history,()=>.37)
   assert.ok(isActiveMatch(pick.match));assert.ok(!seen.has(pick.match.id));assert.notEqual(pick.match.id,last)
   seen.add(pick.match.id);last=pick.match.id;history=pick.played
  }
  assert.equal(seen.size,active.length)
 }
})
