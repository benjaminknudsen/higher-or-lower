import Icon from './Icon'
import useHighScore from '../hooks/useHighScore'

export default function HomeHero({ clubId = 'fcm' }) {
  // Read the same per-club/mode record as gameplay; the home screen never saves scores.
  const { highScore } = useHighScore(clubId, 'appearances', 0, false)

  return <section className="home-hero" aria-labelledby="home-hero-title">
    <div className="home-hero-copy">
      <h2 id="home-hero-title">Du kender FCM.<br /><span>Men hvor godt?</span></h2>
      <div className="home-record" role="status" aria-live="polite" aria-atomic="true">
        <h3 className="home-record-label"><Icon name="trophy" />Din rekord</h3>
        <div className="home-record-result">
          <strong>{highScore}</strong>
          <div><span>rigtige i træk</span><p>Kan du slå den?</p></div>
        </div>
      </div>
    </div>
  </section>
}
