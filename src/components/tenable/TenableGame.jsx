import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '../ThemeToggle'
import { challengeCatalogue, isPlayableChallenge } from '../../data/tenable/productionChallenges'
import { createTenableRound, guessTenable, tickTenable, tenableBoard } from '../../game/tenable'
import './Tenable.css'
const difficulties = [{id:'easy',label:'LET'},{id:'medium',label:'MELLEM'},{id:'hard',label:'SVÆR'}]
const challenges = challengeCatalogue
const cutoff = 'Pr. 30. oktober 2026'
const challengeType = type => type === 'any10' ? 'FIND 10' : type === 'top10' ? 'TOP 10' : 'SENESTE 10'
const clock = seconds => `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`
export default function TenableGame() {
  const [round,setRound] = useState(null)
  const [input,setInput] = useState('')
  const [keyboardInset,setKeyboardInset] = useState(0)
  const title = useRef(null), field = useRef(null)
  const playing = round?.status === 'playing'
  const won = round?.status === 'won'
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
    {!won && <div className="tenable-heading"><p className="tenable-eyebrow">10 SVAR · 3 LIV · 60 SEK. PR. SVAR</p><h1 ref={title} tabIndex={-1}>FCM Tenable</h1></div>}
    {!round ? <>
      <div className="tenable-selection">
        {difficulties.map(d => <section key={d.id} className={`tenable-challenge-section tenable-level-${d.id}`} aria-labelledby={`tenable-section-${d.id}`}>
          <h2 id={`tenable-section-${d.id}`}><span>{d.label}</span><svg className="tenable-level-icon" viewBox="0 0 44 28" aria-hidden="true" focusable="false">{[0,1,2].map(level => <rect key={level} className={level <= difficulties.indexOf(d) ? 'is-active' : ''} x={level*14+2} y={18-level*7} width="9" height={8+level*7} rx="2" />)}</svg></h2>
          <div className="tenable-choices">
            {challenges.filter(c => c.difficulty === d.id).map(c => <button key={c.id} type="button" className="tenable-choice" disabled={!isPlayableChallenge(c)} onClick={() => start(c)}>
              <small>{challengeType(c.type)}</small>
              <strong>{c.title}</strong>
              {!isPlayableChallenge(c) && <span className="tenable-pending">Afventer verificering</span>}
              <b aria-hidden="true">{isPlayableChallenge(c) ? '→' : '–'}</b>
            </button>)}
          </div>
        </section>)}
      </div>
      <p className="tenable-note">Historiske FCM-udfordringer. Udfordringer, som afventer verificering, åbner først, når facit er dokumenteret. Resultater gemmes ikke i statistik, medaljer eller leaderboard.</p>
    </> : <>
      <section className={`tenable-board${won ? ' tenable-board-won' : ''}`} aria-label="Udfordring">
        {!won && <>
        <p className="tenable-eyebrow">{round.challenge.type === 'any10' ? 'FIND 10 · VALGFRI RÆKKEFØLGE' : round.challenge.type === 'top10' ? 'TOP 10 · RANGORDNET':'SENESTE 10 · NYESTE FØRST'}</p>
        <h2>{round.challenge.title}</h2><p className="tenable-description">{round.challenge.description}</p>
        <p className="tenable-cutoff">{cutoff}</p>
        <p className="tenable-rules">{round.challenge.rules}</p>
        <p className="tenable-rules">Du får 60 sekunder pr. svar. Hvert svar nulstiller tiden. Tidsudløb koster ét liv og starter nye 60 sekunder.</p>
        <div className="tenable-stats"><strong aria-label={`${round.found.length} af 10 korrekte`}>{round.found.length}<small>/10</small></strong><span className="tenable-hearts" role="img" aria-label={`${round.lives} af 3 liv tilbage`}>{[0,1,2].map(index => <svg key={index} className={`tenable-heart ${index < round.lives ? 'is-alive' : 'is-lost'}`} viewBox="0 0 32 32" aria-hidden="true"><path d="M16 28S3 20.1 3 11.7C3 7.4 5.9 4.5 9.8 4.5c2.7 0 4.9 1.5 6.2 3.6 1.3-2.1 3.5-3.6 6.2-3.6 3.9 0 6.8 2.9 6.8 7.2C29 20.1 16 28 16 28Z"/><path className="tenable-heart-shine" d="M7.5 11.7c0-1.8 1-3 2.6-3.2"/></svg>)}</span><strong role="timer" className={round.remaining <= 10 ? 'tenable-urgent':''} aria-label={`${round.remaining} sekunder tilbage`}>{clock(round.remaining)}</strong></div>
        <progress value={round.found.length} max="10" aria-label="Korrekte svar" />
        </>}
        {won && <>
          <div className="tenable-victory" role="status">
            <div className="tenable-victory-rays" aria-hidden="true" />
            <svg className="tenable-trophy" viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">
              <path d="M29 22H14v9c0 14 10 23 24 23m33-32h15v9c0 14-10 23-24 23" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              <path d="M27 16h46v20c0 17-10 28-23 28S27 53 27 36V16Z" fill="currentColor" />
              <path d="M33 21h9v17c0 7 1 11 4 15-9-3-13-11-13-20V21Z" fill="white" opacity=".26" />
              <path d="M50 64v15m-14 7h28m-24-7h20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <path d="m50 29 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" fill="var(--color-background)" opacity=".75" />
              <path d="m13 62 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Zm72-53 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" fill="currentColor" opacity=".7" />
            </svg>
            <h1 ref={title} tabIndex={-1}>TENABLE!</h1>
            <p>Du klarede alle 10!</p>
          </div>
          <dl className="tenable-victory-stats" aria-label="Din præstation">
            <div><dt>Korrekte</dt><dd>{round.found.length}<small>/10</small></dd></div>
            <div><dt>Tid tilbage</dt><dd>{clock(round.remaining)}</dd></div>
            <div><dt>Liv tilbage</dt><dd>{round.lives}<small>/3</small></dd></div>
          </dl>
        </>}
        {!playing && !won && <div className="tenable-result" role="status"><h2>{round.status === 'won' ? 'Alle 10! Du vandt!':'Game Over'}</h2><p>Slutresultat: <strong>{round.found.length}/10</strong> · {round.lives} liv · {clock(round.remaining)} tilbage</p><p>{round.feedback}</p><div className="tenable-actions"><button onClick={() => start(round.challenge)}>Prøv igen</button><button onClick={() => setRound(null)}>Ny udfordring</button></div><p>{round.challenge.type === 'any10' ? 'Se dine svar og eksempler nedenfor. Alle godkendte svar kan foldes ud.' : 'Hele listen er afsløret nedenfor.'}</p></div>}
        <ol className="tenable-answers">{tenableBoard(round).map(({answer,index},slot) => {
          const found = index !== null && round.found.includes(index)
          return <li key={slot} style={won ? { '--answer-order': slot } : undefined} className={found ? 'found':playing ? '':'revealed'}><span className="tenable-rank">{slot+1}</span><span>{answer && (found || !playing) ? <>{answer.label}{Number.isInteger(answer.playerCount) && <small className="tenable-answer-detail">{answer.playerCount} spillere</small>}{Number.isInteger(answer.appearances) && <small className="tenable-answer-detail">{answer.appearances} kampe</small>}{Number.isFinite(answer.feeDkk) && <small className="tenable-answer-detail">{answer.buyer} · {new Intl.NumberFormat('da-DK',{maximumFractionDigits:2}).format(answer.feeDkk/1000000)} mio. kr.</small>}</>:<span className="tenable-hidden">Skjult svar</span>}</span><span className="tenable-answer-status">{found ? '✓':!playing ? 'Ikke gættet':''}</span></li>
        })}</ol>
        {won && <div className="tenable-victory-actions"><button type="button" onClick={() => setRound(null)}>Spil en ny udfordring <span aria-hidden="true">→</span></button><button type="button" onClick={() => start(round.challenge)}>Prøv igen</button></div>}
        {!playing && !won && round.challenge.type === 'any10' && <details className="tenable-note"><summary>Alle {round.challenge.answers.length} godkendte svar</summary><ul>{round.challenge.answers.map((answer,index) => <li key={answer.label}>{answer.label}{round.found.includes(index) ? ' ✓' : ''}</li>)}</ul></details>}
        {playing && <form className="tenable-controls" style={{ bottom: keyboardInset }} onSubmit={submit}><p className={`tenable-feedback ${round.feedbackType}`} role="status" aria-live="polite">{round.feedback}</p><label htmlFor="tenable-answer">Dit svar</label><div><input ref={field} id="tenable-answer" value={input} onChange={e => setInput(e.target.value)} autoComplete="off" autoCapitalize="words" enterKeyHint="send" placeholder="Skriv et navn eller svar…" maxLength={120}/><button type="submit">Gæt →</button></div></form>}
        {!won && <p className="tenable-note">{round.challenge.source}</p>}
        {!won && round.challenge.answers.some(answer => answer.sources.length) && <details className="tenable-note tenable-sources"><summary>Kilder til facit</summary><ul>{[...new Set(round.challenge.answers.flatMap(answer => answer.sources))].map(source => <li key={source}><a href={source} target="_blank" rel="noreferrer">{source}</a></li>)}</ul></details>}
      </section>
    </>}
  </main>
}
