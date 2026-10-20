import useTopThreeResults from '../../hooks/useTopThreeResults.js'

function AttemptList({ gameType, userId, isGuest, identityLoading, title }) {
  const { attempts, loading, error } = useTopThreeResults(gameType, userId, isGuest, identityLoading)
  return <section className="top-three-game" aria-labelledby={`top-three-${gameType}`}>
    <h3 id={`top-three-${gameType}`}>{title}</h3>
    {loading ? <p role="status">Henter forsøg…</p> : error ? <p role="alert">{error}</p> : attempts.length === 0
      ? <p>Ingen gemte forsøg endnu.</p>
      : <ol>{attempts.map((attempt, index) => <li key={attempt.id}>
        <span aria-label={`Forsøg ${index + 1}`}>{index + 1}</span>
        <strong>{attempt.score}</strong>
        <time dateTime={attempt.createdAt}>{new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium' }).format(new Date(attempt.createdAt))}</time>
      </li>)}</ol>}
  </section>
}

export default function TopThreeResults({ userId, isGuest, identityLoading }) {
  return <section className="top-three-results" aria-labelledby="top-three-results-title">
    <h2 className="community-section-title" id="top-three-results-title">Dine 3 bedste forsøg</h2>
    <div>
      <AttemptList gameType="appearances" userId={userId} isGuest={isGuest} identityLoading={identityLoading} title="Higher or Lower – Flest kampe" />
      <AttemptList gameType="lineup" userId={userId} isGuest={isGuest} identityLoading={identityLoading} title="Gæt startopstillingen" />
    </div>
  </section>
}
