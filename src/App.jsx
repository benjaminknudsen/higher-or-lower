import { useEffect, useState } from 'react'
import { clubs, gameModes as modeDefinitions } from './data/game'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/game/GameScreen'
import playerDataset from './data/players.json'
import { getVerifiedPlayers } from './data/quality'
import './App.css'
import './Home.css'

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

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!activeMode && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
  }, [activeMode, hash])

  const startGame = (modeId) => {
    setSession((value) => value + 1)
    window.location.assign(`#spil/${modeId}`)
  }
  if (activeMode) return <div className="app gameplay-app" style={{ '--club-accent': club.accent }}>
    <GameScreen key={`${activeMode.id}-${session}`} club={club} mode={activeMode} dataset={playerDataset} onRestart={() => setSession((value) => value + 1)} />
  </div>

  return <HomeScreen
    clubId={club.id}
    gameModes={gameModes}
    onSelect={startGame}
    highScorePage={highScorePage}
    onCloseHighScore={() => {
      window.history.pushState(null, '', window.location.pathname + window.location.search)
      setHash('')
    }}
  />
}

export default App
