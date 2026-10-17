import Icon from './Icon'
import { getHighScoreMedalTier } from '../game/highScoreMedal'

export default function HighScoreMedal({ score, compact = false }) {
  const tier = getHighScoreMedalTier(score)
  const style = {
    '--medal-color': tier.color,
    '--medal-glow': tier.glow,
    '--medal-edge': tier.edge,
    '--medal-score-fill': tier.scoreFill || tier.color,
  }

  if (compact) return <span className="high-score-medal-icon" style={style} aria-hidden="true">
    <Icon name="trophy" />
  </span>

  return <div className="home-medal" style={style} role="img" aria-label={`Personlig rekord: ${score} rigtige i træk`}>
    <svg className="home-medal-detail" viewBox="0 0 180 180" aria-hidden="true">
      <defs>
        <path id="home-medal-title-arc" d="M 27 91 A 63 63 0 0 1 153 91" />
      </defs>
      <text>
        <textPath href="#home-medal-title-arc" startOffset="50%" textAnchor="middle">PERSONLIG REKORD</textPath>
      </text>
      <g className="home-medal-laurel">
        <path className="home-medal-branch" d="M49 124C38 108 36 89 41 65" />
        <path d="M40 110c-8 0-12-5-12-11 8 0 12 4 12 11Zm-4-18c-8-1-11-7-9-13 8 1 11 6 9 13Zm3-17c-7-3-9-9-6-15 7 3 9 8 6 15Zm7-15c-6-4-6-11-2-16 6 4 7 10 2 16Z" />
      </g>
      <g className="home-medal-laurel" transform="translate(180 0) scale(-1 1)">
        <path className="home-medal-branch" d="M49 124C38 108 36 89 41 65" />
        <path d="M40 110c-8 0-12-5-12-11 8 0 12 4 12 11Zm-4-18c-8-1-11-7-9-13 8 1 11 6 9 13Zm3-17c-7-3-9-9-6-15 7 3 9 8 6 15Zm7-15c-6-4-6-11-2-16 6 4 7 10 2 16Z" />
      </g>
    </svg>
    <Icon name="trophy" className="home-medal-trophy" />
    <strong className="home-medal-score">{score}</strong>
    <span className="home-medal-streak">rigtige i træk</span>
  </div>
}
