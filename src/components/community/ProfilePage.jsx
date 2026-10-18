import { useEffect, useRef, useState } from 'react'
import useLocalAccount from '../../hooks/useLocalAccount'
import useHighScore from '../../hooks/useHighScore'
import HighScoreMedal from '../HighScoreMedal'
import Icon from '../Icon'
import Avatar from './Avatar'
import CommunityHeader from './CommunityHeader'

function ModeRecord({ clubId, mode }) {
  const { highScore } = useHighScore(clubId, mode.id, 0, false)
  return <li className="profile-mode-record">
    <Icon name={mode.icon} /><span>{mode.title}</span>
    {mode.available ? <strong>{highScore}<small> i træk</small></strong> : <span className="record-coming"><Icon name="lock" />Kommer snart</span>}
  </li>
}

export default function ProfilePage({ clubId, gameModes }) {
  const { profile, statistics, saveProfile, persistent } = useLocalAccount(clubId)
  const { highScore } = useHighScore(clubId, 'appearances', 0, false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile.name)
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)
  const editRef = useRef(null)
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  function closeEditor() { setEditing(false); requestAnimationFrame(() => editRef.current?.focus()) }
  function submit(event) {
    event.preventDefault()
    if (!draft.trim()) { setMessage('Skriv et navn først.'); return }
    saveProfile(draft)
    setMessage('Navnet er opdateret.')
    closeEditor()
  }
  return <main className="community-content profile-page" id="indhold">
    <CommunityHeader title="Din profil" subtitle="Din del af flokken." />
    <section className="profile-identity" aria-label="Profilnavn">
      <Avatar self />
      {editing ? <form className="profile-name-form" onSubmit={submit}>
        <label htmlFor="profile-name">Dit navn</label>
        <input id="profile-name" ref={inputRef} value={draft} maxLength={24} required autoComplete="nickname" onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') closeEditor() }} />
        <div><button type="submit">Gem navn</button><button type="button" onClick={closeEditor}>Annuller</button></div>
      </form> : <div className="profile-name"><h2>{profile.name}</h2><button type="button" ref={editRef} onClick={() => { setDraft(profile.name); setMessage(''); setEditing(true) }}><Icon name="edit" />Rediger navn</button></div>}
    </section>
    <p className="profile-save-status" role="status">{message}</p>
    {!persistent && <p className="local-storage-note">Browseren tillader ikke lokal lagring. Profil og statistik huskes kun, mens appen er åben.</p>}
    <section className="profile-record" aria-label="Din rekord i Flest kampe">
      <HighScoreMedal score={highScore} /><p>Din rekord i Flest kampe</p>
    </section>
    <section aria-labelledby="profile-statistics-title">
      <h2 className="community-section-title" id="profile-statistics-title">Din formkurve</h2>
      <div className="profile-statistics">
        <div><strong>{statistics.gamesPlayed}</strong><span>Spillede runder</span></div>
        <div><strong>{statistics.correct}</strong><span>Korrekte svar</span></div>
        <div><strong>{statistics.accuracy}<small>%</small></strong><span>Træfsikkerhed</span></div>
      </div>
      <p className="statistics-note">Tælles fra nu. En runde tæller, når du har svaret mindst én gang. Træfsikkerhed er korrekte svar ud af alle dine svar.</p>
    </section>
    <section aria-labelledby="mode-records-title">
      <h2 className="community-section-title" id="mode-records-title">Rekorder i flokken</h2>
      <ul className="profile-mode-records">{gameModes.map(mode => <ModeRecord key={mode.id} mode={mode} clubId={clubId} />)}</ul>
    </section>
  </main>
}
