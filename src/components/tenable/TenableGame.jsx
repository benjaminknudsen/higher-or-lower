import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '../ThemeToggle'
import { practiceChallenges } from '../../data/tenable/practiceChallenges'
import { productionChallenges } from '../../data/tenable/productionChallenges'
import { createTenableRound, guessTenable, tickTenable } from '../../game/tenable'
import './Tenable.css'
const difficulties = [{id:'easy',label:'LET'},{id:'medium',label:'MELLEM'},{id:'hard',label:'SVÆR'}]
const challenges = [...productionChallenges,...practiceChallenges]
const clock = seconds => `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`
export default function TenableGame() {
  const [round,setRound] = useState(null)
  const [input,setInput] = useState('')
  const [keyboardInset,setKeyboardInset] = useState(0)
  const title = useRef(null), field = useRef(null)
  const playing = round?.status === 'playing'
  useEffect(() => {
    title.current?.focus({preventScroll:true})
    window.scrollTo({top:0,behavior:'instant'})
  },[round?.challenge.id,round?.status])
  useEffect(() => {
    if (!playing) return
    const update = () => setRound(previous => tickTenable(previous))
    const interval = window.setInterval(update,200)
    document.addEventListener('visibilitychange',update)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange',update) }
  },[playing])
  useEffect(() => {
    if (!playing) return
    const viewport = window.visualViewport
    const update = () => {
      const focused = document.activeElement === field.current
      setKeyboardInset(focused && viewport?.scale === 1
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0)
    }
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', update)
    }
  }, [playing])
  const start = challenge => { setInput(''); setRound(createTenableRound(challenge)) }
  const submit = event => {
    event.preventDefault()
    setRound(previous => guessTenable(previous,input))
    setInput('')
    field.current?.focus()
  }
  return <main className="tenable">
    <header className="tenable-nav"><a href="#forside" onClick={event => { if (round) { event.preventDefault(); setRound(null) } }}>← Tilbage</a><span>FCM Games</span><ThemeToggle /></header>
    <div className="tenable-heading"><p className="tenable-eyebrow">10 SVAR · 3 LIV · 5 MINUTTER</p><h1 ref={title} tabIndex={-1}>FCM Tenable</h1></div>
    {!round ? <>
      <div className="tenable-selection">
        {difficulties.map(d => <section key={d.id} className={`tenable-challenge-section tenable-level-${d.id}`} aria-labelledby={`tenable-section-${d.id}`}>
          <h2 id={`tenable-section-${d.id}`}>{d.label}</h2>
          <div className="tenable-choices">
            {challenges.filter(c => c.difficulty === d.id).map(c => <button key={c.id} type="button" className="tenable-choice" onClick={() => start(c)}>
              <small>{c.type === 'top10' ? 'TOP 10':'SENESTE 10'}</small>
              <strong>{c.title}</strong>
              <b aria-hidden="true">→</b>
            </button>)}
          </div>
        </section>)}
      </div>
      <p className="tenable-note">Øvelsesrunder med udvalgte fodboldbegreber. Resultater gemmes ikke i statistik, medaljer eller leaderboard.</p>
    </> : <>
      <section className="tenable-board" aria-label="Udfordring">
        <p className="tenable-eyebrow">{round.challenge.type === 'top10' ? 'TOP 10 · RANGORDNET':'SENESTE 10 · NYESTE FØRST'}</p>
        <h2>{round.challenge.title}</h2><p className="tenable-description">{round.challenge.description}</p>
        <div className="tenable-stats"><strong aria-label={`${round.found.length} af 10 korrekte`}>{round.found.length}<small>/10</small></strong><span className="tenable-hearts" role="img" aria-label={`${round.lives} af 3 liv tilbage`}>{[0,1,2].map(index => <svg key={index} className={`tenable-heart ${index < round.lives ? 'is-alive' : 'is-lost'}`} viewBox="0 0 32 32" aria-hidden="true"><path d="M16 28S3 20.1 3 11.7C3 7.4 5.9 4.5 9.8 4.5c2.7 0 4.9 1.5 6.2 3.6 1.3-2.1 3.5-3.6 6.2-3.6 3.9 0 6.8 2.9 6.8 7.2C29 20.1 16 28 16 28Z"/><path className="tenable-heart-shine" d="M7.5 11.7c0-1.8 1-3 2.6-3.2"/></svg>)}</span><strong role="timer" className={round.remaining <= 10 ? 'tenable-urgent':''} aria-label={`${round.remaining} sekunder tilbage`}>{clock(round.remaining)}</strong></div>
        <progress value={round.found.length} max="10" aria-label="Korrekte svar" />
        {!playing && <div className="tenable-result" role="status"><h2>{round.status === 'won' ? 'Alle 10! Du vandt!':'Game Over'}</h2><p>Slutresultat: <strong>{round.found.length}/10</strong> · {round.lives} liv · {clock(round.remaining)} tilbage</p><p>{round.feedback}</p><div className="tenable-actions"><button onClick={() => start(round.challenge)}>Prøv igen</button><button onClick={() => setRound(null)}>Ny udfordring</button></div><p>Hele listen er afsløret nedenfor.</p></div>}
        <ol className="tenable-answers">{round.challenge.answers.map((a,i) => {
          const found = round.found.includes(i)
          return <li key={i} className={found ? 'found':playing ? '':'revealed'}><span className="tenable-rank">{i+1}</span><span>{found || !playing ? a.label:<span className="tenable-hidden">Skjult svar</span>}</span><span className="tenable-answer-status">{found ? '✓':!playing ? 'Ikke gættet':''}</span></li>
        })}</ol>
        {playing && <form className="tenable-controls" style={{ bottom: keyboardInset }} onSubmit={submit}><p className={`tenable-feedback ${round.feedbackType}`} role="status" aria-live="polite">{round.feedback}</p><label htmlFor="tenable-answer">Dit svar</label><div><input ref={field} id="tenable-answer" value={input} onChange={e => setInput(e.target.value)} autoComplete="off" autoCapitalize="words" enterKeyHint="send" placeholder="Skriv et navn eller svar…" maxLength={120}/><button type="submit">Gæt →</button></div></form>}
        <p className="tenable-note">{round.challenge.source}</p>
      </section>
    </>}
  </main>
}
