import { useId } from 'react'

// Lightweight local fallback when the shared raster asset cannot load.
export default function PlayerSilhouetteFallback({ name }) {
  const id = useId().replace(/:/g, '')
  const words = name.trim().split(/\s+/)
  const lines = name.length > 18 && words.length > 1
    ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
    : [name]

  return <svg className="player-illustration" viewBox="0 0 280 400" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-shirt`} x1="75" y1="90" x2="211" y2="313" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34343d" /><stop offset=".43" stopColor="#131319" /><stop offset="1" stopColor="#25252e" />
      </linearGradient>
      <linearGradient id={`${id}-skin`} x1="83" y1="53" x2="181" y2="254" gradientUnits="userSpaceOnUse">
        <stop stopColor="#41404c" /><stop offset=".55" stopColor="#252530" /><stop offset="1" stopColor="#111119" />
      </linearGradient>
      <linearGradient id={`${id}-red`} x1="102" y1="100" x2="177" y2="310" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ff4351" /><stop offset="1" stopColor="#a50f2d" />
      </linearGradient>
    </defs>
    <ellipse cx="141" cy="387" rx="87" ry="9" fill="#141425" opacity=".13" />
    {/* Short hair and rear of head: intentionally no face or identifying features. */}
    <path d="M116 72 112 50Q108 20 137 17Q171 14 174 43L168 72 160 85 162 101 125 104 125 84Z" fill={`url(#${id}-skin)`} />
    <path d="M113 52Q107 21 130 15Q153 8 167 25L175 45 167 59 163 43Q137 50 117 39L117 58Z" fill="#121219" />
    <path d="m126 83 13 9 20-8" stroke="#5b5969" strokeWidth="2" />
    {/* Arms taper into relaxed hands, rather than a generic person icon. */}
    <path d="m70 151-15 59-13 65 5 13 12 1 8-16 7-53 20-52Z" fill={`url(#${id}-skin)`} stroke="#111119" strokeWidth="2" />
    <path d="m208 152 13 58 17 64-4 14-12 3-9-17-11-55-17-49Z" fill={`url(#${id}-skin)`} stroke="#111119" strokeWidth="2" />
    <path d="m54 246-4 25m174-26 6 25" stroke="#777180" strokeOpacity=".35" strokeWidth="3" />
    {/* Black kit, red shoulder panels and twin red back stripes. */}
    <path d="m124 94-32 9-29 24-5 36 32 13 9-17 1 81-9 63q48 18 99-1l-10-65 1-78 10 17 31-13-7-37-30-23-25-9q-19 15-36 0Z" fill={`url(#${id}-shirt)`} stroke="#0d0d15" strokeWidth="3" strokeLinejoin="round" />
    <path d="m124 94-33 10-28 24 7 13 31-24 32-11Zm36 0 26 10 29 23-6 14-30-24-30-11Z" fill={`url(#${id}-red)`} />
    <path d="m120 165 13 1-4 133-15-2Zm30 1 13-1 7 132-15 3Z" fill={`url(#${id}-red)`} />
    <path d="m123 95 17 13 21-13-5-6q-17 10-29 0Z" fill="#bd1834" stroke="#0d0d15" strokeWidth="2" />
    <path d="m60 153 29 12m103 0 27-12" stroke="#c9223e" strokeWidth="7" />
    <path d="m99 122 5 44m73-44-4 44m-69 53 7 29-10 31m75-62-7 30 11 31M98 291q44 11 85-1" stroke="#77747f" strokeOpacity=".28" strokeWidth="2" />
    <path d="m108 176 3 10m65-11-3 11" stroke="#eee7ed" strokeOpacity=".28" strokeWidth="2" />
    {/* Dynamic shirt printing is bounded to the upper back, never a fake number. */}
    {lines.map((line, index) => <text key={index} x="140" y={lines.length > 1 ? 135 + index * 13 : 142} textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="800" fontSize={line.length > 15 ? 10 : 12} letterSpacing=".5" textLength={line.length > 15 ? 93 : undefined} lengthAdjust="spacingAndGlyphs">{line.toLocaleUpperCase('da-DK')}</text>)}
    {/* Shorts, fabric seams, and a cropped athletic stance anchor the silhouette. */}
    <path d="M96 301q45 12 90-1l10 54-47 5-10-26-9 27-46-5Z" fill="#17171f" stroke="#0d0d15" strokeWidth="3" />
    <path d="m98 309-9 38m91-38 10 37" stroke="#d32640" strokeWidth="5" />
    <path d="m139 316 1 17m-37-13 17 3m44 0 14-3" stroke="#5a5665" strokeWidth="2" />
    <path d="m92 356 2 26 29 1 5-24m25-1 4 25 28-1 3-27" fill={`url(#${id}-skin)`} />
    <path d="m94 375 29 1m34 0 28-1" stroke="#cc203c" strokeWidth="6" />
  </svg>
}
