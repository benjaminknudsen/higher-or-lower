import useLineupTotal from '../../hooks/useLineupTotal'
import { useState } from 'react'
import useLocalAccount from '../../hooks/useLocalAccount'
import useHighScore from '../../hooks/useHighScore'
import useLeaderboard from '../../hooks/useLeaderboard'
import Avatar from './Avatar'
import CommunityHeader from './CommunityHeader'
import Icon from '../Icon'

function LeaderboardEntry({ entry, podium = false, unit = 'i træk' }) {
  return <li className={`${podium ? 'podium-entry' : 'leaderboard-row'} ${entry.isSelf ? 'is-self' : ''}`}>
    <span className="leaderboard-rank" aria-label={`Placering ${entry.rank}`}>{podium && entry.rank === 1 ? <Icon name="trophy" /> : entry.rank}</span>
    <Avatar self={entry.isSelf} />
    <span className="leaderboard-name">{entry.name}{entry.isSelf && <small>Dig</small>}</span>
    <strong className="leaderboard-score">{entry.score}<small> {unit}</small></strong>
  </li>
}

export default function LeaderboardPage({ clubId, gameModes }) {
  const [modeId, setModeId] = useState('appearances')
  return <main className="community-content leaderboard-page" id="indhold">
    <CommunityHeader title="Leaderboard" subtitle="Se de bedste spillere, og hvor du ligger på ranglisten." />
    <div className="leaderboard-filters" role="group" aria-label="Spiltype på ranglisten">
      {gameModes.map(mode => <button key={mode.id} type="button" disabled={!mode.available} aria-pressed={mode.id === modeId} onClick={() => setModeId(mode.id)}>
        <Icon name={mode.available ? mode.icon : 'lock'} /><span>{mode.title}{!mode.available && <small>Kommer snart</small>}</span>
      </button>)}
    </div>
    {modeId === 'lineup' ? <LineupRanking clubId={clubId} /> : <Ranking key={modeId} clubId={clubId} modeId={modeId} />}
  </main>
}

function Ranking({ clubId, modeId }) {
  const { profile } = useLocalAccount(clubId)
  const { highScore } = useHighScore(clubId, modeId, 0, false)
  const { entries, loading, failed } = useLeaderboard(modeId, profile.name, highScore)
  return <RankingContent entries={entries} loading={loading} failed={failed} />
}

function LineupRanking({ clubId }) {
  const { profile } = useLocalAccount(clubId)
  const totalCorrect = useLineupTotal()
  const result = useLeaderboard('lineup', profile.name, undefined, totalCorrect)
  return <RankingContent {...result} lineup />
}

function RankingContent({ entries, loading, failed, lineup = false }) {
  const unit = lineup ? 'spillere gættet' : 'i træk'
  const self = entries.find(entry => entry.isSelf)
  return <>
    {loading ? <p role="status">Henter ranglisten…</p> : failed ? <p role="alert">Ranglisten kunne ikke vises. Prøv at åbne siden igen.</p> : entries.length === 0 ? <p>Ingen resultater endnu.</p> : <>
      <section aria-labelledby="podium-title"><h2 className="community-section-title" id="podium-title">Hall of Fame</h2>
        <ol className="leaderboard-podium">{entries.slice(0, 3).map(entry => <LeaderboardEntry key={entry.id} entry={entry} podium unit={unit} />)}</ol>
      </section>
      {self && <div className="your-ranking" aria-label={`Din placering: ${self.rank}. ${lineup ? 'Samlet' : 'Rekord'}: ${self.score}`}><span>Din placering</span><strong>#{self.rank}</strong><span>{self.score} {lineup ? 'spillere gættet' : 'rigtige i træk'}</span></div>}
      {lineup && entries.length > 3 && <section aria-label="Rangliste"><ol className="leaderboard-list" start={4}>{entries.slice(3).map(entry => <LeaderboardEntry key={entry.id} entry={entry} unit={unit} />)}</ol></section>}
    </>}
  </>
}
