import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import GameSession from '../src/components/game/GameSession'
import { clubs, gameModes } from '../src/data/game'
import fixture from '../src/data/fixtures/players.test.json'
import '../src/index.css'
import '../src/App.css'

// Separate Vite development entry. Not imported by App or included in the production build.
// Demo records use separate IDs and cannot overwrite real personal bests.
if (!import.meta.env.DEV) throw new Error('This fixture preview is for development only.')

export default function Preview() {
  const [session, setSession] = useState(0)
  useEffect(() => {
    const leavePreview = () => { if (window.location.hash === '#spiltilstande') window.location.assign('/#spiltilstande') }
    window.addEventListener('hashchange', leavePreview)
    return () => window.removeEventListener('hashchange', leavePreview)
  }, [])
  const club = { ...clubs.fcm, id: 'dev-fcm' }
  const mode = { ...gameModes.find(mode => mode.id === 'goals'), id: 'dev-goals' }
  return <div className="app gameplay-app" style={{ '--club-accent': club.accent }}>
    <GameSession key={session} club={club} mode={mode} players={fixture.clubs.fcm.players} testData dataNotice="Fiktive spillere og tal. Kun udviklingstest." onRestart={() => setSession(value => value + 1)} />
  </div>
}

createRoot(document.getElementById('root')).render(<StrictMode><Preview /></StrictMode>)
