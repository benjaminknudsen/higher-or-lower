import test from 'node:test'
import assert from 'node:assert/strict'
import { createGuestWelcomeSession, isGuestWelcomeHome } from '../services/guestWelcome.js'
function store() {
 const data=new Map()
 return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}
}
const home={ready:true,status:'guest',hash:'#forside'}
test('waits for resolved guest Auth and callback processing; signed-in users never see the invitation',()=>{
 const session=createGuestWelcomeSession(store())
 for(const status of ['loading','signed-in'])assert.equal(session.canShow({...home,status}),false)
 assert.equal(session.canShow({...home,ready:false}),false)
 assert.equal(session.canShow(home),true)
})
test('only welcome/home routes qualify, never gameplay, profile, leaderboard or installation',()=>{
 const session=createGuestWelcomeSession(store())
 for(const hash of ['','#velkommen','#forside','#spiltilstande']) {
  assert.equal(isGuestWelcomeHome(hash),true);assert.equal(session.canShow({...home,hash}),true)
 }
 for(const hash of ['#spil/appearances','#spil/lineup','#profil','#leaderboard','#installer','#medals'])assert.equal(session.canShow({...home,hash}),false)
})
test('other modals and hidden pages defer the invitation without consuming the session',()=>{
 const session=createGuestWelcomeSession(store())
 assert.equal(session.canShow({...home,modalOpen:true}),false)
 assert.equal(session.canShow({...home,visible:false}),false)
 assert.equal(session.canShow(home),true)
})
test('shown invitation stays dismissed through navigation and reloads in the same browser session',()=>{
 const storage=store(),session=createGuestWelcomeSession(storage)
 session.markShown()
 assert.equal(session.canShow(home),false)
 assert.equal(session.canShow({...home,hash:'#velkommen'}),false)
 assert.equal(createGuestWelcomeSession(storage).canShow(home),false)
 assert.equal(createGuestWelcomeSession(store()).canShow(home),true)
})
test('initial guest resolution does not reset a previously shown invitation',()=>{
 const storage=store(),session=createGuestWelcomeSession(storage)
 session.markShown()
 const reloaded=createGuestWelcomeSession(storage)
 reloaded.accountChanged('loading');reloaded.accountChanged('guest')
 assert.equal(reloaded.canShow(home),false)
})
test('logout permits another invitation on the next visit home without repeated guest resets',()=>{
 const session=createGuestWelcomeSession(store())
 session.markShown();session.accountChanged('signed-in');session.accountChanged('loading');session.accountChanged('guest')
 assert.equal(session.canShow({...home,hash:'#profil'}),false)
 assert.equal(session.canShow(home),true)
 session.markShown();session.accountChanged('guest')
 assert.equal(session.canShow(home),false)
})
test('blocked sessionStorage uses memory and never prevents guest play',()=>{
 const storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}}
 const session=createGuestWelcomeSession(storage)
 assert.equal(session.canShow(home),true);session.markShown();assert.equal(session.canShow(home),false)
 session.accountChanged('signed-in');session.accountChanged('guest');assert.equal(session.canShow(home),true)
})
