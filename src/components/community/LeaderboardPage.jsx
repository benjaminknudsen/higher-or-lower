import useAuthAccount from '../../hooks/useAuthAccount.js'
import { useState } from 'react'
import useLeaderboard from '../../hooks/useLeaderboard'
import Avatar from './Avatar'
import CommunityHeader from './CommunityHeader'
import Icon from '../Icon'

function LeaderboardEntry({ entry, podium = false, unit = 'i træk' }) {
  return <li className={`${podium ? 'podium-entry' : 'leaderboard-row'} ${entry.isSelf ? 'is-self' : ''}`}>
    <span className="leaderboard-rank" aria-label={`Placering ${entry.rank}`}>#{entry.rank}</span>
    <Avatar self={entry.isSelf} avatarPath={entry.avatarPath} />
    <span className="leaderboard-name"><span>{entry.name}{entry.isSelf && <small>Dig</small>}</span></span>
    <strong className="leaderboard-score">{entry.score}<small> {unit}</small></strong>
  </li>
}

export default function LeaderboardPage({ gameModes }) {
  const [modeId, setModeId] = useState('appearances')
  return <main className="community-content leaderboard-page" id="indhold">
    <CommunityHeader title="Leaderboard" subtitle="Se de bedste spillere, og hvor du ligger på ranglisten." />
    <p className="account-note">Leaderboardet viser hver spillers 3 bedste forsøg, rangeret efter score. Du kan derfor have op til tre individuelle placeringer på ranglisten.</p>
    <p className="account-note">Fælles leaderboard for registrerede spillere. Gæster kan se placeringerne, men deres resultater vises ikke online.</p>
    <div className="leaderboard-filters" role="group" aria-label="Spiltype på ranglisten">
      {gameModes.filter(mode => mode.available).map(mode => <button key={mode.id} type="button" aria-pressed={mode.id === modeId} onClick={() => setModeId(mode.id)}>
        <Icon name={mode.icon} /><span>{mode.title}</span>
      </button>)}
    </div>
    <Ranking key={modeId} modeId={modeId} />
  </main>
}

function Ranking({ modeId }) {
  const account=useAuthAccount()
  const userId=account.status==='signed-in'?account.userId:null
  const result=useLeaderboard(modeId,userId)
  return <RankingContent entries={result.entries} ownEntries={result.ownEntries} total={result.total} loading={result.loading}
    loadingMore={result.loadingMore} failed={result.failed} error={result.error} loadMore={result.loadMore}
    lineup={modeId==='lineup'} signedIn={Boolean(userId)} />
}

function RankingContent({ entries, ownEntries, total, loading, loadingMore, failed, error, loadMore, lineup = false, signedIn }) {
  const unit = lineup ? 'point' : 'i træk'
  return <>
    {loading ? <p role="status">Henter ranglisten…</p> : failed ? <p role="alert">Ranglisten kunne ikke vises. {error}</p> : entries.length === 0 ? <p>Ingen online-resultater endnu.</p> : <>
      <section aria-labelledby="podium-title"><h2 className="community-section-title" id="podium-title">Hall of Fame</h2>
        <ol className="leaderboard-podium">{entries.slice(0, 3).map(entry => <LeaderboardEntry key={entry.id} entry={entry} podium unit={unit} />)}</ol>
      </section>
      {ownEntries.length > 0 && <section className="your-ranking" aria-label="Dine placeringer">
        <h2>Din placering</h2>
        <ol>{ownEntries.map(entry => <li key={entry.id}><strong>#{entry.rank}</strong><span>{entry.score} {unit}</span></li>)}</ol>
      </section>}
      {!signedIn && <p className="account-note">Log ind for at få en personlig placering. Gæster kan ikke indsende resultater.</p>}
      {entries.length > 3 && <section aria-label="Rangliste"><ol className="leaderboard-list" start={4}>{entries.slice(3).map(entry => <LeaderboardEntry key={entry.id} entry={entry} unit={unit} />)}</ol></section>}
      {entries.length < total && <button type="button" className="account-secondary" disabled={loadingMore} onClick={loadMore}>{loadingMore?'Henter…':'Vis flere forsøg'}</button>}
      {error&&!failed&&<p role="alert">{error} Resultaterne ovenfor vises stadig.</p>}
    </>}
  </>
}
