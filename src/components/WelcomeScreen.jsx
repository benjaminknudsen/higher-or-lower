import useHighScore from '../hooks/useHighScore'
import useLocalAccount from '../hooks/useLocalAccount'
import Icon from './Icon'
import './WelcomeScreen.css'

function StadiumBackdrop() {
  return <div className="welcome-atmosphere" aria-hidden="true">
    <svg className="welcome-stadium" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMax slice" fill="none">
      <defs>
        <linearGradient id="welcome-stands" x1="400" y1="540" x2="400" y2="880" gradientUnits="userSpaceOnUse"><stop stopColor="#8d64d9" stopOpacity=".16" /><stop offset="1" stopColor="#121116" stopOpacity="0" /></linearGradient>
      </defs>
      <path d="M-100 660Q400 420 900 660V900H-100Z" fill="url(#welcome-stands)" />
      {[0, 1, 2, 3].map(row => <path key={row} d={`M-100 ${635 + row * 40}Q400 ${415 + row * 70} 900 ${635 + row * 40}`} stroke="#bca2ff" strokeOpacity={.11 - row * .02} strokeWidth="2" />)}
      <path d="M-40 840 250 755H550L840 840M250 755 170 1000M550 755 630 1000M400 755V1000M100 900H700" stroke="#bca2ff" strokeOpacity=".12" strokeWidth="2" />
      <ellipse cx="400" cy="902" rx="88" ry="30" stroke="#bca2ff" strokeOpacity=".1" strokeWidth="2" />
      <path d="M60 590V310M740 590V310M30 320H105M695 320H770" stroke="#a88aff" strokeOpacity=".16" strokeWidth="5" />
      {[45, 65, 85, 715, 735, 755].map(x => <rect key={x} x={x} y="304" width="12" height="12" rx="2" fill="#c9b0ff" fillOpacity=".24" />)}
      <path d="m112 690 24-53 22 13 25-27 18 40 25-15 24 35m300 0 24-35 25 15 18-40 25 27 22-13 24 53" stroke="#9670ff" strokeOpacity=".12" strokeWidth="13" strokeLinecap="round" />
    </svg>
  </div>
}

export default function WelcomeScreen({ clubId }) {
  const { highScore } = useHighScore(clubId, 'appearances', 0, false)
  const { statistics } = useLocalAccount(clubId)
  const stats = [
    { icon: 'trophy', value: highScore, label: 'Personlig rekord' },
    { icon: 'ball', value: statistics.gamesPlayed, label: 'Spillede runder' },
    { icon: 'target', value: `${statistics.accuracy}%`, label: 'Træfsikkerhed' },
  ]
  return <div className="app welcome-screen">
    <StadiumBackdrop />
    <header className="welcome-brand">
      <img src={`${import.meta.env.BASE_URL}app-logo.png`} alt="" />
      <span><strong>FCM</strong><span>Games</span></span>
    </header>
    <main className="welcome-main" id="indhold">
      <div className="welcome-copy">
        <h1 id="welcome-title" tabIndex={-1}>KENDER DU<br /><span>FCM GODT?</span></h1>
        <p>Test din FCM-viden,<br />og find dit næste spil.</p>
      </div>
      <div className="welcome-start">
        <a className="welcome-play" href="#forside" aria-label="PLAY – Åbn spilmenuen">
          <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M23 13a3 3 0 0 1 4.5-2.6l29 18a3 3 0 0 1 0 5.2l-29 18A3 3 0 0 1 23 49Z" fill="currentColor" /></svg>
        </a>
        <span className="welcome-play-caption" aria-hidden="true">PLAY</span>
      </div>
    </main>
    <footer className="welcome-statistics" aria-label="Din lokale statistik">
      {stats.map(stat => <div key={stat.label}><Icon name={stat.icon} /><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
    </footer>
  </div>
}
