import './Lineup.css'
import { loadLineupStore } from '../../services/lineupStorage'
import { statistics, averageCorrectPercentage } from '../../game/lineup'
import useAuthAccount from '../../hooks/useAuthAccount.js'
import useOnlineStats from '../../hooks/useOnlineStats.js'
export default function LineupStatistics({ compact = false }) {
  const account=useAuthAccount()
  const signedIn=account.status==='signed-in'
  const guest=account.status==='guest'
  const online=useOnlineStats(signedIn?account.userId:null,'lineup')
  const local=statistics(loadLineupStore())
  const stats=signedIn?{
    rounds:online.stats.games_played,
    correct:online.stats.total_correct,
    perfect:online.stats.perfect_games,
    best:online.stats.best_score,
  }:guest?local:{rounds:0,correct:0,perfect:0,best:0}
  const note=signedIn?online.loading?'Henter statistik fra din konto.':online.error?online.error:'Kontostatistik synkroniseres mellem dine enheder.':guest?'Dine runder og rekorder gemmes på denne enhed.':'Kontrollerer login…'
  if (compact) return <section className="lineup-local-ranking"><h2>Gæt startopstillingen</h2><strong>{stats.correct} spillere gættet</strong><p>Dit samlede antal korrekte gæt fra afsluttede runder.</p><p className="statistics-note">{note}</p></section>
  return <section className="lineup-profile" aria-labelledby="lineup-statistics-title"><h2 className="community-section-title" id="lineup-statistics-title">Gæt startopstillingen</h2><div className="profile-statistics"><div><strong>{stats.rounds}</strong><span>Spillede runder</span></div><div><strong>{averageCorrectPercentage(stats)}<small>%</small></strong><span>Gns. rigtige</span></div><div><strong>{stats.perfect}</strong><span>Perfekte opstillinger</span></div><div><strong>{stats.correct}</strong><span>Korrekt gættede spillere</span></div></div><p className="statistics-note">{note}</p></section>
}
