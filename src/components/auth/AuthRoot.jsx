import { useEffect, useRef, useState } from 'react'
import { canonicalUsername } from '../../lib/accountPolicy.js'
import useAuthAccount from '../../hooks/useAuthAccount.js'
import { authAccount, authService } from '../../services/authAccount.js'
import { onlineGameResults } from '../../services/onlineGameResultsRuntime.js'
import GuestWelcome from './GuestWelcome'
import './Auth.css'

export default function AuthRoot({children}) {
  const processed=useRef(false)
  const [callbackReady,setCallbackReady]=useState(false)
  useEffect(()=>{
    const stop=authAccount.start()
    if(!processed.current){processed.current=true;void authAccount.callback(window.location,window.history).then(handled=>{if(handled&&!window.location.hash)window.location.hash='#profil';setCallbackReady(true)})}
    return stop
  },[])
  return <>{children}<PendingResultFlush/><GuestWelcome ready={callbackReady}/><AuthDialog /></>
}
function PendingResultFlush(){
  const account=useAuthAccount()
  useEffect(()=>{
    if(account.status!=='signed-in'||!account.userId)return
    let active=true
    const reportFailure=event=>{
      if(event.detail?.userId===account.userId)authAccount.setSyncNotice(event.detail.message||'Et resultat kunne ikke gemmes til synkronisering.')
    }
    const flushPending=()=>{
      onlineGameResults.flush(account.userId).then(result=>{
        if(active)authAccount.setSyncNotice(!result.ok&&result.pending?result.message:'')
      }).catch(error=>{if(active)authAccount.setSyncNotice(error.message||'Tidligere resultater kunne ikke synkroniseres.')})
    }
    window.addEventListener('fcm-online-result-error',reportFailure)
    window.addEventListener('online',flushPending)
    flushPending()
    return()=>{active=false;window.removeEventListener('fcm-online-result-error',reportFailure);window.removeEventListener('online',flushPending)}
  },[account.status,account.userId])
  return null
}
function AuthDialog(){
  const account=useAuthAccount(), dialog=useRef(null), lastFocus=useRef(null)
  useEffect(()=>{
    if(account.mode){lastFocus.current=document.activeElement;dialog.current?.showModal()}
    else if(dialog.current?.open){dialog.current.close();lastFocus.current?.focus?.()}
  },[account.mode])
  return <dialog ref={dialog} className="account-dialog" aria-labelledby="account-title" onCancel={()=>authAccount.close()} onClick={e=>{if(e.target===e.currentTarget){const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)authAccount.close()}}}>
    {account.mode&&<AuthForm key={account.mode} mode={account.mode} account={account} />}
  </dialog>
}
function AuthForm({mode,account}){
  const [busy,setBusy]=useState(false), [feedback,setFeedback]=useState(''), [error,setError]=useState('')
  const [remember,setRemember]=useState(true)
  const [usernameError,setUsernameError]=useState('')
  const locked=useRef(false), alive=useRef(true)
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
  const titles={login:'Log ind',signup:'Opret konto',reset:'Glemt adgangskode',password:'Ny adgangskode'}
  async function submit(event){
    event.preventDefault();if(locked.current)return
    locked.current=true;setBusy(true);setError('');setFeedback('')
    const data=Object.fromEntries(new FormData(event.currentTarget))
    if(mode==='password'&&data.password!==data.repeat){setError('Adgangskoderne er ikke ens.');locked.current=false;setBusy(false);return}
    let result
    if(mode==='login')result=await authService.signIn({...data,remember})
    if(mode==='signup')result=await authService.signUp(data)
    if(mode==='reset')result=await authService.requestPasswordReset(data.email)
    if(mode==='password')result=await authService.updatePassword(data.password)
    if(!alive.current)return
    locked.current=false;setBusy(false)
    if(!result.ok){setError(result.message);return}
    if(mode==='login'||(mode==='signup'&&result.data?.session)){authAccount.close();return}
    if(mode==='signup')setFeedback('Tjek din indbakke for en bekræftelsesmail. Hvis du allerede har en konto, kan du logge ind eller nulstille adgangskoden.')
    if(mode==='reset')setFeedback('Hvis adressen har en konto, modtager du en e-mail med et nulstillingslink. Åbn linket i samme browser.')
    if(mode==='password'){const logout=await authService.signOut();if(!logout.ok){setFeedback('Adgangskoden er ændret.');setError(logout.message);return}authAccount.finishRecovery()}
  }
  return <>
    <header><h2 id="account-title">{titles[mode]}</h2><button type="button" className="account-close" aria-label="Luk" onClick={()=>authAccount.close()}>×</button></header>
    <form onSubmit={submit} className="account-form">
      {mode==='signup'&&<label>Brugernavn<input name="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" aria-describedby="account-username-help" aria-invalid={!!usernameError} onChange={e=>{e.target.setCustomValidity('');if(usernameError)setUsernameError('')}} onBlur={e=>{setUsernameError(e.target.value&&!canonicalUsername(e.target.value)?'Brug 3–24 bogstaver (a–z), tal eller underscore.':'')}} onInvalid={e=>{const message='Brug 3–24 bogstaver (a–z), tal eller underscore.';e.target.setCustomValidity(message);setUsernameError(message)}} autoComplete="username" autoCapitalize="none" spellCheck={false}/><small id="account-username-help">Vælg dit brugernavn – det bliver vist på leaderboardet.</small>{usernameError&&<small className="account-error" role="alert">{usernameError}</small>}</label>}
      {mode!=='password'&&<label>E-mail<input name="email" type="email" required autoComplete="email" autoCapitalize="none" inputMode="email"/><small>Din e-mail vises ikke offentligt.</small></label>}
      {mode!=='reset'&&<PasswordField label="Adgangskode" name="password" autoComplete={mode==='login'?'current-password':'new-password'} />}
      {mode==='login'&&<div className="account-remember">
        <label><input name="remember" type="checkbox" checked={remember} disabled={busy} onChange={event=>setRemember(event.target.checked)} aria-describedby="account-session-help" />Forbliv logget ind</label>
        <p id="account-session-help" className="account-session-note">{remember ? 'Husk login på denne enhed, også når du åbner browseren eller appen igen.' : 'Login gemmes kun i denne browsersession. Nogle browsere og apps kan gendanne sessionen efter lukning. Brug Log ud for at afslutte login sikkert.'}</p>
      </div>}
      {mode==='password'&&<PasswordField label="Gentag adgangskode" name="repeat" autoComplete="new-password" />}
      {(error||account.error)&&<p role="alert" className="account-error">{error||account.error}</p>}
      {(feedback||account.notice)&&<p role="status">{feedback||account.notice}</p>}
      <button type="submit" className="account-primary" disabled={busy}>{busy?'Vent…':titles[mode]}</button>
    </form>
    {mode==='login'&&<div className="account-links account-links-login"><button onClick={()=>authAccount.open('reset')}>Glemt adgangskode?</button><button onClick={()=>authAccount.open('signup')}>Opret konto</button></div>}
    {(mode==='signup'||mode==='reset')&&<div className="account-links"><button onClick={()=>authAccount.open('login')}>Tilbage til login</button></div>}
  </>
}

function PasswordField({label,name,autoComplete}){
  const [visible,setVisible]=useState(false)
  const id=`account-${name}`
  return <div className="account-password-field"><label htmlFor={id}>{label}</label><div className="account-password-input"><input id={id} name={name} type={visible?'text':'password'} required autoComplete={autoComplete} autoCapitalize="none" spellCheck={false}/><button type="button" aria-controls={id} aria-pressed={visible} aria-label={`${visible?'Skjul':'Vis'} ${label.toLowerCase()}`} onClick={()=>setVisible(value=>!value)}>{visible?'Skjul':'Vis'}</button></div></div>
}
