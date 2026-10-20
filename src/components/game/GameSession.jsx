import ThemeToggle from '../ThemeToggle'
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
import useAuthAccount from '../../hooks/useAuthAccount.js'
import useOnlineResultSync from '../../hooks/useOnlineResultSync.js'
import { onlineGameResults } from '../../services/onlineGameResultsRuntime.js'
import { reportOnlineResultError } from '../../services/onlineGameResults.js'
import { createLocalTopResults } from '../../services/localTopResults.js'
import './Game.css'
import './ResponsiveGameplay.css'
import './ShadowPlayers.css'
import './CorrectAnswer.css'

// Production passes only getVerifiedPlayers output. Tests can mount isolated fixtures.
export default function GameSession({ club, mode, players, dataNotice, testData = false, onRestart }) {
  const [state, dispatch] = useReducer(gameReducer, { players, statisticKey: mode.statisticKey }, createGame)
  const account=useAuthAccount()
  const [silhouettes] = useState(() => assignSilhouettes(state.deck))
  const celebration = celebrationForScore(state.score)
  const milestone = milestoneForScore(state.score)
  const headingRef = useRef(null)
  const controlsRef = useRef(null)
  const previousPhase = useRef(state.phase)
  const statisticsSession = useRef(null)
  const statisticsOwner = useRef(null)
  const statisticsWasGuest = useRef(false)
  const latestGame=useRef(null)
  const [onlineResult,setOnlineResult]=useState(null)
  const [guestResultError,setGuestResultError]=useState('')
  const finished = ['over', 'complete', 'unavailable'].includes(state.phase)
  const revealed = state.phase === 'revealed'
  const first = state.deck[state.index - 1]
  const second = state.deck[state.index]
  const tied = revealed && first.stats[mode.statisticKey] === second.stats[mode.statisticKey]
  const record = useHighScore(club.id, mode.id, state.score, state.phase !== 'unavailable')
  const resultSync=useOnlineResultSync(onlineResult?.userId??null,onlineResult?.result??null)

  useEffect(()=>{latestGame.current={state,modeId:mode.id,testData}},[state,mode.id,testData])
  useEffect(()=>()=> {
    const current=latestGame.current
    const resultId=statisticsSession.current,userId=statisticsOwner.current
    if(!current||current.testData||!resultId||current.state.phase==='unavailable')return
    const game=current.state
    const answers=game.phase==='asking'?game.index-1:game.index
    if(answers<1)return
    if(userId){
      void onlineGameResults.submit(userId,{
        gameType:current.modeId,resultId,score:game.score,answers,correct:game.score,hints:null,errors:null,isPerfect:false,durationMs:0,
      }).catch(error=>reportOnlineResultError(userId,error.message||'Resultatet kunne ikke gemmes til synkronisering.'))
    }else if(statisticsWasGuest.current){
      try {
        createLocalTopResults(window.localStorage).record(current.modeId,{id:resultId,score:game.score,createdAt:new Date().toISOString()})
      } catch(error) {
        if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('fcm-guest-top-results-error',{detail:{message:error.message}}))
      }
    }
  },[])

  useEffect(()=>{
    if(!finished||testData||!statisticsSession.current||!['over','complete'].includes(state.phase))return
    if(statisticsWasGuest.current){
      void Promise.resolve().then(() => {
        createLocalTopResults(window.localStorage).record(mode.id,{
          id:statisticsSession.current,score:state.score,createdAt:new Date().toISOString(),
        })
      }).catch(error => {
        setGuestResultError(error.message||'Forsøget kunne ikke gemmes lokalt.')
      })
    }
    setOnlineResult(previous=>previous?.result?.resultId===statisticsSession.current?previous:{
      userId:statisticsOwner.current,
      result:{gameType:mode.id,resultId:statisticsSession.current,score:state.score,answers:state.index,correct:state.score,hints:null,errors:null,isPerfect:false,durationMs:0},
    })
  },[finished,testData,state.phase,state.score,state.index,mode.id])

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
      if(!statisticsSession.current){
        statisticsSession.current=crypto.randomUUID()
        statisticsOwner.current=account.status==='signed-in'?account.userId:null
        statisticsWasGuest.current=account.status==='guest'
      }
      if(account.status==='guest')localAccountStore.recordAnswer({ sessionId: statisticsSession.current, clubId: club.id, modeId: mode.id, questionId: state.index, correct: next.correct })
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
      {testData && <span className="game-test-badge">Testdata</span>}<ThemeToggle />
    </header>
    <p className="game-sr-only">{dataNotice}</p>
    {finished ? <div className="game-heading">
      <GameResult state={state} club={club} mode={mode} record={record} resultSync={resultSync} guestResultError={guestResultError} testData={testData} onRestart={onRestart} />
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
