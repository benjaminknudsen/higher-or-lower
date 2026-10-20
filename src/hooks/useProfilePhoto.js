import { useEffect, useSyncExternalStore } from 'react'
import { createProfilePhotoRepository } from '../services/profilePhoto'
import { createProfilePhotoStores, profilePhotoOwner } from '../services/profilePhotoStore.js'
import useAuthAccount from './useAuthAccount.js'

const stores=createProfilePhotoStores(owner=>{
  let database
  try{database=window.indexedDB}catch{/* Repository reports unavailable storage. */}
  return createProfilePhotoRepository(database,{owner})
})
export default function useProfilePhoto(explicitOwner) {
  const account=useAuthAccount()
  const owner=explicitOwner===undefined?profilePhotoOwner(account):explicitOwner
  const store=stores(owner)
  const state=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot)
  useEffect(()=>{void store.hydrate()},[store])
  return {...state,owner,save:store.save,remove:store.remove}
}
