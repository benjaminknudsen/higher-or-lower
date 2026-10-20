import UltimateMedalArtwork from './UltimateMedalArtwork'
import { useId } from 'react'
import { getHighScoreMedalTier, HIGH_SCORE_MEDAL_TIERS } from '../game/highScoreMedal'
import './HighScoreMedal.css'

const finishes = {
  gray: ['#f4f7ff', '#657182', '#242d3c'],
  green: ['#d6ffe0', '#248453', '#123527'],
  yellow: ['#fff6bf', '#bd8c24', '#49310c'],
  red: ['#ffd4d9', '#a92745', '#45111f'],
  cyan: ['#d8fcff', '#168ba9', '#0c3248'],
  gold: ['#fff5c6', '#c48b26', '#4e2e08'],
}

export default function HighScoreMedal({ score, compact = false }) {
  const id = useId().replace(/:/g, '')
  const tier = getHighScoreMedalTier(score)
  const level = HIGH_SCORE_MEDAL_TIERS.indexOf(tier)
  const value = Number.isSafeInteger(score) && score >= 0 ? score : 0
  const [light, shade, dark] = finishes[tier.id]
  const ref = name => `url(#${id}-${name})`
  const textSize = Math.min(88, 164 / (String(value).length * .64))
  const leaves = Array.from({ length: level >= 4 ? 12 : 10 }, (_, i) => {
    const t = i / (level >= 4 ? 11 : 9)
    return { x: 111 - 41 * Math.sin(t * Math.PI * .8), y: 272 - 139 * t, angle: -49 + 95 * t }
  })
  return <div className={`prestige-medal ${compact ? 'prestige-compact' : ''}`} data-tier={tier.id} style={{ '--prestige-color': tier.color, '--prestige-glow': tier.glow, '--prestige-power': .35 + level * .1 }} role="img" aria-label={`Personlig rekord: ${value} rigtige i træk. ${tier.label}${level === 5 ? ' · WOLF IMMORTAL' : ''}`}>
    <svg className="prestige-art" viewBox={level === 5 ? '0 0 420 500' : '0 0 360 360'} aria-hidden="true" focusable="false">
      {level === 5 ? <UltimateMedalArtwork id={id} score={value} compact={compact} /> : <>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={light} /><stop offset=".16" stopColor={tier.color} /><stop offset=".32" stopColor={shade} /><stop offset=".46" stopColor={light} /><stop offset=".52" stopColor={tier.color} /><stop offset=".72" stopColor={dark} /><stop offset=".88" stopColor={shade} /><stop offset="1" stopColor={light} />
        </linearGradient>
        <linearGradient id={`${id}-reverse`} x1="0" y1="1" x2="1" y2="0"><stop stopColor={shade} /><stop offset=".4" stopColor={dark} /><stop offset=".76" stopColor={light} /><stop offset="1" stopColor={shade} /></linearGradient>
        <radialGradient id={`${id}-face`} cx=".43" cy=".25" r=".8"><stop stopColor="#302b38" /><stop offset=".55" stopColor="#14131c" /><stop offset="1" stopColor="#080910" /></radialGradient>
        <linearGradient id={`${id}-letters`} x1="0" y1="0" x2=".2" y2="1"><stop stopColor={light} /><stop offset=".5" stopColor={tier.color} /><stop offset="1" stopColor={shade} /></linearGradient>
        <pattern id={`${id}-grain`} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 1h1M3 4h1" stroke="#fff" strokeOpacity=".06" strokeWidth=".6" /></pattern>
        <path id={`${id}-arc`} d="M69 154A114 114 0 0 1 291 154" />
        <path id={`${id}-star`} d="m0-6 1.8 4 4.5.5-3.3 3 .9 4.4L0 3.7-3.9 6l.9-4.5-3.3-3 4.5-.5Z" />
        <g id={`${id}-laurel`}>
          <path d="M139 286C88 268 61 204 86 128" fill="none" stroke={ref('metal')} strokeWidth="2.6" />
          {leaves.map(({x,y,angle},i) => <g key={i} transform={`translate(${x} ${y}) rotate(${angle})`}>
            <path d="M0 0C-17-1-23-12-21-23-7-21-1-13 0 0Z" fill={ref('metal')} stroke={shade} strokeWidth=".6" />
            <path d="M-2-3-17-18" fill="none" stroke={light} strokeWidth=".65" opacity=".6" />
            <path d="M1-2C14-5 16-16 12-24 1-18-2-9 1-2Z" fill={ref('reverse')} stroke={shade} strokeWidth=".5" />
          </g>)}
        </g>
      </defs>
      <circle cx="180" cy="184" r="165" fill="#000" opacity=".65" />
      <circle cx="180" cy="180" r="165" fill={ref('metal')} stroke={dark} strokeWidth="2" />
      <circle cx="180" cy="180" r="159" fill="none" stroke={light} strokeOpacity=".7" strokeWidth="1" />
      <circle cx="180" cy="180" r="153" fill="none" stroke={ref('reverse')} strokeWidth="9" />
      {Array.from({length:level === 5 ? 72 : 48},(_,i) => <path key={i} d="M180 22v5" transform={`rotate(${i * (level === 5 ? 5 : 7.5)} 180 180)`} stroke={dark} strokeWidth="1.2" opacity=".65" />)}
      <circle cx="180" cy="180" r="145" fill={ref('face')} stroke={dark} strokeWidth="5" />
      <circle cx="180" cy="180" r="141" fill={ref('grain')} stroke={ref('metal')} strokeWidth="1.5" />
      <path d="M61 117A139 139 0 0 1 279 82" fill="none" stroke={light} strokeOpacity=".28" strokeWidth="1" />
      {!compact && <>
        <text className="prestige-title" fill={light}><textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">PERSONLIG REKORD</textPath></text>
        <use href={`#${id}-laurel`} /><use href={`#${id}-laurel`} transform="translate(360 0) scale(-1 1)" />
      </>}
      <g transform={compact ? 'translate(126 99) scale(2.25)' : 'translate(157 93)'} fill={ref('metal')} stroke={shade} strokeWidth="1.2" strokeLinejoin="round">
        <path d="M8 8H0v8c0 9 6 14 14 14l-3-5c-5-1-7-4-7-9v-4h4Zm30 0h8v8c0 9-6 14-14 14l3-5c5-1 7-4 7-9v-4h-4Z" />
        <path d="M8 4h30v13c0 11-7 18-15 18S8 28 8 17V4Zm12 30h6v9h-6ZM13 44h20v5H13Z" />
        <path d="M11 7h24M12 10v9c0 6 2 9 5 11" fill="none" stroke={light} strokeWidth="1.5" opacity=".8" />
        <use href={`#${id}-star`} transform="translate(23 17) scale(.85)" fill={light} stroke="none" />
      </g>
      {!compact && <>
        <text key={value} x="180" y="224" textAnchor="middle" className="prestige-value" style={{fontSize:textSize}} fill={ref('letters')} stroke={dark} strokeWidth=".6" paintOrder="stroke">{value}</text>
        <text x="180" y="246" textAnchor="middle" className="prestige-streak">rigtige i træk</text>
        <path d="M125 263h110" stroke={ref('metal')} strokeWidth=".8" opacity=".55" />
        <text x="180" y="280" textAnchor="middle" className="prestige-rank" fill={tier.color}>{tier.label}</text>
        {[158,180,202].map((x,i) => <use key={x} href={`#${id}-star`} transform={`translate(${x} 300) scale(${i===1?1.05:.7})`} fill={ref('metal')} />)}
        {level >= 3 && [0,1].map(side => <g key={side} transform={side ? 'translate(360 0) scale(-1 1)' : undefined} fill={ref('metal')}><path d="m44 177 6-8 6 8-6 8Z" /><circle cx="58" cy="198" r="1.6" /></g>)}
        {level === 5 && <g fill="none" stroke={ref('metal')} strokeWidth="1.2"><circle cx="180" cy="180" r="136" strokeDasharray="1 5" opacity=".45" /><path d="m167 38 5 5 8-7 8 7 5-5M145 319q35 12 70 0" /></g>}
      </>}
      </>}
    </svg>
  </div>
}
