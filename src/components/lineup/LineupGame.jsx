import ThemeToggle from '../ThemeToggle'
import { useCallback, useEffect, useRef, useState } from 'react'
import matches from '../../data/lineupMatches.json'
import { recordResult, createRound, selectMatch, tick, guess, buyHint, scoreRound, remaining, maskName, letterCount, emptyStore } from '../../game/lineup'
import Icon from '../Icon'
import { loadLineupStore, saveLineupStore, clearSavedLineupRound } from '../../services/lineupStorage'
import useAuthAccount from '../../hooks/useAuthAccount.js'
import { onlineGameResults } from '../../services/onlineGameResultsRuntime.js'
import { profilePhotoOwner } from '../../services/profilePhotoStore.js'
import { createLocalTopResults } from '../../services/localTopResults.js'
import './Lineup.css'

const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`
function MatchHeader({ match }) {
  return <div className="lineup-match"><h1>{match.home} <em>{match.score.join('–')}</em> {match.away}</h1><p>{new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(match.date))}</p><small>{match.competition}{match.resultNote && ` · ${match.resultNote}`}</small></div>
}
function Pitch({ round, onSelect, result = false }) {
  const rows = [1, ...round.match.formation.split('-').map(Number)]
  return <div className="lineup-pitch" style={{ '--lineup-rows': rows.length }} aria-label={`FCM's formation: ${round.match.formation}`}>
    <div className="pitch-lines" aria-hidden="true"><i /><b /><span /><span /></div>
    {[...rows.keys()].reverse().map(row => <div className="lineup-row" key={row} style={{ '--row-size': rows[row] }}>
      {round.match.players.filter(p => p.row === row).sort((a,b) => a.slot-b.slot).map(p => {
        const found = round.guessed.includes(p.id), shown = found || result
        return <button key={p.id} type="button" className={`lineup-player ${found ? 'found' : ''} ${result && !found ? 'revealed' : ''}`} disabled={shown} onClick={() => onSelect(p.id)} aria-label={shown ? `${p.name}, ${found ? 'gættet' : 'afsløret'}` : `${p.position}, position ${p.slot+1}, ${letterCount(p.name)} bogstaver. Åbn hint`}>
          <Icon name="shirt" /><span>{shown ? p.name : maskName(p.name)}</span>{round.hints.includes(p.id) && !shown && <small>#{p.shirtNumber}</small>}
        </button>
      })}
    </div>)}
    <span className="pitch-formation">{round.match.formation}</span>
  </div>
}
export default function LineupGame() {
  const account=useAuthAccount()
  const owner=profilePhotoOwner(account)
  return <LineupSession key={owner??'loading'} owner={owner}/>
}
function LineupSession({owner}) {
  const [store, setStore] = useState(()=>owner==='guest'?loadLineupStore():emptyStore())
  const current = useRef(store)
  const [now, setNow] = useState(Date.now)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [selected, setSelected] = useState(null)
  const [persistent, setPersistent] = useState(true)
  const [syncState,setSyncState]=useState({id:'',status:'idle',message:''})
  const inputRef = useRef(null), hintRef = useRef(null), focusOrigin = useRef(null)
  const round = store.round
  const playing = round?.status === 'playing'
  const ownerId=owner?.startsWith('user:')?owner.slice(5):null
  const syncResult=useCallback((result)=>{
    if(!ownerId)return
    setSyncState({id:result.id,status:'pending',message:'Synkroniserer resultat…'})
    const payload={gameType:'lineup',resultId:result.id,score:result.score,answers:11,correct:result.correct,hints:result.hints,errors:result.errors,isPerfect:result.status==='perfect'&&result.correct===11,durationMs:result.durationMs}
    void onlineGameResults.submit(ownerId,payload).then(response=>{
      if(current.current.results.some(item=>item.id===result.id)){
        setSyncState({id:result.id,status:response.ok?'synced':'pending',message:response.ok?'Resultatet er synkroniseret.':response.message})
      }
    }).catch(error=>setSyncState({id:result.id,status:'pending',message:error.message||'Resultatet kunne ikke gemmes til synkronisering.'}))
  },[ownerId])
  const commit=useCallback((next)=>{
    const previous=current.current
    current.current = next
    setPersistent(owner==='guest'?saveLineupStore(next):true)
    setStore(next)
    const completed=next.results.find(result=>!previous.results.some(old=>old.id===result.id))
    if(completed)syncResult(completed)
    if(completed&&owner==='guest'){
      try {
        createLocalTopResults(window.localStorage).record('lineup',{
          id:completed.id,score:completed.score,createdAt:new Date(completed.endedAt).toISOString(),
        })
      } catch(error) {
        setSyncState({id:completed.id,status:'pending',message:error.message||'Forsøget kunne ikke gemmes lokalt.'})
      }
    }
  },[owner,syncResult])
  useEffect(() => {
    function refresh() {
      const time = Date.now(); setNow(time)
      const old = current.current, r = old.round
      if (r) {
        const next = recordResult(old, tick(r,time))
        if (next.round !== r || next.results.length !== old.results.length) commit(next)
      }
    }
    clearSavedLineupRound()
    function discard() {
      const old = current.current
      if (old.round) commit({ ...old, round: null })
      setSelected(null); setInput(''); setFeedback(null); setNow(Date.now())
    }
    function visibility() {
      if (document.visibilityState === 'hidden') discard()
      else refresh()
    }
    function navigation() {
      if (window.location.hash !== '#spil/lineup') discard()
    }
    refresh()
    const interval = setInterval(refresh, 250)
    window.addEventListener('pageshow', refresh)
    window.addEventListener('pagehide', discard)
    window.addEventListener('hashchange', navigation)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearInterval(interval)
      window.removeEventListener('pageshow', refresh)
      window.removeEventListener('pagehide', discard)
      window.removeEventListener('hashchange', navigation)
      document.removeEventListener('visibilitychange', visibility)
      current.current = { ...current.current, round: null }
    }
  }, [commit])
  useEffect(() => {
    if (selected && playing) hintRef.current?.showModal()
    else hintRef.current?.close()
  }, [selected, playing])
  function start() {
    const old = current.current, pick = selectMatch(matches, old.played)
    if (!pick) { setFeedback({ text: 'Ingen verificerede kampe tilgængelige.', kind: 'wrong' }); return }
    const r = createRound(pick.match)
    setNow(r.startedAt); commit({ ...old, played: pick.played, round: r }); setSelected(null); setInput(''); setFeedback(null)
  }
  function submit(event) {
    event.preventDefault()
    const old = current.current
    if (!old.round) return
    const answer = guess(old.round, input)
    commit(recordResult(old,answer.round))
    if (answer.feedback) { setFeedback({ text: answer.feedback, kind: answer.kind }); setInput('') }
    inputRef.current?.focus({ preventScroll: true })
  }
  function closeHint() { setSelected(null); focusOrigin.current?.focus({ preventScroll: true }) }
  const player = round?.match.players.find(p => p.id === selected)
  const seconds = round ? remaining(round,now) : 180
  return <main className={`lineup-shell ${playing ? 'is-playing' : ''} ${round?.status === 'perfect' ? 'is-perfect' : ''}`}>
    <header className="lineup-top"><a href="#forside" aria-label="Tilbage til spilmenu"><Icon name="arrow" /></a><span>FCM <b>STARTOPSTILLINGEN</b></span><ThemeToggle /></header>
    {!persistent && <p className="lineup-warning" role="alert">Lokal lagring er blokeret. Rundens resultat kan ikke gemmes.</p>}
    {!round ? <section className="lineup-intro">
      <div className="lineup-intro-icon"><Icon name="pitch" /><span>11</span></div><p className="lineup-eyebrow">KAN DU HUSKE DE 11?</p>
      <h1>GÆT<br /><em>STARTOPSTILLINGEN</em></h1><p>Kan du huske, hvem der startede inde for FC Midtjylland?</p>
      <div className="lineup-rules"><div><strong>3 minutter</strong><span>Find alle 11 spillere, inden tiden løber ud.</span></div><div><strong>3 fejl</strong><span>Spillet slutter efter tre forkerte gæt.</span></div><div><strong>10 point pr. spiller</strong><span>Optjen point for hvert korrekt navn.</span></div></div>
      <button className="lineup-primary" onClick={start}>START SPILLET <Icon name="arrow" /></button><small>Historiske kampe · Hints koster 5 point</small>
    </section> : <>
      {!playing && <div className="lineup-result-heading"><p className="lineup-eyebrow">{round.status === 'perfect' ? 'ALLE 11 FUNDET' : round.status === 'time' ? 'TIDEN ER GÅET' : 'TRE FEJL'}</p><h2>{round.status === 'perfect' ? 'PERFEKT OPSTILLING!' : 'FÆRDIG!'}</h2></div>}
      <MatchHeader match={round.match} />
      <div className="lineup-status"><div className={seconds <= 30 && playing ? 'urgent' : ''}><small>{playing ? 'TID TILBAGE' : 'TID BRUGT'}</small><strong>{clock(playing ? seconds : Math.ceil((round.endedAt-round.startedAt)/1000))}</strong></div><div><small>FEJL</small><strong>{round.errors}<span>/3</span></strong></div><div><small>POINT</small><strong key={scoreRound(round)} className="lineup-score">{scoreRound(round)}</strong></div></div>
      <div className="lineup-progress"><span>{round.guessed.length} / 11 spillere fundet</span><span>{round.hints.length} hints brugt</span></div>
      <Pitch round={round} result={!playing} onSelect={id => { focusOrigin.current = document.activeElement; setSelected(id) }} />
      {playing ? <div className="lineup-input-area"><form onSubmit={submit}><label className="lineup-sr" htmlFor="lineup-name">Skriv navnet på en FCM-spiller...</label><input ref={inputRef} id="lineup-name" placeholder="Skriv navnet på en FCM-spiller..." value={input} onChange={e => setInput(e.target.value)} autoComplete="off" autoCorrect="off" spellCheck={false} autoCapitalize="words" enterKeyHint="send" maxLength={100} onFocus={e => e.currentTarget.scrollIntoView({ block: 'nearest' })} /><button type="submit" aria-label="Indsend gæt"><Icon name="arrow" /></button></form><p role="status" className={`lineup-feedback ${feedback?.kind || ''}`}>{feedback?.text || 'Skriv et navn · Tryk på en trøje for et hint'}</p></div> : <section className="lineup-results">
        <p><span className="guessed-key">● Selv gættet</span> <span>○ Afsløret efter runden</span></p>
        <ul>{round.match.players.map(p => <li key={p.id}><span className={round.guessed.includes(p.id) ? 'guessed-key' : ''}>{round.guessed.includes(p.id) ? '●' : '○'} {p.name}</span><small>{p.position}</small></li>)}</ul>
        {syncState.id===round.id&&<p role={syncState.status==='pending'?'alert':'status'}>{syncState.message}{syncState.status==='pending'&&<button type="button" onClick={()=>{const result=current.current.results.find(item=>item.id===round.id);if(result)syncResult(result)}}>Prøv igen</button>}</p>}
        <button className="lineup-primary" onClick={start}>NY TILFÆLDIG KAMP <Icon name="arrow" /></button><a className="lineup-secondary" href="#forside">TILBAGE TIL SPILMENU</a>
        <details><summary>Kilder til denne kamp</summary>{round.match.sources.map((source) => <a key={source} href={source} target="_blank" rel="noreferrer">{source.includes('skysports.com') ? 'Sky Sports · Kampens trøjenumre' : source.includes('fcm.dk') ? 'FCM · Kampdokumentation' : 'Kampoversigt · Formation og opstilling'}</a>)}<small>Positionerne er skematisk placeret inden for startformationen.</small></details>
      </section>}
      <dialog ref={hintRef} className="lineup-hint" tabIndex={-1} aria-labelledby="lineup-hint-title" autoFocus onCancel={closeHint} onClose={closeHint} onClick={e => { if (e.target === e.currentTarget) closeHint() }}>
        {player && <><button className="lineup-close" onClick={closeHint} aria-label="Luk hint">×</button><h2 id="lineup-hint-title">VIS HINT</h2>
          {round.hints.includes(player.id) ? <div className="lineup-number" role="status"><span>TRØJENUMMER</span><strong>{player.shirtNumber}</strong></div> : <><button className="lineup-primary" disabled={!player.shirtNumber || !player.numberSource || scoreRound(round)<5} onClick={() => { const old = current.current; commit(recordResult(old,buyHint(old.round,player.id))) }}>VIS TRØJENUMMER <span>−5 POINT</span></button>{(!player.shirtNumber || !player.numberSource || scoreRound(round)<5) && <small>{!player.shirtNumber || !player.numberSource ? 'Intet verificeret trøjenummer.' : 'Kræver 5 point.'}</small>}</>}
        </>}
      </dialog>
    </>}
  </main>
}
