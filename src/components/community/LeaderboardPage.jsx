import { useState } from 'react'
import useLocalAccount from '../../hooks/useLocalAccount'
import useHighScore from '../../hooks/useHighScore'
import useLeaderboard from '../../hooks/useLeaderboard'
import Avatar from './Avatar'
import CommunityHeader from './CommunityHeader'
import Icon from '../Icon'

function LeaderboardEntry({ entry, podium = false }) {
  return <li className={`${podium ? 'podium-entry' : 'leaderboard-row'} ${entry.isSelf ? 'is-self' : ''}`}>
    <span className="leaderboard-rank" aria-label={`Placering ${entry.rank}`}>{podium && entry.rank === 1 ? <Icon name="trophy" /> : entry.rank}</span>
    <Avatar self={entry.isSelf} />
    <span className="leaderboard-name">{entry.name}{entry.isSelf && <small>Dig</small>}</span>
    <strong className="leaderboard-score">{entry.score}<small> i træk</small></strong>
  </li>
}

export default function LeaderboardPage({ clubId, gameModes }) {
  const [modeId, setModeId] = useState('appearances')
  return <main className="community-content leaderboard-page" id="indhold">
    <CommunityHeader title="Hvem styrer flokken?" subtitle="Én fejl. Én rekord. Hvor ligger du?" />
    <div className="leaderboard-filters" role="group" aria-label="Spiltype på ranglisten">
      {gameModes.map(mode => <button key={mode.id} type="button" disabled={!mode.available} aria-pressed={mode.id === modeId} onClick={() => setModeId(mode.id)}>
        <Icon name={mode.available ? mode.icon : 'lock'} /><span>{mode.title}{!mode.available && <small>Kommer snart</small>}</span>
      </button>)}
    </div>
    <Ranking key={modeId} clubId={clubId} modeId={modeId} />
  </main>
}

function Ranking({ clubId, modeId }) {
  const { profile } = useLocalAccount(clubId)
  const { highScore } = useHighScore(clubId, modeId, 0, false)
  const { source, entries, loading, failed } = useLeaderboard(modeId, profile.name, highScore)
  const demo = source === 'demo'
  const self = entries.find(entry => entry.isSelf)
  return <>
    {demo && <p className="leaderboard-demo-notice"><strong>Demo · Ikke online endnu</strong>Eksempelprofilerne og deres rekorder er opdigtede. Kun dit navn og din rekord kommer fra denne enhed.</p>}
    {loading ? <p role="status">Henter ranglisten…</p> : failed ? <p role="alert">Ranglisten kunne ikke vises. Prøv at åbne siden igen.</p> : entries.length === 0 ? <p>Ingen resultater endnu.</p> : <>
      <section aria-labelledby="podium-title"><h2 className="community-section-title" id="podium-title">Toppen af flokken</h2>
        <ol className="leaderboard-podium">{entries.slice(0, 3).map(entry => <LeaderboardEntry key={entry.id} entry={entry} podium />)}</ol>
      </section>
      {self && <div className="your-ranking" aria-label={`Din placering: ${self.rank}. Rekord: ${self.score}`}><span>{demo ? 'Din placering i demoen' : 'Din placering'}</span><strong>#{self.rank}</strong><span>{self.score} rigtige i træk</span></div>}
      <section aria-labelledby="ranking-title"><h2 className="community-section-title" id="ranking-title">Jagten fortsætter</h2>
        <ol className="leaderboard-list" start={4}>{entries.slice(3).map(entry => <LeaderboardEntry key={entry.id} entry={entry} />)}</ol>
      </section>
      <p className="statistics-note">Samme rekord giver delt placering.{demo && ' Demoen er kun til at prøve ranglisten — ingen resultater sendes online.'}</p>
    </>}
  </>
}
