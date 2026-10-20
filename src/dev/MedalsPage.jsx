import HighScoreMedal from '../components/HighScoreMedal'
import { HIGH_SCORE_MEDAL_TIERS } from '../game/highScoreMedal'
import './MedalsPage.css'

const scores = [6, 15, 28, 42, 67, 120]
export default function MedalsPage() {
  return <main className="medals-preview" id="medals">
    <header className="medals-preview-header"><a href="#forside">← Til spilmenuen</a><p>FCM GAMES · UDVIKLING</p><h1>Medaljeoversigt</h1><span>Alle seks niveauer · Eksempelrekorder påvirker ikke din profil</span></header>
    <section className="medals-preview-grid" aria-label="Alle seks highscore-medaljer">
      {HIGH_SCORE_MEDAL_TIERS.map((tier, index) => <article key={tier.id} className="medals-preview-card" style={{ '--preview-accent': tier.color }}>
        <HighScoreMedal score={scores[index]} />
        <h2>{tier.label}</h2><p>{tier.minScore}{index < HIGH_SCORE_MEDAL_TIERS.length - 1 ? `–${HIGH_SCORE_MEDAL_TIERS[index + 1].minScore - 1}` : '+'} rigtige i træk</p>
      </article>)}
    </section>
  </main>
}
