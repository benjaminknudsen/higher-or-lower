import HomeHero from './HomeHero'
import GameModeCard from './GameModeCard'
import HighScoreMedal from './HighScoreMedal'
import Icon from './Icon'
import useHighScore from '../hooks/useHighScore'

export default function HomeScreen({ clubId, gameModes, onSelect, highScorePage, onCloseHighScore }) {
  const { highScore } = useHighScore(clubId, 'appearances', 0, false)

  return <div className="app menu-app">
    <a className="skip-link" href={highScorePage ? '#personlig-rekord' : '#spiltilstande'}>Spring til indhold</a>
    <header className="menu-header">
      <span className="menu-brand-icon" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}app-logo.png`} alt="" /></span>
      <h1><span>FCM</span> Higher or Lower</h1>
      {highScorePage
        ? <button className="menu-record-nav menu-record-back" type="button" onClick={onCloseHighScore} aria-label="Tilbage til forsiden">
          <Icon name="arrow" />
        </button>
        : <a className="menu-record-nav" href="#rekord" aria-label={`Vis personlig rekord: ${highScore} rigtige i træk`}>
          <HighScoreMedal score={highScore} compact />
        </a>}
    </header>
    {highScorePage
      ? <main className="high-score-page" id="personlig-rekord" aria-label={`Personlig rekord: ${highScore} rigtige i træk`}>
        <HighScoreMedal score={highScore} />
        <p className="home-record-prompt">Kan du slå den?</p>
      </main>
      : <main className="menu-main" id="indhold">
        <HomeHero />
        <section className="menu-grid" id="spiltilstande" aria-label="Vælg spiltilstand">
          {gameModes.map(mode => <GameModeCard key={mode.id} mode={mode} onSelect={onSelect} />)}
        </section>
      </main>}
  </div>
}
