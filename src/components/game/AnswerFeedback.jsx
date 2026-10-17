import { roundFeedback } from '../../game/feedback'

export default function AnswerFeedback({ state, unit, newRecord, compact = false }) {
  const feedback = roundFeedback(state, unit)
  return <div className={`answer-feedback feedback-${feedback.kind}`} role="status" aria-live="polite" aria-atomic="true">
    {(!compact || state.phase === 'revealed') && <><strong key={`${state.index}-${state.phase}`}>{feedback.title}</strong>
    <span>{feedback.detail.replace('HIGHER', 'HØJERE').replace('LOWER', 'LAVERE')}</span>
    <span className="record-flash">{newRecord && state.phase === 'revealed' && state.correct ? '★ Ny personlig rekord!' : '\u00a0'}</span></>}
  </div>
}
