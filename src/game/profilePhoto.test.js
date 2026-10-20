import test from 'node:test'
import assert from 'node:assert/strict'
import { createProfilePhotoRepository } from '../services/profilePhoto.js'
import { avatarDimensions, validatePhotoFile, optimizeProfilePhoto, MAX_PHOTO_BYTES, MAX_UPLOAD_PHOTO_BYTES } from '../services/optimizeProfilePhoto.js'

// A transaction double tests the adapter contract without a browser dependency.
function databaseDouble() {
 const records=new Map();let created=false,closes=0,failTransaction=false
 const factory={open(){
  const request={}
  const db={createObjectStore(){created=true},close(){closes++},transaction(storeName,mode){
   assert.equal(storeName,'photos')
   const transaction={}
   transaction.objectStore=()=>{
    const operation=(kind,key,value)=>{
     assert.ok(key==='guest'||key.startsWith('user:'))
     if(kind!=='get')assert.equal(mode,'readwrite')
     const req={}
     queueMicrotask(()=>{
      if(failTransaction){transaction.error=new Error('Quota');transaction.onabort();return}
      if(kind==='put')records.set(key,value)
      if(kind==='delete')records.delete(key)
      req.result=kind==='get'?records.get(key):key
      transaction.oncomplete()
     })
     return req
    }
    return {get:key=>operation('get',key),put:(value,key)=>operation('put',key,value),delete:key=>operation('delete',key)}
   }
   return transaction
  }}
  queueMicrotask(()=>{request.result=db;if(!created)request.onupgradeneeded();request.onsuccess()})
  return request
 }}
 return {factory,records,get closes(){return closes},fail(){failTransaction=true}}
}
test('profile Blob survives reopening, replacement uses one record and deletion restores empty storage',async()=>{
 const db=databaseDouble(), first=createProfilePhotoRepository(db.factory)
 assert.equal(await first.load(),null)
 const oldPhoto=new Blob(['old'],{type:'image/webp'}),newPhoto=new Blob(['new'],{type:'image/webp'})
 await first.save(oldPhoto)
 const reopened=createProfilePhotoRepository(db.factory)
 assert.equal(await reopened.load(),oldPhoto)
 await reopened.save(newPhoto);assert.equal(db.records.size,1);assert.equal(await first.load(),newPhoto)
 await reopened.remove();assert.equal(await reopened.load(),null);assert.equal(db.records.size,0)
 assert.equal(db.closes,7)
})
test('unavailable or full image storage rejects without deleting the previous photo',async()=>{
 await assert.rejects(createProfilePhotoRepository(null).load(),/ikke tilgængelig/)
 const db=databaseDouble(),repo=createProfilePhotoRepository(db.factory),photo=new Blob(['old'])
 await repo.save(photo);db.fail()
 await assert.rejects(repo.save(new Blob(['new'])),/Quota/)
 assert.equal(db.records.get('guest'),photo)
 await assert.rejects(repo.remove(),/Quota/);assert.equal(db.records.get('guest'),photo)
 assert.equal(db.closes,3)
})
test('avatar resizing caps both dimensions at 512 and preserves proportions without enlarging',()=>{
 assert.deepEqual(avatarDimensions(4032,3024),{width:512,height:384})
 assert.deepEqual(avatarDimensions(3024,4032),{width:384,height:512})
 assert.deepEqual(avatarDimensions(100,80),{width:100,height:80})
 for(const [w,h] of [[0,1],[Infinity,3],[10000,10000]])assert.throws(()=>avatarDimensions(w,h))
})
test('file validation accepts common iPhone formats but rejects empty, huge and nonimage files',()=>{
 for(const file of [{size:10,type:'image/jpeg'},{size:10,type:'image/heic'},{size:10,type:'',name:'IMG_001.HEIC'}])assert.doesNotThrow(()=>validatePhotoFile(file))
 for(const file of [null,{size:0,type:'image/png'},{size:MAX_PHOTO_BYTES+1,type:'image/jpeg'},{size:10,type:'text/plain',name:'notes.txt'}])assert.throws(()=>validatePhotoFile(file))
})
function imageEnvironment({decode=true,webp=true,pngFallback=false,encode,width=4032,height=3024}={}) {
 const revoked=[],formats=[],draws=[]
 const env={URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:url=>revoked.push(url)},Image:class{
  naturalWidth=width;naturalHeight=height
  set src(value){assert.equal(value,'blob:test');queueMicrotask(()=>decode?this.onload():this.onerror())}
 },document:{createElement(tag){assert.equal(tag,'canvas');return {getContext:()=>({fillRect:()=>{},drawImage:(_img,...args)=>draws.push(args)}),toBlob(callback,type,quality){formats.push(type);callback(encode?encode(type,quality):type==='image/webp'&&!webp?(pngFallback?new Blob(['png'],{type:'image/png'}):null):new Blob(['encoded'],{type}))}}}}}
 return {env,revoked,formats,draws}
}
test('optimization returns a compressed Blob and releases its input URL',async()=>{
 const mock=imageEnvironment()
 const blob=await optimizeProfilePhoto({size:100,type:'image/jpeg'},mock.env)
 assert.equal(blob.type,'image/webp');assert.deepEqual(mock.draws,[[0,0,512,384]]);assert.deepEqual(mock.revoked,['blob:test'])
})
test('JPEG fallback and unsupported HEIC produce no leaked object URLs',async()=>{
 const fallback=imageEnvironment({webp:false})
 assert.equal((await optimizeProfilePhoto({size:100,type:'image/png'},fallback.env)).type,'image/jpeg')
 assert.deepEqual(fallback.formats,['image/webp','image/jpeg'])
 const bad=imageEnvironment({decode:false})
 await assert.rejects(optimizeProfilePhoto({size:100,type:'image/heic'},bad.env),/HEIC/)
 assert.deepEqual(bad.revoked,['blob:test'])
})

test('IndexedDB guest and account records survive login/logout and replacement/deletion stay isolated',async()=>{
 const db=databaseDouble(),guest=createProfilePhotoRepository(db.factory)
 const a=createProfilePhotoRepository(db.factory,{owner:'user:account-a'}),b=createProfilePhotoRepository(db.factory,{owner:'user:account-b'})
 const old=new Blob(['ambiguous old shared photo']),g=new Blob(['guest']),pa=new Blob(['a']),pb=new Blob(['b'])
 db.records.set('self',old)
 assert.equal(await guest.load(),null);assert.equal(await a.load(),null)
 await guest.save(g);await a.save(pa);await b.save(pb)
 // Login A -> logout -> login B: each identity reads its own persisted record.
 assert.equal(await a.load(),pa);assert.equal(await guest.load(),g);assert.equal(await b.load(),pb)
 const nextA=new Blob(['new a']);await a.save(nextA);assert.equal(await b.load(),pb);assert.equal(await guest.load(),g)
 await a.remove();assert.equal(await a.load(),null);assert.equal(await b.load(),pb);assert.equal(await guest.load(),g)
 assert.equal(db.records.get('self'),old)
 assert.equal(await createProfilePhotoRepository(db.factory,{owner:'user:account-b'}).load(),pb)
})


test('Safari PNG fallback is converted to JPEG for every common decodable input',async()=>{
 for(const type of ['image/jpeg','image/png','image/webp','image/heic','image/heif']) {
  const mock=imageEnvironment({webp:false,pngFallback:true})
  const blob=await optimizeProfilePhoto({size:100,type},mock.env)
  assert.equal(blob.type,'image/jpeg')
  assert.ok(blob.size<=MAX_UPLOAD_PHOTO_BYTES)
  assert.deepEqual(mock.formats,['image/webp','image/jpeg'])
  assert.deepEqual(mock.revoked,['blob:test'])
 }
})
test('compression reduces quality until output fits the shared Storage limit',async()=>{
 const qualities=[]
 const mock=imageEnvironment({encode:(type,quality)=>{
  qualities.push(quality)
  return new Blob([new Uint8Array(quality>.7?MAX_UPLOAD_PHOTO_BYTES+1:100)],{type})
 }})
 const blob=await optimizeProfilePhoto({size:100,type:'image/png'},mock.env)
 assert.equal(blob.size,100);assert.deepEqual(qualities,[.85,.7])
})
test('unusable and oversized encoder outputs are rejected and release resources',async()=>{
 for(const encode of [()=>null,()=>new Blob([],{type:'image/webp'}),()=>new Blob(['png'],{type:'image/png'}),type=>new Blob([new Uint8Array(MAX_UPLOAD_PHOTO_BYTES+1)],{type})]) {
  const mock=imageEnvironment({encode})
  await assert.rejects(optimizeProfilePhoto({size:100,type:'image/png'},mock.env),/komprimeres/)
  assert.deepEqual(mock.revoked,['blob:test'])
 }
})
test('browser-oriented portrait dimensions are preserved during canvas rendering',async()=>{
 const mock=imageEnvironment({width:3024,height:4032})
 await optimizeProfilePhoto({size:100,type:'image/jpeg'},mock.env)
 assert.deepEqual(mock.draws,[[0,0,384,512]])
})
