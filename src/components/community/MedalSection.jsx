import HighScoreMedal from '../HighScoreMedal'
import { HIGH_SCORE_MEDAL_TIERS } from '../../game/highScoreMedal.js'
import { medalProgress } from './medalProgress.js'
import './MedalSection.css'

export default function MedalSection({ score, loading = false, loadingMessage = 'Henter din rekord…', error = '', publicProfile = false }) {
  const { best, current, next } = medalProgress(score)
  return <section className="medal-section" aria-labelledby="medal-section-title">
    <header className="medal-section-header">
      <h2 id="medal-section-title">Medaljer</h2>
      <p className="medal-section-game">Higher or Lower – Flest kampe</p>
      <p className="medal-section-description">{publicProfile ? 'Spillerens bedste stime af rigtige svar i træk afgør medaljen. Medaljerne nedenfor viser spillerens fremskridt.' : 'Din bedste stime af rigtige svar i træk afgør din medalje. Slå din rekord og nå kravene nedenfor for at låse op for nye medaljer.'}</p>
    </header>
    {loading ? <p role="status">{loadingMessage}</p> : error ? <p role="alert">{error}</p> : <>
      <div className="profile-record">
        <HighScoreMedal score={best} />
        <p className="medal-current"><span>Højeste opnåede medalje</span><strong>{current.label}</strong></p>
      </div>
      <div className="medal-next">
        {next ? <>
          <p className="medal-next-label">Næste mål</p>
          <h3>{next.label} <span>· {next.minScore} rigtige i træk</span></h3>
          <progress value={best} max={next.minScore} aria-label={`Mod ${next.label}: ${best} af ${next.minScore} rigtige i træk`} />
        </> : <><h3>Alle medaljer er låst op!</h3><p>{publicProfile ? `Spilleren har nået ${current.label}.` : `Du har nået ${current.label}. Hvor langt kan du løfte din rekord?`}</p></>}
      </div>
      <h3 className="medal-requirements-title">Krav til hver medalje</h3>
      <ol className="medal-requirements">
        {HIGH_SCORE_MEDAL_TIERS.map(tier => {
          const earned = best >= tier.minScore
          const highest = tier.id === current.id
          const upcoming = tier.id === next?.id
          return <li key={tier.id} className={`medal-requirement ${earned ? 'is-earned' : 'is-locked'}${highest ? ' is-current' : ''}`} aria-current={highest ? 'step' : undefined}>
            <span className="medal-requirement-copy"><strong>{tier.label}</strong><span>{tier.minScore} rigtige i træk</span></span>
            <span className="medal-requirement-status">{highest ? 'Højeste opnåede' : earned ? 'Optjent' : upcoming ? 'Låst · Næste mål' : 'Låst'}</span>
          </li>
        })}
      </ol>
    </>}
  </section>
}
