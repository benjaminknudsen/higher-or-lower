import './Lineup.css'
import { loadLineupStore } from '../../services/lineupStorage'
import { statistics, averageCorrectPercentage } from '../../game/lineup'
export default function LineupStatistics({ compact = false }) {
  const stats = statistics(loadLineupStore())
  if (compact) return <section className="lineup-local-ranking"><h2>Gæt startopstillingen</h2><strong>{stats.correct} spillere gættet</strong><p>Dit samlede antal korrekte gæt fra afsluttede runder.</p><p className="statistics-note">Dine runder og rekorder gemmes på denne enhed.</p></section>
  return <section className="lineup-profile" aria-labelledby="lineup-statistics-title"><h2 className="community-section-title" id="lineup-statistics-title">Gæt startopstillingen</h2><div className="profile-statistics"><div><strong>{stats.rounds}</strong><span>Spillede runder</span></div><div><strong>{averageCorrectPercentage(stats)}<small>%</small></strong><span>Gns. rigtige</span></div><div><strong>{stats.perfect}</strong><span>Perfekte opstillinger</span></div><div><strong>{stats.correct}</strong><span>Korrekt gættede spillere</span></div></div></section>
}
