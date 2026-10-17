const steps = [
  ['Vælg en udfordring', 'Find den statistik, du vil prøve kræfter med. Flest kampe er den første spiltype.'],
  ['Sammenlign spillerne', 'Har den næste spiller et højere eller lavere tal? Vælg HIGHER eller LOWER.'],
  ['Byg din stime', 'Hvert rigtigt svar giver ét point. Et forkert svar afslutter spillet, og du kan prøve igen.'],
]

export default function HowToPlay() {
  return <section className="how-section" id="saadan-spiller-du" aria-labelledby="how-title">
    <div className="section-heading"><div><span className="eyebrow">Sådan spiller du</span><h2 id="how-title">Et enkelt valg. En ny udfordring.</h2></div></div>
    <ol className="steps">{steps.map(([title, description], index) => <li key={title}><span className="step-number">{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
    <p className="rules-footnote">Hvis spillerne har samme tal, tæller begge svar som rigtige.</p>
  </section>
}
