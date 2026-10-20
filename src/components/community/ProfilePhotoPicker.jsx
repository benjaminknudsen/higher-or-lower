import { useEffect, useRef, useState } from 'react'
import useProfilePhoto from '../../hooks/useProfilePhoto'
import { optimizeProfilePhoto } from '../../services/optimizeProfilePhoto'
import Avatar from './Avatar'
import useAuthAccount from '../../hooks/useAuthAccount.js'
import { profilePhotoOwner } from '../../services/profilePhotoStore.js'
import { removeCloudProfilePhoto, saveCloudProfilePhoto } from '../../services/cloudProfilePhoto.js'
import { authAccount } from '../../services/authAccount.js'
import { supabase } from '../../lib/supabase.js'
import Icon from '../Icon'

export default function ProfilePhotoPicker({ variant = 'editor', onFeedback } = {}) {
  const account=useAuthAccount()
  const owner=profilePhotoOwner(account)
  return <OwnedPhotoPicker key={owner??'loading'} owner={owner} variant={variant} onFeedback={onFeedback} />
}
function OwnedPhotoPicker({owner,variant,onFeedback}) {
  const photo = useProfilePhoto(owner)
  const account=useAuthAccount()
  const alive=useRef(true)
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const pending = useRef(false)
  function feedback(text) { if(alive.current){setMessage(text);onFeedback?.(text)} }
  async function choose(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || pending.current) return
    pending.current = true; setBusy(true); setError(''); feedback('Behandler billede…')
    try {
      const optimized=await optimizeProfilePhoto(file)
      if(owner==='guest') {
        await photo.save(optimized)
        feedback('Profilbilledet er gemt på denne enhed.')
      } else if(owner===`user:${account.userId}`&&account.profile) {
        const saved=await saveCloudProfilePhoto(supabase,account.userId,optimized,account.profile.avatar_path)
        authAccount.setAvatarPath(account.userId,saved.path)
        feedback(saved.warning||'Profilbilledet er synkroniseret med din konto.')
      } else throw new Error('Vent, til din konto er indlæst, og prøv igen.')
    }
    catch (err) { const text=err.message || 'Billedet kunne ikke gemmes. Prøv igen.';setError(text);setMessage('');if(alive.current)onFeedback?.(text) }
    finally { pending.current = false; setBusy(false) }
  }
  async function remove() {
    if (pending.current) return
    pending.current = true; setBusy(true); setError(''); setMessage('')
    try {
      if(owner==='guest') {
        await photo.remove()
        setMessage('Profilbilledet er fjernet.')
      } else if(owner===`user:${account.userId}`&&account.profile) {
        const result=await removeCloudProfilePhoto(supabase,account.userId,account.profile.avatar_path)
        authAccount.setAvatarPath(account.userId,null)
        setMessage(result.warning||'Profilbilledet er fjernet fra din konto.')
      } else throw new Error('Vent, til din konto er indlæst, og prøv igen.')
    }
    catch (err) { setError(err.message) }
    finally { pending.current = false; setBusy(false) }
  }
  const loading=owner==='guest'?photo.loading:!account.profile
  const hasPhoto=owner==='guest'?Boolean(photo.blob):Boolean(account.profile?.avatar_path)
  if (variant === 'avatar') return <span className="profile-photo-direct" aria-busy={busy}>
    <button type="button" className="profile-photo-direct-button" disabled={!owner || busy || loading} aria-label="Skift profilbillede" title="Skift profilbillede" onClick={() => fileRef.current?.click()}>
      <Avatar self localPhoto /><span className="profile-photo-camera" aria-hidden="true"><Icon name="camera" /></span>
    </button>
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={choose} aria-label="Vælg profilbillede direkte" />
  </span>
  return <div className="profile-photo-editor" aria-busy={busy}>
    <Avatar self localPhoto />
    <button className="profile-editor-action" type="button" disabled={!owner || busy || loading} onClick={() => fileRef.current?.click()}><Icon name="camera" />{hasPhoto?'Skift profilbillede':'Tilføj profilbillede'}</button>
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={choose} aria-label="Vælg billedfil til profil" />
    {hasPhoto && <button className="profile-editor-remove" type="button" disabled={busy} onClick={remove}>Fjern profilbillede</button>}
    <span className="profile-photo-message" role="status">{message}</span>
    {(error || (owner==='guest'&&photo.error)) && <span className="profile-photo-error" role="alert">{error || photo.error}</span>}
  </div>
}
