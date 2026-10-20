import test from 'node:test'
import assert from 'node:assert/strict'
import { createProfilePhotoStores, profilePhotoOwner } from '../services/profilePhotoStore.js'
const flush=()=>new Promise(resolve=>setTimeout(resolve,0))
function fixture(){
 const records=new Map(),pending=new Map()
 const stores=createProfilePhotoStores(owner=>({
  load:async()=>pending.has(owner)?await pending.get(owner):records.get(owner),
  save:async blob=>{records.set(owner,blob)},remove:async()=>{records.delete(owner)},
 }))
 return {stores,records,pending}
}
test('loading/invalid identities never fall back to guest or last account',()=>{
 assert.equal(profilePhotoOwner({status:'loading',userId:'old'}),null)
 assert.equal(profilePhotoOwner({status:'signed-in',userId:null}),null)
 assert.equal(profilePhotoOwner({status:'guest'}),'guest')
 assert.equal(profilePhotoOwner({status:'signed-in',userId:'a'}),'user:a')
})
test('login, logout and two-account switching immediately select separate snapshots',async()=>{
 const f=fixture(),guest=f.stores('guest'),a=f.stores('user:a'),b=f.stores('user:b')
 const g=new Blob(['guest']),pa=new Blob(['account a'])
 await guest.save(g);await a.save(pa);await b.hydrate()
 assert.equal(f.stores(profilePhotoOwner({status:'signed-in',userId:'a'})).getSnapshot().blob,pa)
 assert.equal(f.stores(profilePhotoOwner({status:'guest'})).getSnapshot().blob,g)
 assert.equal(f.stores(profilePhotoOwner({status:'signed-in',userId:'b'})).getSnapshot().blob,null)
 assert.equal(f.stores(null).getSnapshot().blob,null)
 await b.save(new Blob(['b']));await b.remove()
 assert.equal(a.getSnapshot().blob,pa);assert.equal(guest.getSnapshot().blob,g)
})
test('a slow old-account hydration never publishes its image into the guest/new account',async()=>{
 const f=fixture();let resolve
 f.pending.set('user:a',new Promise(done=>resolve=done))
 const a=f.stores('user:a'),g=f.stores('guest'),b=f.stores('user:b')
 const hydrate=a.hydrate();await g.hydrate();await b.hydrate()
 assert.equal(g.getSnapshot().blob,null);assert.equal(b.getSnapshot().blob,null)
 resolve(new Blob(['private a']));await hydrate
 assert.ok(a.getSnapshot().blob);assert.equal(g.getSnapshot().blob,null);assert.equal(b.getSnapshot().blob,null)
})
test('an upload captures its original owner even if compression finishes after logout',async()=>{
 const f=fixture(),a=f.stores('user:a'),guest=f.stores('guest')
 const saveForA=a.save,photo=new Blob(['a'])
 // UI now displays guest while the old upload callback retains its A-store.
 await guest.hydrate();await saveForA(photo)
 assert.equal(f.records.get('user:a'),photo);assert.equal(guest.getSnapshot().blob,null);assert.equal(f.records.has('guest'),false)
})
test('failed writes keep previous photo and cannot roll back a different account',async()=>{
 const f=fixture(),a=f.stores('user:a');await a.save(new Blob(['old']))
 const old=a.getSnapshot().blob
 const broken=createProfilePhotoStores(()=>({load:async()=>old,save:async()=>{throw Error('quota')}}))('user:broken')
 await broken.hydrate();await assert.rejects(broken.save(new Blob(['new'])),/gemmes/)
 assert.equal(broken.getSnapshot().blob,old);assert.equal(a.getSnapshot().blob,old)
 await flush()
})
