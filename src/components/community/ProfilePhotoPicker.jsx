import { useRef, useState } from 'react'
import useProfilePhoto from '../../hooks/useProfilePhoto'
import { optimizeProfilePhoto } from '../../services/optimizeProfilePhoto'
import Avatar from './Avatar'
import Icon from '../Icon'

export default function ProfilePhotoPicker() {
  const photo = useProfilePhoto()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const pending = useRef(false)
  async function choose(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || pending.current) return
    pending.current = true; setBusy(true); setError(''); setMessage('Behandler billede…')
    try { await photo.save(await optimizeProfilePhoto(file)); setMessage('Profilbilledet er gemt.') }
    catch (err) { setError(err.message || 'Billedet kunne ikke gemmes. Prøv igen.'); setMessage('') }
    finally { pending.current = false; setBusy(false) }
  }
  async function remove() {
    if (pending.current) return
    pending.current = true; setBusy(true); setError(''); setMessage('')
    try { await photo.remove(); setMessage('Profilbilledet er fjernet.') }
    catch (err) { setError(err.message) }
    finally { pending.current = false; setBusy(false) }
  }
  return <div className="profile-photo-editor" aria-busy={busy}>
    <Avatar self />
    <button className="profile-editor-action" type="button" disabled={busy || photo.loading} onClick={() => fileRef.current?.click()}><Icon name="camera" />Skift profilbillede</button>
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={choose} aria-label="Vælg billedfil til profil" />
    {photo.blob && <button className="profile-editor-remove" type="button" disabled={busy} onClick={remove}>Fjern profilbillede</button>}
    <span className="profile-photo-message" role="status">{message}</span>
    {(error || photo.error) && <span className="profile-photo-error" role="alert">{error || photo.error}</span>}
  </div>
}
