import './Lineup.css'
import { loadLineupStore } from '../../services/lineupStorage'
import { statistics } from '../../game/lineup'
export default function LineupStatistics({ compact = false }) {
  const stats = statistics(loadLineupStore())
  if (compact) return <section className="lineup-local-ranking"><h2>Gæt startopstillingen</h2><strong>{stats.best} point</strong><p>Din bedste score på denne enhed.</p><p className="statistics-note">Denne spiltype har endnu ingen global rangliste. Dine runder gemmes kun lokalt.</p></section>
  return <section className="lineup-profile" aria-labelledby="lineup-statistics-title"><h2 className="community-section-title" id="lineup-statistics-title">Gæt startopstillingen</h2><div className="profile-statistics"><div><strong>{stats.rounds}</strong><span>Spillede runder</span></div><div><strong>{stats.best}</strong><span>Bedste pointscore</span></div><div><strong>{stats.perfect}</strong><span>Perfekte opstillinger</span></div><div><strong>{stats.correct}</strong><span>Korrekt gættede spillere</span></div></div><p className="statistics-note">Startopstillingsquizzen har sin egen lokale statistik og rekord.</p></section>
}
