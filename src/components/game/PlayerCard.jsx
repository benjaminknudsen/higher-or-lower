import PlayerIllustration from '../PlayerIllustration'
import ConcealedStatistic from './ConcealedStatistic'

function splashPoints(count) {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 2 / count
    const radius = index % 2 ? 110 : 135
    return [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)]
  })
}

export default function PlayerCard({ player, mode, hidden = false, challenger = false, silhouetteSrc, correct = false, particleCount = 12 }) {
  return <article className={`player-card ${challenger ? 'player-card-challenger' : ''}`} aria-label={challenger ? 'Spilleren du gætter på' : 'Dit udgangspunkt'}>
    {correct && <div className="round-success-effect" aria-hidden="true">
      <span className="success-splash">
        {splashPoints(particleCount).map(([x, y], index) => <i key={index} style={{ '--splash-x': `${x}px`, '--splash-y': `${y}px`, '--splash-delay': `${index % 3 * 35}ms` }} />)}
      </span>
      <div className="round-success-burst"><span className="round-success-check">✓</span><span className="round-success-points">+1</span></div>
    </div>}
    <div className="player-avatar" aria-hidden="true"><PlayerIllustration name={player.name} imageSrc={player.localImage} silhouetteSrc={silhouetteSrc} shadow={mode.id === 'appearances'} broadcast={mode.id !== 'appearances'} /></div>
    <div className="player-details">
      <h2>{player.name}</h2>
    </div>
    <div className="player-stat">
      <ConcealedStatistic value={player.stats[mode.statisticKey]} unit={mode.unit} hidden={hidden} animate={challenger} />
      <span>{mode.unit}</span>
    </div>
  </article>
}
