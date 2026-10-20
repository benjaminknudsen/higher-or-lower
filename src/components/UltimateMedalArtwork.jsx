// Original championship crest: a round obsidian core inside a winged wolf shield.
export default function UltimateMedalArtwork({ id, score, compact = false }) {
  const paint = name => `url(#${id}-immortal-${name})`
  const mirrored = 'translate(420 0) scale(-1 1)'
  return <>
    <defs>
      <linearGradient id={`${id}-immortal-gold`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#fff6ce" /><stop offset=".14" stopColor="#d8b968" /><stop offset=".29" stopColor="#594018" /><stop offset=".44" stopColor="#e4c272" /><stop offset=".5" stopColor="#fff4bc" /><stop offset=".66" stopColor="#b77f2b" /><stop offset=".84" stopColor="#422b0e" /><stop offset="1" stopColor="#e8cc83" /></linearGradient>
      <linearGradient id={`${id}-immortal-bevel`} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#e2c07a" /><stop offset=".35" stopColor="#251e13" /><stop offset=".6" stopColor="#9a702f" /><stop offset="1" stopColor="#fff1b4" /></linearGradient>
      <linearGradient id={`${id}-immortal-steel`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#51504b" /><stop offset=".2" stopColor="#17191c" /><stop offset=".65" stopColor="#07090c" /><stop offset="1" stopColor="#3b3528" /></linearGradient>
      <radialGradient id={`${id}-immortal-obsidian`} cx=".42" cy=".25" r=".8"><stop stopColor="#26241f" /><stop offset=".4" stopColor="#0b0e12" /><stop offset="1" stopColor="#030507" /></radialGradient>
      <radialGradient id={`${id}-immortal-aura`}><stop stopColor="#982e2a" stopOpacity=".2" /><stop offset=".45" stopColor="#e4ac47" stopOpacity=".16" /><stop offset="1" stopColor="#d6a94b" stopOpacity="0" /></radialGradient>
      <linearGradient id={`${id}-immortal-ruby`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffc0b0" /><stop offset=".2" stopColor="#d65260" /><stop offset=".48" stopColor="#8e2339" /><stop offset="1" stopColor="#280912" /></linearGradient>
      <linearGradient id={`${id}-immortal-score`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff9e0" /><stop offset=".5" stopColor="#f3dca3" /><stop offset="1" stopColor="#bc9144" /></linearGradient>
      <linearGradient id={`${id}-immortal-reflection`}><stop stopColor="#ffe6a4" stopOpacity="0" /><stop offset=".5" stopColor="#ffe6a4" stopOpacity=".5" /><stop offset="1" stopColor="#ffe6a4" stopOpacity="0" /></linearGradient>
      <path id={`${id}-immortal-arc`} d="M91 200A128 128 0 0 1 329 200" />
      <g id={`${id}-immortal-wing`} strokeLinejoin="round">
        <path d="m140 163-39-31-59-12 17 29-43-15 15 34-20 5 28 30-16 4 34 32-13 9 39 29-9 12 46 24 25-48Z" fill={paint('steel')} stroke="#281e11" strokeWidth="4" />
        <path d="m134 167-33-28-48-13 31 34-57-18 25 32-28 1 33 24-20 8 36 24-15 15 40 22-10 15 45 23 15-30Z" fill={paint('gold')} stroke="#ecd18d" strokeWidth=".8" />
        <path d="m53 126 44 34 29 17-23 14-31-20-45-29 36 42 51 27-12 15-65-19 49 31 17 3-6 14-39-9 40 27 17 4-8 13 19 17 17-32-4-61Z" fill={paint('steel')} stroke="#7d602b" strokeWidth="1.1" />
        <path d="m37 150 53 33m-42-1 45 21m-40 17 42 17m-23 25 34 15" fill="none" stroke="#f0d38c" strokeWidth="1" opacity=".6" />
        <path d="m49 115 12 5 39 5 23 17-18-28-28-11-28 1 12 5Z" fill={paint('bevel')} stroke="#bd9650" strokeWidth="1" />
        <path d="m56 110 21-1 14 9" fill="none" stroke="#f7df9a" strokeWidth=".8" />
      </g>
      <g id={`${id}-immortal-laurel`}>
        <path d="M174 412C110 382 78 294 94 222" fill="none" stroke={paint('gold')} strokeWidth="3" />
        {Array.from({length:12},(_,i)=>{
          const t=i/11,x=139-47*Math.sin(t*Math.PI*.65),y=392-164*t
          return <g key={i} transform={`translate(${x} ${y}) rotate(${-58+t*73})`}>
            <path d="M0 0C-24 0-33-15-29-32-11-30-1-17 0 0Z" fill={paint('gold')} stroke="#4a3517" strokeWidth="1" />
            <path d="M1 0C16-8 20-24 12-32 1-24-3-12 1 0Z" fill={paint('bevel')} stroke="#a88745" strokeWidth=".7" />
            <path d="m-3-4-22-22m10 12-9-1m9-1-1-8M3-6l8-21" fill="none" stroke="#ffedb4" strokeWidth=".7" opacity=".7" />
          </g>
        })}
      </g>
      <g id={`${id}-immortal-wolf`} strokeLinejoin="round">
        <path d="m0-4-26-25 1 31-12 22 13-2-10 19 17-3-1 12 11-3L0 60l7-13 11 3-1-12 17 3-10-19 13 2-12-22 1-31Z" fill={paint('gold')} stroke="#fae4ac" strokeWidth="1.1" />
        <path d="m-23-21 3 24 9 7-5-21Zm46 0-3 24-9 7 5-21Z" fill="#0b0e11" stroke="#71572b" strokeWidth="1" />
        <path d="M0-3-10 14-6 33 0 38 6 33 10 14Z" fill={paint('steel')} stroke="#c6a66b" strokeWidth=".7" />
        <path d="m-31 19 17 4 6 12-11-5-10 4 10-11Zm62 0-17 4-6 12 11-5 10 4-10-11Z" fill="#181919" />
        <path d="m-22 17 13 5-7 3-7-4Zm44 0-13 5 7 3 7-4Z" fill={paint('ruby')} stroke="#e3bc7e" strokeWidth=".5" />
        <path d="m-19 19 6 2m32-2-6 2" stroke="#ffb2a5" strokeWidth=".8" />
        <path d="m-8 35 8-5 8 5-8 6Z" fill="#06080a" stroke="#e5ca91" strokeWidth=".7" />
        <path d="m-9 44 9 4 9-4-9 11Z" fill="#08090b" stroke="#967342" strokeWidth=".7" />
        <path d="M0 0v17m-18-7 8 8m28-8-8 8m-29 12 10 8m28-8-10 8m-9 4-7 5m11-5 7 5" fill="none" stroke="#fbe9bc" strokeWidth=".7" opacity=".7" />
      </g>
    </defs>
    <ellipse cx="210" cy="252" rx="207" ry="242" fill={paint('aura')} />
    <g className="immortal-rays" stroke="#e5bd63" strokeWidth="1.1" opacity=".16">
      {Array.from({length:24},(_,i)=><path key={i} d={`M210 ${i%2?35:24}v${i%3?15:28}`} transform={`rotate(${i*15} 210 250)`} />)}
    </g>
    {/* The pointed black shield and winged shoulders define the outer silhouette. */}
    <path d="m210 91 55 24 43 35 40 95-17 117-54 61-67 58-67-58-54-61-17-117 40-95 43-35Z" fill={paint('steel')} stroke="#100f0d" strokeWidth="5" />
    <path d="m210 101 52 24 37 34 39 89-16 108-51 61-61 53-61-53-51-61-16-108 39-89 37-34Z" fill="none" stroke={paint('gold')} strokeWidth="5" />
    <use href={`#${id}-immortal-wing`} /><use href={`#${id}-immortal-wing`} transform={mirrored} />
    <circle cx="210" cy="272" r="143" fill="#030405" stroke={paint('bevel')} strokeWidth="7" />
    <circle cx="210" cy="272" r="136" fill="none" stroke={paint('gold')} strokeWidth="7" />
    <circle cx="210" cy="272" r="130" fill={paint('obsidian')} stroke="#33291a" strokeWidth="4" />
    <circle cx="210" cy="272" r="126" fill="none" stroke={paint('gold')} strokeWidth="1.3" />
    {Array.from({length:48},(_,i)=><path key={i} d="m208 133 2-2 2 2-2 3Z" transform={`rotate(${i*7.5} 210 272)`} fill="#c6a261" opacity=".65" />)}
    <path d="m127 230 44-22 39 25 39-25 44 22m-166 88 44-22 39 25 39-25 44 22" fill="none" stroke="#dfc387" strokeWidth=".7" opacity=".07" />
    {!compact && <><use href={`#${id}-immortal-laurel`} /><use href={`#${id}-immortal-laurel`} transform={mirrored} />
      <text className="immortal-title" fill="#e7cd91"><textPath href={`#${id}-immortal-arc`} startOffset="50%" textAnchor="middle">PERSONLIG REKORD</textPath></text>
    </>}
    {/* Large five-point crown sits outside the circular core. */}
    <g className="immortal-crown" transform="translate(0 -10)" fill={paint('gold')} stroke="#493416" strokeLinejoin="round" strokeWidth="1.5">
      <path d="m126 54 34 24-1-45 32 32 19-48 19 48 32-32-1 45 34-24-22 52H148Z" />
      <path d="M149 100h122v14H149Z" fill={paint('bevel')} /><path d="M156 104h108M142 67l14 25h108l14-25" fill="none" stroke="#fff0b6" strokeWidth="1.2" />
      {[126,159,210,261,294].map((x,i)=><circle key={x} cx={x} cy={[54,33,17,33,54][i]} r={i===2?5:3} fill="#f8d88f" />)}
      <path d="m210 65 9 16-9 15-9-15Z" fill={paint('ruby')} stroke="#f9d995" strokeWidth="1" /><path d="m210 68-6 13 6 11Z" fill="#f48d94" opacity=".4" />
    </g>
    {/* The wolf occupies its own band, ending well above the score. */}
    <use className="immortal-wolf" href={`#${id}-immortal-wolf`} transform={compact?'translate(210 225) scale(2.1)':'translate(210 171) scale(1.35)'} />
    {!compact && <>
      <text key={score} x="210" y="332" textAnchor="middle" className="prestige-value" style={{fontSize:Math.min(96,182/(String(score).length*.64))}} fill={paint('score')} stroke="#120f09" strokeWidth="1" paintOrder="stroke">{score}</text>
      <text x="210" y="353" textAnchor="middle" className="prestige-streak">rigtige i træk</text>
      <path d="M161 367h98" stroke={paint('gold')} strokeWidth=".8" />
      <text x="210" y="386" textAnchor="middle" className="immortal-rank" fill="#f1d795">ULTIMATE</text>
      <text x="210" y="402" textAnchor="middle" className="immortal-subtitle" fill="#bda06a">WOLF IMMORTAL</text>
      {/* A single faceted ruby is the final-rank symbol; no three-star motif. */}
      <path d="m210 416 22 19-22 32-22-32Z" fill={paint('gold')} stroke="#f4d79b" strokeWidth="1.2" />
      <path d="m210 422 15 14-15 23-15-23Z" fill={paint('ruby')} /><path d="m210 422-15 14 15 23Z" fill="#f0a69d" opacity=".28" /><path d="m195 436 15-5 15 5m-15-14v37" fill="none" stroke="#f5bcad" strokeWidth=".6" opacity=".55" />
      {[0,1].map(side=><g key={side} transform={side?mirrored:undefined}>
        <path d="m63 250 9-14 9 14-9 13Z" fill={paint('bevel')} stroke="#f1d08d" strokeWidth=".8" /><path d="m67 250 5-8 5 8-5 8Z" fill={paint('ruby')} />
        <path d="m147 422 17 4 14 16-13-4Z" fill={paint('gold')} />
      </g>)}
      <circle className="immortal-reflection" cx="210" cy="272" r="136" fill="none" stroke={paint('reflection')} strokeWidth="4" strokeDasharray="85 770" />
    </>}
  </>
}
