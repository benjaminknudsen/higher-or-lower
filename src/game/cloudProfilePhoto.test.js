import test from 'node:test'
import assert from 'node:assert/strict'
import { profilePhotoPublicUrl, removeCloudProfilePhoto, saveCloudProfilePhoto } from '../services/cloudProfilePhoto.js'

function fixture({profileError=null,removeError=null}={}){
  const state={uploaded:[],removed:[],updated:[],url:''}
  const bucket={upload:async(path,blob,options)=>{state.uploaded.push({path,blob,options});return {error:null}},remove:async paths=>{state.removed.push(paths);return {error:removeError}}}
  const client={
    storage:{from:name=>{assert.equal(name,'fcm-avatars');return {...bucket,getPublicUrl:path=>({data:{publicUrl:`https://storage.test/${path}`}})}}},
    from:table=>{assert.equal(table,'profiles');const q={update:value=>{state.updated.push(value);return q},eq:(column,value)=>{state.owner=[column,value];return q},select:()=>q,single:async()=>profileError?{data:null,error:profileError}:{data:{id:state.owner[1],avatar_path:state.updated.at(-1).avatar_path},error:null}};return q},
  }
  return {client,state}
}

test('compressed cloud image uses a new cache-safe owner path and updates only that profile',async()=>{
  const f=fixture(),blob=new Blob(['webp'],{type:'image/webp'})
  const saved=await saveCloudProfilePhoto(f.client,'user-a',blob,'user-a/old.webp')
  assert.match(saved.path,/^user-a\/[0-9a-f-]{36}\.webp$/i)
  assert.equal(f.state.uploaded[0].options.cacheControl,'31536000')
  assert.equal(f.state.uploaded[0].options.upsert,false)
  assert.deepEqual(f.state.updated,[{avatar_path:saved.path}])
  assert.deepEqual(f.state.owner,['id','user-a'])
  assert.deepEqual(f.state.removed,[['user-a/old.webp']])
  assert.equal(profilePhotoPublicUrl(f.client,saved.path),`https://storage.test/${saved.path}`)
})

test('unsupported formats and profile update failures do not silently replace the current photo',async()=>{
  const bad=fixture()
  await assert.rejects(saveCloudProfilePhoto(bad.client,'user-a',new Blob(['x'],{type:'image/png'})),/WebP- eller JPEG/)
  const failed=fixture({profileError:new Error('denied')})
  await assert.rejects(saveCloudProfilePhoto(failed.client,'user-a',new Blob(['webp'],{type:'image/webp'})),/sti kunne ikke gemmes/)
  assert.equal(failed.state.removed.length,1)
})

test('removal clears only the owner profile and reports Storage cleanup failures',async()=>{
  const f=fixture({removeError:new Error('network')})
  const result=await removeCloudProfilePhoto(f.client,'user-a','user-a/old.webp')
  assert.deepEqual(f.state.updated,[{avatar_path:null}])
  assert.deepEqual(f.state.owner,['id','user-a'])
  assert.match(result.warning,/ryddes op/)
})
