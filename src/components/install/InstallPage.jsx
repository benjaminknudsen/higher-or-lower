import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getInstallController, isAppleMobile, isEmbeddedBrowser, shareInstallLink, INSTALL_URL } from '../../services/installFlow'
import Icon from '../Icon'
import ThemeToggle from '../ThemeToggle'
import './InstallPage.css'
const highlights = [
  ['pitch','Flere spil','Gæt startopstillingen, Flest kampe og meget mere.'],
  ['trophy','Din statistik','Følg dine resultater og personlige rekorder.'],
  ['user','Udfordr vennerne','Se, hvem der kender FCM bedst.'],
]
export default function InstallPage() {
  const controller = getInstallController()
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  const [guide, setGuide] = useState(null)
  const [message, setMessage] = useState('')
  const [manualShare, setManualShare] = useState(false)
  const [sharing, setSharing] = useState(false)
  const dialogRef = useRef(null), installRef = useRef(null), sharePending = useRef(false)
  const apple = isAppleMobile(navigator), embedded = isEmbeddedBrowser(navigator)
  const ready = state.standalone || state.installed
  useEffect(() => {
    if (guide && !ready) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [guide, ready])
  function closeGuide() { setGuide(null); dialogRef.current?.close(); installRef.current?.focus({ preventScroll:true }) }
  async function install() {
    if (ready) { window.location.hash = '#forside'; return }
    setMessage('')
    if (apple) { setGuide('apple'); return }
    const result = await controller.requestInstall()
    if (result === 'manual') setGuide('other')
    else if (result === 'accepted') setMessage('Følg browserens installation. Åbn derefter FCM Games fra hjemmeskærmen.')
    else if (result === 'dismissed') setMessage('Du kan altid prøve igen eller spille i browseren.')
  }
  async function share() {
    if (sharePending.current) return
    sharePending.current = true; setSharing(true); setManualShare(false); setMessage('')
    try {
      const result = await shareInstallLink()
      if (result === 'copied') setMessage('Installationslinket er kopieret!')
      else if (result === 'shared') setMessage('Linket er delt.')
      else if (result === 'manual') { setManualShare(true); setMessage('Markér og kopiér linket nedenfor.') }
    } finally { sharePending.current = false; setSharing(false) }
  }
  const steps = guide === 'apple' ? [
    ['Åbn i Safari','Hvis linket er åbnet i en anden browser eller app, skal du først åbne det i Safari.'],
    ['Tryk på Del','Brug Safaris delingsknap – firkanten med pilen op.'],
    ['Føj til hjemmeskærm','Find handlingen i delingsmenuen. Den kan ligge længere nede på listen.'],
    ['Bekræft med Tilføj','Behold “Åbn som webapp” slået til, hvis valget vises.'],
    ['Du er klar til kamp','Åbn FCM Games fra det nye ikon på hjemmeskærmen.'],
  ] : [
    ['Åbn browserens menu','Brug en browser, der understøtter installation af webapps.'],
    ['Find installation','Vælg “Installer app” eller “Føj til hjemmeskærm”, hvis browseren tilbyder det. På computer kan valget ligge i adresselinjen.'],
    ['Bekræft i browseren','Følg browserens trin. Hvis valget mangler, kan du stadig spille her i browseren.'],
  ]
  return <main className="install-page" id="installer">
    <div className="install-shell">
      <header className="install-brand"><img src={`${import.meta.env.BASE_URL}app-logo.png`} alt="" /><span>FCM <b>Games</b></span><ThemeToggle /></header>
      <section className="install-hero" aria-labelledby="install-title">
        <div className="install-emblem" aria-hidden="true"><span /><img src={`${import.meta.env.BASE_URL}app-logo.png`} alt="" /><i><Icon name={ready ? 'check' : 'ball'} /></i></div>
        <p className="install-eyebrow">DIN KLUB. DINE SPIL.</p>
        <h1 id="install-title">{ready ? 'FCM Games er klar!' : <>FCM Games.<br /><em>Direkte på din mobil.</em></>}</h1>
        <p className="install-description">{ready ? 'Næste udfordring venter. Hvor godt kender du FCM?' : 'Quiz, spil og test din viden om FC Midtjylland – direkte fra din hjemmeskærm.'}</p>
      </section>
      {!ready && <section className="install-highlights" aria-label="Det får du med FCM Games">{highlights.map(([icon,title,text]) => <article key={title}><span><Icon name={icon} /></span><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>}
      <section className="install-actions" aria-label="Kom i gang">
        <button ref={installRef} type="button" className="install-primary" disabled={state.busy} onClick={install}><Icon name={ready ? 'arrow' : 'install'} />{ready ? 'Åbn FCM Games' : state.busy ? 'Åbner installation…' : 'Føj til hjemmeskærm'}</button>
        {!ready && <><a href="#forside" className="install-secondary">Spil i browseren <Icon name="arrow" /></a><p className="install-optional">Du kan altid spille uden at installere.</p></>}
      </section>
      <footer className="install-footer"><button type="button" onClick={share} disabled={sharing}><Icon name="share" />Del med venner</button><p role="status">{message}</p>{manualShare && <label className="install-copy-link">Installationslink<input value={INSTALL_URL} readOnly onFocus={event => event.currentTarget.select()} aria-label="Installationslink til kopiering" /></label>}</footer>
    </div>
    <dialog ref={dialogRef} className="install-guide" aria-labelledby="install-guide-title" onCancel={closeGuide} onClose={closeGuide} onClick={event => { if(event.target === event.currentTarget) { const r=event.currentTarget.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closeGuide() } }}>
      <header><span className="install-guide-icon"><Icon name={guide === 'apple' ? 'share' : 'install'} /></span><button type="button" onClick={closeGuide} aria-label="Luk installationsguide">×</button></header>
      <p className="install-eyebrow">ET PAR ENKLE TRIN</p><h2 id="install-guide-title">FCM Games på din hjemmeskærm</h2>
      {embedded && <p className="install-browser-note">Du ser ud til at være i en app-browser. Åbn linket i Safari på iPhone eller din almindelige browser på Android først.</p>}
      <ol>{steps.map(([title,text],index) => <li key={title}><span>{index+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      <button className="install-primary" type="button" onClick={closeGuide}>Forstået <Icon name="check" /></button>
    </dialog>
  </main>
}
