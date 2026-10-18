import { useEffect, useState } from 'react'
import { clubs, gameModes as modeDefinitions } from './data/game'
import HomeScreen from './components/HomeScreen'
import WelcomeScreen from './components/WelcomeScreen'
import BottomNavigation from './components/BottomNavigation'
import ProfilePage from './components/community/ProfilePage'
import LeaderboardPage from './components/community/LeaderboardPage'
import GameScreen from './components/game/GameScreen'
import playerDataset from './data/players.json'
import { getVerifiedPlayers } from './data/quality'
import './App.css'
import './Home.css'
import './Community.css'

function App() {
  const club = clubs.fcm
  const gameModes = modeDefinitions.map((mode) => {
    const ready = mode.id === 'appearances' && mode.implemented && getVerifiedPlayers(playerDataset, club.id, mode.statisticKey).length >= 2
    return { ...mode, available: Boolean(ready), dataPending: Boolean(mode.implemented && !ready) }
  })
  const [hash, setHash] = useState(() => window.location.hash)
  const [session, setSession] = useState(0)
  const activeMode = gameModes.find((mode) => mode.implemented && hash === `#spil/${mode.id}`)
  const highScorePage = hash === '#rekord'
  const welcomePage = !hash || hash === '#velkommen'
  const page = hash === '#profil' ? 'profile' : hash === '#leaderboard' ? 'leaderboard' : 'home'

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!activeMode && (welcomePage || ['#forside', '#profil', '#leaderboard'].includes(hash))) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      document.getElementById(welcomePage ? 'welcome-title' : 'page-title')?.focus({ preventScroll: true })
    } else if (!activeMode && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
  }, [activeMode, hash, welcomePage])

  const startGame = (modeId) => {
    setSession((value) => value + 1)
    window.location.assign(`#spil/${modeId}`)
  }
  if (activeMode) return <div className="app gameplay-app" style={{ '--club-accent': club.accent }}>
    <GameScreen key={`${activeMode.id}-${session}`} club={club} mode={activeMode} dataset={playerDataset} onRestart={() => setSession((value) => value + 1)} />
  </div>
  if (welcomePage) return <WelcomeScreen clubId={club.id} />

  return <>
    {page === 'home' ? <HomeScreen
      clubId={club.id}
      gameModes={gameModes}
      onSelect={startGame}
      highScorePage={highScorePage}
      onCloseHighScore={() => {
        window.location.hash = '#forside'
      }}
    /> : <div className="app community-app">
      {page === 'profile' ? <ProfilePage clubId={club.id} gameModes={gameModes} /> : <LeaderboardPage clubId={club.id} gameModes={gameModes} />}
    </div>}
    <BottomNavigation active={highScorePage ? 'profile' : page} />
  </>
}

export default App
