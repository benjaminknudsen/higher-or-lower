import useAuthAccount from '../../hooks/useAuthAccount.js'
import useLeaderboard from '../../hooks/useLeaderboard'
import Avatar from './Avatar'
import CommunityHeader from './CommunityHeader'

function LeaderboardEntry({ entry, podium = false, unit = 'i træk' }) {
  const href = entry.isSelf ? '#profil' : `#profil/${encodeURIComponent(entry.playerId)}`
  return <li className={`${podium ? 'podium-entry' : 'leaderboard-row'} leaderboard-entry-clickable ${entry.isSelf ? 'is-self' : ''}`}>
    <span className="leaderboard-rank" aria-label={`Placering ${entry.rank}`}>#{entry.rank}</span>
    <Avatar self={entry.isSelf} avatarPath={entry.avatarPath} />
    <span className="leaderboard-name"><span>{entry.name}{entry.isSelf && <small>Dig</small>}</span></span>
    <strong className="leaderboard-score">{entry.score}<small> {unit}</small></strong>
    <a className="leaderboard-entry-link" href={href} aria-label={`${entry.isSelf ? 'Vis din profil' : `Vis profil for ${entry.name}`}, placering ${entry.rank}`} />
  </li>
}

export default function LeaderboardPage() {
  return <main className="community-content leaderboard-page" id="indhold">
    <CommunityHeader title="Leaderboard" subtitle="Higher or Lower – Flest kampe" />
    <p className="account-note">Leaderboardet viser hver spillers 3 bedste forsøg, rangeret efter score. Du kan derfor have op til tre individuelle placeringer på ranglisten.</p>
    <p className="account-note">Fælles leaderboard for registrerede spillere. Gæster kan se placeringerne, men deres resultater vises ikke online.</p>
    <Ranking />
  </main>
}

function Ranking() {
  const account=useAuthAccount()
  const userId=account.status==='signed-in'?account.userId:null
  const result=useLeaderboard(userId)
  return <RankingContent entries={result.entries} ownEntries={result.ownEntries} total={result.total} loading={result.loading}
    loadingMore={result.loadingMore} failed={result.failed} error={result.error} loadMore={result.loadMore}
    signedIn={Boolean(userId)} />
}

function RankingContent({ entries, ownEntries, total, loading, loadingMore, failed, error, loadMore, signedIn }) {
  const unit = 'i træk'
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
