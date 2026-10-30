import { lazy, Suspense, useEffect, useState } from 'react'
import { clubs, gameModes as modeDefinitions } from './data/game'
import HomeScreen from './components/HomeScreen'
import InstallPage from './components/install/InstallPage'
import WelcomeScreen from './components/WelcomeScreen'
import BottomNavigation from './components/BottomNavigation'
import ProfilePage from './components/community/ProfilePage'
import LeaderboardPage from './components/community/LeaderboardPage'
import GameScreen from './components/game/GameScreen'
import LineupGame from './components/lineup/LineupGame'
import TenableGame from './components/tenable/TenableGame'
import lineupMatches from './data/lineupMatches.json'
import { isActiveMatch } from './game/lineup'
import playerDataset from './data/players.json'
import { getVerifiedPlayers } from './data/quality'
import './App.css'
import './Home.css'
import './Community.css'

// Vite removes both the route and its import from production builds.
const MedalsPage = import.meta.env.DEV ? lazy(() => import('./dev/MedalsPage')) : null

function App() {
  const club = clubs.fcm
  const gameModes = modeDefinitions.map((mode) => {
    const ready = mode.id === 'tenable' ? true : mode.id === 'lineup' ? lineupMatches.some(isActiveMatch) : mode.id === 'appearances' && mode.implemented && getVerifiedPlayers(playerDataset, club.id, mode.statisticKey).length >= 2
    return { ...mode, available: Boolean(ready), dataPending: Boolean(mode.implemented && !ready) }
  })
  const [hash, setHash] = useState(() => window.location.hash)
  const [session, setSession] = useState(0)
  const activeMode = gameModes.find((mode) => mode.implemented && hash === `#spil/${mode.id}`)
  const welcomePage = !hash || hash === '#velkommen'
  const publicProfileId = hash.startsWith('#profil/') ? hash.slice('#profil/'.length) : null
  const page = hash === '#profil' || publicProfileId !== null ? 'profile' : hash === '#leaderboard' ? 'leaderboard' : 'home'

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!activeMode && (welcomePage || ['#forside', '#profil', '#leaderboard'].includes(hash) || publicProfileId !== null)) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      document.getElementById(welcomePage ? 'welcome-title' : 'page-title')?.focus({ preventScroll: true })
    } else if (!activeMode && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
  }, [activeMode, hash, publicProfileId, welcomePage])

  const startGame = (modeId) => {
    setSession((value) => value + 1)
    window.location.assign(`#spil/${modeId}`)
  }
  if (hash === '#installer') return <InstallPage />
  if (import.meta.env.DEV && hash === '#medals') return <Suspense fallback={<div className="app">Indlæser medaljer…</div>}><MedalsPage /></Suspense>
  if (activeMode) return <div className="app gameplay-app" style={{ '--club-accent': club.accent }}>
    {activeMode.id === 'tenable' ? <TenableGame /> : activeMode.id === 'lineup' ? <LineupGame /> : <GameScreen key={`${activeMode.id}-${session}`} club={club} mode={activeMode} dataset={playerDataset} onRestart={() => setSession((value) => value + 1)} />}
  </div>
  if (welcomePage) return <WelcomeScreen clubId={club.id} />

  return <>
    {page === 'home' ? <HomeScreen
      gameModes={gameModes.filter(mode => mode.id !== 'goals')}
      onSelect={startGame}
    /> : <div className="app community-app">
      {page === 'profile' ? <ProfilePage clubId={club.id} gameModes={gameModes.filter(mode => mode.id !== 'tenable')} userId={publicProfileId} /> : <LeaderboardPage />}
    </div>}
    <BottomNavigation active={page} />
  </>
}

export default App
