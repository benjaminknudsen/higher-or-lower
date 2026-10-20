import test from 'node:test'
import assert from 'node:assert/strict'
import { createProfilePhotoRepository } from '../services/profilePhoto.js'
import { avatarDimensions, validatePhotoFile, optimizeProfilePhoto, MAX_PHOTO_BYTES } from '../services/optimizeProfilePhoto.js'

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
     assert.equal(key,'self')
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
 assert.equal(db.records.get('self'),photo)
 await assert.rejects(repo.remove(),/Quota/);assert.equal(db.records.get('self'),photo)
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
function imageEnvironment({decode=true,webp=true}={}) {
 const revoked=[],formats=[],draws=[]
 const env={URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:url=>revoked.push(url)},Image:class{
  naturalWidth=4032;naturalHeight=3024
  set src(value){assert.equal(value,'blob:test');queueMicrotask(()=>decode?this.onload():this.onerror())}
 },document:{createElement(tag){assert.equal(tag,'canvas');return {getContext:()=>({drawImage:(_img,...args)=>draws.push(args)}),toBlob(callback,type){formats.push(type);callback(type==='image/webp'&&!webp?null:new Blob(['encoded'],{type}))}}}}}
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
