import LineupStatistics from '../lineup/LineupStatistics'
import { useEffect, useRef, useState } from 'react'
import useLocalAccount from '../../hooks/useLocalAccount'
import useHighScore from '../../hooks/useHighScore'
import HighScoreMedal from '../HighScoreMedal'
import Icon from '../Icon'
import ProfilePhotoPicker from './ProfilePhotoPicker'
import CommunityHeader from './CommunityHeader'
import Avatar from './Avatar'
import './ProfileCard.css'

function ModeRecord({ clubId, mode }) {
  const { highScore } = useHighScore(clubId, mode.id, 0, false)
  return <li className="profile-mode-record">
    <Icon name={mode.icon} /><span>{mode.title}</span>
    {mode.available ? <strong>{highScore}<small> i træk</small></strong> : <span className="record-coming"><Icon name="lock" />Kommer snart</span>}
  </li>
}

export default function ProfilePage({ clubId, gameModes }) {
  const { profile, saveProfile, persistent } = useLocalAccount(clubId)
  const { highScore } = useHighScore(clubId, 'appearances', 0, false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile.name)
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)
  const editRef = useRef(null)
  const dialogRef = useRef(null)
  useEffect(() => {
    if (editing) { dialogRef.current?.showModal(); inputRef.current?.focus() }
    else dialogRef.current?.close()
  }, [editing])
  function closeEditor() { setEditing(false); dialogRef.current?.close(); requestAnimationFrame(() => editRef.current?.focus()) }
  function submit(event) {
    event.preventDefault()
    if (!draft.trim()) { setMessage('Skriv et navn først.'); return }
    saveProfile(draft)
    setMessage('Navnet er opdateret.')
    closeEditor()
  }
  return <main className="community-content profile-page" id="indhold">
    <CommunityHeader title="Din profil" subtitle="Din del af flokken." />
    <section className="premium-profile-card" aria-label="Spillerprofil">
      <div className="premium-profile-top"><span>SPILLERPROFIL</span><button type="button" className="profile-edit-trigger" ref={editRef} onClick={() => { setDraft(profile.name); setMessage(''); setEditing(true) }}><Icon name="edit" />Rediger profil</button></div>
      <div className="premium-profile-identity"><Avatar self /><div><h2>{profile.name}</h2><p>FCM Games-spiller</p></div></div>
    </section>
    <dialog ref={dialogRef} className="profile-editor-dialog" aria-labelledby="profile-editor-title" onCancel={closeEditor} onClose={closeEditor} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeEditor() } }}>
      <header><h2 id="profile-editor-title">Rediger profil</h2><button type="button" className="profile-editor-close" aria-label="Luk rediger profil" onClick={closeEditor}>×</button></header>
      {editing && <ProfilePhotoPicker />}
      <form className="profile-editor-name" onSubmit={submit}>
        <label htmlFor="profile-name">Rediger navn</label>
        <input id="profile-name" ref={inputRef} value={draft} maxLength={24} required autoComplete="nickname" onChange={event => setDraft(event.target.value)} />
        <p className="profile-editor-message" role="status">{message}</p>
        <div><button type="submit" className="profile-editor-save">Gem navn</button><button type="button" className="profile-editor-cancel" onClick={closeEditor}>Annuller</button></div>
      </form>
    </dialog>
    <p className="profile-save-status" role="status">{message}</p>
    {!persistent && <p className="local-storage-note">Browseren tillader ikke lokal lagring. Profil og statistik huskes kun, mens appen er åben.</p>}
    <section className="profile-record" aria-label="Din rekord i Flest kampe">
      <HighScoreMedal score={highScore} /><p>Din rekord i Flest kampe</p>
    </section>
    <LineupStatistics />
    <section aria-labelledby="mode-records-title">
      <h2 className="community-section-title" id="mode-records-title">Rekorder i flokken</h2>
      <ul className="profile-mode-records">{gameModes.filter(mode => mode.id !== 'lineup').map(mode => <ModeRecord key={mode.id} mode={mode} clubId={clubId} />)}</ul>
    </section>
  </main>
}
