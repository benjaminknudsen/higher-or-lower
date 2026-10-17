import Icon from '../Icon'
import { resultMessage } from '../../game/feedback'
import ShareResult from './ShareResult'

export default function GameResult({ state, club, mode, record, testData, onRestart }) {
  const completed = state.phase === 'complete'
  const unavailable = state.phase === 'unavailable'
  const message = resultMessage(state.score, completed)

  return <section className={`game-result ${record.isNewRecord && !unavailable ? 'has-new-record' : ''}`} aria-labelledby="result-title">
    <span className="result-icon"><Icon name={completed || record.isNewRecord ? 'trophy' : unavailable ? 'lock' : 'ball'} /></span>
    <span className="eyebrow">{unavailable ? 'Spillerdata klargøres' : completed ? 'Hele vejen til slutfløjt' : 'Game Over'}</span>
    <h1 id="result-title">{unavailable ? 'Tallene mangler' : message.title}</h1>
    <p>{unavailable ? 'Spillet åbner, når mindst to spillere har verificerede FCM-tal.' : message.detail}</p>
    {!unavailable && <>
      <div className="final-score"><strong>{state.score}</strong><span>rigtige svar i træk</span></div>
      <div className="personal-best"><span>Din rekord · {mode.title}</span><strong>{record.highScore}</strong></div>
      <p className="result-record-message">{record.isNewRecord ? 'Ny personlig rekord. Godt spillet!' : `${state.deck.length - 1} mulige point. Der er altid en revanche.`}</p>
      {!record.persisted && <p className="storage-note">Browseren kunne ikke gemme rekorden. Den gælder i denne tur.</p>}
    </>}
    <div className="result-actions">
      {!unavailable && <button className="primary-button" onClick={onRestart}>Prøv igen <Icon name="arrow" /></button>}
      <a className="game-secondary-button" href="#spiltilstande">Tilbage til forsiden</a>
      {!unavailable && <ShareResult club={club} mode={mode} score={state.score} highScore={record.highScore} testData={testData} />}
    </div>
  </section>
}
