import Icon from './Icon'
import FootballShirt from './FootballShirt'

export default function Hero({ club }) {
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <div className="hero-kicker"><span className="club-dot" /> Et quizspil om {club.name}</div>
      <h1 id="hero-title" aria-label={`${club.shortName} Higher or Lower`}>Higher<br /><span>or Lower.</span></h1>
      <p className="hero-question">Hvor godt kender du {club.nickname}?</p>
      <p>Sammenlign spillerne gennem klubbens historie. Gæt højere eller lavere, og se, hvor langt din fodboldviden rækker.</p>
      <a className="primary-button" href="#spiltilstande">Find din udfordring <Icon name="arrow" /></a>
      <div className="hero-note">To spillere. Ét valg ad gangen.</div>
    </div>
    <div className="hero-art" aria-hidden="true">
      <div className="preview-heading"><Icon name="shirt" /><span>Samme klub. Forskellige historier.</span></div>
      <div className="preview-matchup">
        <div className="preview-player"><div className="preview-shirt"><FootballShirt /></div><span>Den første spiller</span><strong>Higher <span>↑</span></strong></div>
        <span className="preview-versus">vs</span>
        <div className="preview-player preview-challenger"><div className="preview-shirt"><FootballShirt /></div><span>Den næste spiller</span><strong>Lower <span>↓</span></strong></div>
      </div>
      <p className="preview-caption">Din viden. Dit næste gæt.</p>
    </div>
  </section>
}
