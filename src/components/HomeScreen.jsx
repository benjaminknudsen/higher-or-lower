import ThemeToggle from './ThemeToggle'
import HomeHero from './HomeHero'
import GameModeCard from './GameModeCard'
import Icon from './Icon'

export default function HomeScreen({ gameModes, onSelect }) {
  return <div className="app menu-app has-bottom-nav">
    <a className="skip-link" href="#spiltilstande">Spring til indhold</a>
    <header className="menu-header">
      <a className="menu-welcome-back" href="#velkommen" aria-label="Tilbage til velkomstsiden"><Icon name="arrow" /></a>
      <span className="menu-brand-icon" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}app-logo.png`} alt="" /></span>
      <h1><span>FCM</span> Games</h1><ThemeToggle />
    </header>
    <main className="menu-main" id="indhold">
      <HomeHero />
      <section className="menu-grid" id="spiltilstande" aria-label="Vælg spiltilstand">
        {gameModes.map(mode => <GameModeCard key={mode.id} mode={mode} onSelect={onSelect} />)}
      </section>
    </main>
  </div>
}
