import useAuthAccount from '../../hooks/useAuthAccount.js'
import { authAccount, authService } from '../../services/authAccount.js'
import { onlineGameResults } from '../../services/onlineGameResultsRuntime.js'
import usePendingOnlineResults from '../../hooks/usePendingOnlineResults.js'
import LineupStatistics from '../lineup/LineupStatistics'
import { useEffect, useRef, useState } from 'react'
import useLocalAccount from '../../hooks/useLocalAccount'
import useHighScore from '../../hooks/useHighScore'
import MedalSection from './MedalSection'
import Icon from '../Icon'
import ProfilePhotoPicker from './ProfilePhotoPicker'
import CommunityHeader from './CommunityHeader'
import TopThreeResults from './TopThreeResults'
import Avatar from './Avatar'
import { onlinePlatform } from '../../services/onlinePlatformRuntime.js'
import './ProfileCard.css'

function ModeRecord({ clubId, mode }) {
  const { highScore } = useHighScore(clubId, mode.id, 0, false)
  return <li className="profile-mode-record">
    <Icon name={mode.icon} /><span>{mode.title}</span>
    {mode.available ? <strong>{highScore}<small> i træk</small></strong> : <span className="record-coming"><Icon name="lock" />Kommer snart</span>}
  </li>
}

export default function ProfilePage({ clubId, gameModes, userId = null }) {
  return userId !== null ? <PublicProfilePage userId={userId} gameModes={gameModes} /> : <OwnProfilePage clubId={clubId} gameModes={gameModes} />
}

function OwnProfilePage({ clubId, gameModes }) {
  const { profile, saveProfile, persistent } = useLocalAccount(clubId)
  const account=useAuthAccount()
  const signedIn=account.status==='signed-in'
  const guest=account.status==='guest'
  const authLoading=account.status==='loading'
  const ownerKey=signedIn?`user:${account.userId}`:guest?'guest':'loading'
  const pendingResults=usePendingOnlineResults(signedIn?account.userId:null)
  const name=signedIn ? (account.profile?.username || (account.profileError?'Profil utilgængelig':'Henter profil…')) : authLoading?'Kontrollerer login…':profile.name
  const [saving,setSaving]=useState(false)
  const { highScore, loading:scoreLoading, error:scoreError } = useHighScore(clubId, 'appearances', 0, false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile.name)
  const [draftOwner,setDraftOwner]=useState(ownerKey)
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)
  const editRef = useRef(null)
  const dialogRef = useRef(null)
  const previousOwner=useRef(ownerKey)
  useEffect(()=>{
    if(previousOwner.current===ownerKey)return
    previousOwner.current=ownerKey
    setEditing(false)
    dialogRef.current?.close()
    setDraft(name)
    setDraftOwner(ownerKey)
    setMessage('')
  },[ownerKey,name])
  useEffect(() => {
    if (editing) { dialogRef.current?.showModal(); inputRef.current?.focus() }
    else dialogRef.current?.close()
  }, [editing])
  function closeEditor() { setEditing(false); dialogRef.current?.close(); requestAnimationFrame(() => editRef.current?.focus()) }
  async function submit(event) {
    event.preventDefault()
    if(draftOwner!==ownerKey)return
    if (!draft.trim()) { setMessage('Skriv et navn først.'); return }
    if(saving)return
    setSaving(true)
    if(signedIn){const result=await authAccount.changeUsername(draft);setSaving(false);if(!result.ok){setMessage(result.message);return}}
    else {saveProfile(draft);setSaving(false)}
    setMessage('Navnet er opdateret.')
    closeEditor()
  }
  async function retryPendingResults() {
    try {
      const result=await onlineGameResults.flush(account.userId)
      authAccount.setSyncNotice(!result.ok&&result.pending?result.message:'')
    } catch(error) { authAccount.setSyncNotice(error.message||'Resultaterne kunne ikke synkroniseres.') }
  }
  return <main className="community-content profile-page" id="indhold">
    <CommunityHeader title="Din profil" subtitle="Din del af flokken." />
    <section className="premium-profile-card" aria-label="Spillerprofil">
      <div className="profile-neon-backdrop" aria-hidden="true" />
      <div className="premium-profile-top"><span>SPILLERPROFIL</span><button type="button" className="profile-edit-trigger" disabled={saving||authLoading} ref={editRef} onClick={() => { setDraft(name);setDraftOwner(ownerKey);setMessage('');setEditing(true) }}><Icon name="edit" />Rediger profil</button></div>
      <div className="premium-profile-identity"><ProfilePhotoPicker variant="avatar" onFeedback={setMessage} /><div><h2>{name}</h2><p>{signedIn?'Logget ind · FCM Games-spiller':account.status==='loading'?'Kontrollerer login…':'Gæst · FCM Games-spiller'}</p></div></div>
      <div className="premium-profile-footer">
        <div className="account-actions">{signedIn ? <button className="account-secondary" disabled={saving} onClick={async()=>{setSaving(true);const result=await authService.signOut();setSaving(false);if(!result.ok)setMessage(result.message)}}>Log ud</button> : authLoading?<p role="status">Kontrollerer login…</p>:guest?<><button className="account-primary" onClick={()=>authAccount.open('signup')}>Opret konto</button><button className="account-secondary" onClick={()=>authAccount.open('login')}>Log ind</button></>:null}</div>
        <p className="account-note premium-profile-note">{signedIn?'Kontostatistik og medaljer synkroniseres mellem enheder.':guest? 'Lokale gæsteresultater på denne enhed. De overføres ikke automatisk til en konto.':'Kontrollerer login, før profilstatistik vises.'}</p>
      </div>
      {account.profileError&&<p className="account-note" role="status">{account.profileError} <button className="account-secondary" onClick={()=>authAccount.retryProfile()}>Prøv igen</button></p>}
    </section>
    {signedIn&&(account.syncNotice||pendingResults!==0)&&<p className="account-note" role="alert">{pendingResults<0?'Den lokale kø med resultater kunne ikke læses.':account.syncNotice||`${pendingResults} resultat(er) afventer synkronisering.`} <button type="button" className="account-secondary" onClick={retryPendingResults}>Prøv igen</button></p>}
    <dialog ref={dialogRef} className="profile-editor-dialog" aria-labelledby="profile-editor-title" onCancel={closeEditor} onClose={closeEditor} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeEditor() } }}>
      <header><h2 id="profile-editor-title">Rediger profil</h2><button type="button" className="profile-editor-close" aria-label="Luk rediger profil" onClick={closeEditor}>×</button></header>
      {editing && <ProfilePhotoPicker />}
      <p className="account-note">{signedIn?'Profilbilledet synkroniseres med din konto via Supabase Storage.':authLoading?'Kontrollerer profilejerskab…':'Profilbilledet gemmes kun i denne browser på denne enhed.'}</p>
      <form className="profile-editor-name" onSubmit={submit}>
        <label htmlFor="profile-name">{signedIn?'Offentligt brugernavn':'Rediger navn'}</label>
        <input id="profile-name" ref={inputRef} disabled={signedIn&&!account.profile||draftOwner!==ownerKey} value={draftOwner===ownerKey?draft:name} maxLength={24} required autoComplete="nickname" onChange={event => setDraft(event.target.value)} />
        <p className="profile-editor-message" role="status">{message}</p>
        <div><button type="submit" disabled={saving||(signedIn&&!account.profile)||draftOwner!==ownerKey} className="profile-editor-save">{saving?'Gemmer…':'Gem navn'}</button><button type="button" className="profile-editor-cancel" onClick={closeEditor}>Annuller</button></div>
      </form>
    </dialog>
    <p className="profile-save-status" role="status">{message}</p>
    {guest&&!persistent && <p className="local-storage-note">Browseren tillader ikke lokal lagring. Profil og statistik huskes kun, mens appen er åben.</p>}
    <MedalSection score={highScore} loading={authLoading||scoreLoading} loadingMessage={authLoading?'Kontrollerer login…':'Henter kontoens rekord…'} error={scoreError} />
    <TopThreeResults userId={signedIn ? account.userId : null} isGuest={guest} identityLoading={authLoading} />
    <LineupStatistics />
    <section aria-labelledby="mode-records-title">
      <h2 className="community-section-title" id="mode-records-title">Rekorder</h2>
      <ul className="profile-mode-records">{gameModes.filter(mode => mode.available && mode.id !== 'lineup').map(mode => <ModeRecord key={mode.id} mode={mode} clubId={clubId} />)}</ul>
    </section>
  </main>
}

function PublicProfilePage({ userId, gameModes }) {
  const { profile, stats, attempts, loading, error } = usePublicProfile(userId)
  const name = profile?.username
  const appearances = stats?.appearances?.best_score ?? 0
  return <main className="community-content profile-page public-profile-page" id="indhold">
    <a className="profile-back-link" href="#leaderboard">← <span>Tilbage til leaderboard</span></a>
    <CommunityHeader title="Spillerprofil" subtitle="Offentlig profil på FCM Games." />
    {loading ? <p role="status">Henter spillerens profil…</p> : error ? <p role="alert">{error}</p> : !profile ? <p role="status">Profilen findes ikke eller er ikke offentlig.</p> : <>
      <section className="premium-profile-card" aria-label="Offentlig spillerprofil">
        <div className="profile-neon-backdrop" aria-hidden="true" />
        <div className="premium-profile-top"><span>SPILLERPROFIL</span></div>
        <div className="premium-profile-identity"><Avatar avatarPath={profile.avatar_path} /><div><h2>{name}</h2><p>FCM Games-spiller</p></div></div>
        <div className="premium-profile-footer"><p className="account-note premium-profile-note">Offentlig statistik fra spillerens FCM Games-konto.</p></div>
      </section>
      <MedalSection score={appearances} publicProfile />
      <TopThreeResults publicResults={attempts} />
      <LineupStatistics publicStats={stats.lineup} />
      <section aria-labelledby="mode-records-title">
        <h2 className="community-section-title" id="mode-records-title">Rekorder</h2>
        <ul className="profile-mode-records">{gameModes.filter(mode => mode.available && mode.id !== 'lineup').map(mode => <PublicModeRecord key={mode.id} mode={mode} score={stats[mode.id]?.best_score ?? 0} />)}</ul>
      </section>
    </>}
  </main>
}

function PublicModeRecord({ mode, score }) {
  return <li className="profile-mode-record">
    <Icon name={mode.icon} /><span>{mode.title}</span>
    <strong>{score}<small> i træk</small></strong>
  </li>
}

function usePublicProfile(userId) {
  const [result, setResult] = useState({ key: '', profile: null, stats: {}, attempts: null, loading: true, error: '' })
  useEffect(() => {
    let current = true
    onlinePlatform.getPublicProfile(userId).then(profile => {
      if (current) setResult({
        key: userId, profile: profile?.profile ?? null, stats: profile?.stats ?? {},
        attempts: profile?.attempts ?? null, loading: false, error: '',
      })
    }).catch(error => {
      if (current) setResult({ key: userId, profile: null, stats: {}, attempts: null, loading: false, error: error.message })
    })
    return () => { current = false }
  }, [userId])
  if (result.key !== userId) return { profile: null, stats: {}, attempts: null, loading: true, error: '' }
  return result
}
