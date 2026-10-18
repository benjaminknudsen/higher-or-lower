import { useEffect, useReducer, useRef, useState } from 'react'
import { createGame, gameReducer } from '../../game/engine'
import { scheduleNextRound } from '../../game/roundTiming'
import { assignSilhouettes } from '../../game/silhouettes'
import { celebrationForScore, milestoneForScore } from '../../game/celebration'
import useHighScore from '../../hooks/useHighScore'
import { localAccountStore } from '../../services/localAccount'
import PlayerCard from './PlayerCard'
import GuessControls from './GuessControls'
import GameResult from './GameResult'
import AnswerFeedback from './AnswerFeedback'
import './Game.css'
import './ResponsiveGameplay.css'
import './ShadowPlayers.css'
import './CorrectAnswer.css'

// Production passes only getVerifiedPlayers output. Tests can mount isolated fixtures.
export default function GameSession({ club, mode, players, dataNotice, testData = false, onRestart }) {
  const [state, dispatch] = useReducer(gameReducer, { players, statisticKey: mode.statisticKey }, createGame)
  const [silhouettes] = useState(() => assignSilhouettes(state.deck))
  const celebration = celebrationForScore(state.score)
  const milestone = milestoneForScore(state.score)
  const headingRef = useRef(null)
  const controlsRef = useRef(null)
  const previousPhase = useRef(state.phase)
  const statisticsSession = useRef(null)
  const finished = ['over', 'complete', 'unavailable'].includes(state.phase)
  const revealed = state.phase === 'revealed'
  const first = state.deck[state.index - 1]
  const second = state.deck[state.index]
  const tied = revealed && first.stats[mode.statisticKey] === second.stats[mode.statisticKey]
  const record = useHighScore(club.id, mode.id, state.score, state.phase !== 'unavailable')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (finished) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      headingRef.current?.focus({ preventScroll: true })
    } else if (previousPhase.current === 'revealed' && state.phase === 'asking') {
      controlsRef.current?.querySelector('button')?.focus({ preventScroll: true })
    }
    previousPhase.current = state.phase
  }, [finished, state.phase])

  useEffect(() => scheduleNextRound({
    phase: state.phase,
    questionId: state.index,
    correct: state.correct,
    tied,
    onAdvance: (questionId) => dispatch({ type: 'continue', questionId }),
  }), [state.phase, state.index, state.correct, tied])

  const handleGuess = (direction) => {
    const action = { type: 'guess', direction, questionId: state.index }
    const next = gameReducer(state, action)
    if (next !== state && !testData) {
      statisticsSession.current ??= crypto.randomUUID()
      localAccountStore.recordAnswer({ sessionId: statisticsSession.current, clubId: club.id, modeId: mode.id, questionId: state.index, correct: next.correct })
    }
    if (next !== state && next.correct) record.saveScore(next.score)
    dispatch(action)
  }

  return <main className={`game-shell ${finished ? 'game-finished' : 'game-playing'} ${revealed ? state.correct ? 'round-positive' : 'round-negative' : ''}`} data-celebration={celebration.level} id="indhold" ref={headingRef} tabIndex={-1} aria-label={`${mode.title} · Higher or Lower`}>
    <h1 className="game-sr-only">{mode.title}</h1>
    <header className="game-header">
      <a className="game-back" href="#spiltilstande" aria-label="Tilbage til forsiden"><span aria-hidden="true">←</span></a>
      <div className="score-display" aria-label={`Score: ${state.score} rigtige i træk`}><span>Score</span><strong className={revealed && state.correct ? 'score-pop' : ''} key={state.score}>{state.score}</strong></div>
      <div className="header-best" aria-label={`Personlig rekord: ${record.highScore}`}><span aria-hidden="true">★</span> Rekord <strong>{record.highScore}</strong></div>
      {testData && <span className="game-test-badge">Testdata</span>}
    </header>
    <p className="game-sr-only">{dataNotice}</p>
    {finished ? <div className="game-heading">
      <GameResult state={state} club={club} mode={mode} record={record} testData={testData} onRestart={onRestart} />
    </div> : <>
      <p className="player-pick-prompt">Flere eller færre {mode.unit}?</p>
      <div className="player-comparison">
        <PlayerCard key={`first-${first.id}`} player={first} mode={mode} silhouetteSrc={silhouettes[first.id]} />
        <div className="game-versus" aria-hidden="true">vs</div>
        <PlayerCard key={`second-${second.id}`} player={second} mode={mode} silhouetteSrc={silhouettes[second.id]} challenger hidden={!revealed} correct={revealed && state.correct} particleCount={celebration.particles} />
      </div>
      <footer className="answer-dock direct-answer-dock" ref={controlsRef}>
        <AnswerFeedback state={state} unit={mode.unit} newRecord={record.isNewRecord} compact />
        <GuessControls playerName={second.name} unit={mode.unit} locked={state.phase !== 'asking'} guess={state.guess} onGuess={handleGuess} />
      </footer>
      {revealed && state.correct && <div className="streak-impact" data-milestone={milestone ? state.score : undefined} aria-hidden="true">
        <span className="streak-impact-wave" />
        <span className="streak-impact-wave streak-impact-wave-second" />
        {milestone && <strong className="streak-impact-title">{milestone.title}</strong>}
        {Array.from({ length: milestone?.sparks ?? 0 }, (_, i) => <i className="milestone-spark" key={i} style={{
          '--spark-x': `${Math.cos(i * 2.39996) * (i % 2 ? 48 : 35)}vw`,
          '--spark-y': `${Math.sin(i * 2.39996) * (i % 2 ? 48 : 35)}dvh`,
          '--spark-angle': `${i * 47}deg`,
          '--spark-delay': `${i % 4 * 30}ms`,
        }} />)}
      </div>}
    </>}
  </main>
}
