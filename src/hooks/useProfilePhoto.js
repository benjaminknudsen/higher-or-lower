import { useEffect, useSyncExternalStore } from 'react'
import { createProfilePhotoRepository } from '../services/profilePhoto'
let snapshot = { blob: null, loading: true, error: '' }
let hydration
const listeners = new Set()
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener) }
const publish = next => { snapshot = next; listeners.forEach(listener => listener()) }
function repository() {
  try { return createProfilePhotoRepository(window.indexedDB) } catch { return createProfilePhotoRepository(null) }
}
function hydrate() {
  if (!hydration) hydration = repository().load().then(blob => {
    publish({ blob: blob instanceof Blob ? blob : null, loading: false, error: '' })
  }).catch(() => publish({ blob: null, loading: false, error: 'Dit profilbillede kunne ikke hentes fra denne enhed.' }))
  return hydration
}
async function updatePhoto(blob) {
  await hydrate()
  const previous = snapshot
  publish({ blob, loading: false, error: '' })
  try {
    if (blob) await repository().save(blob)
    else await repository().remove()
  } catch {
    publish(previous)
    throw new Error('Billedet kunne ikke gemmes. Kontrollér, at browseren tillader lagring, og at der er ledig plads.')
  }
}
export default function useProfilePhoto() {
  const state = useSyncExternalStore(subscribe, () => snapshot)
  useEffect(() => { void hydrate() }, [])
  return { ...state, save: updatePhoto, remove: () => updatePhoto(null) }
}
