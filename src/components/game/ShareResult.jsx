import { useEffect, useRef, useState } from 'react'
import { resultShareText, shareOrCopy } from '../../game/sharing'

export default function ShareResult({ club, mode, score, highScore, testData }) {
  const [status, setStatus] = useState('idle')
  const busyRef = useRef(false)
  const mountedRef = useRef(false)
  const text = resultShareText({ clubName: club.shortName, modeTitle: mode.title, score, highScore, testData })

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  async function handleShare() {
    if (busyRef.current) return
    busyRef.current = true
    setStatus('sharing')
    try {
      const next = await shareOrCopy({ title: `${club.shortName} ${mode.title}`, text })
      if (mountedRef.current) setStatus(next)
    } finally { busyRef.current = false }
  }

  const message = status === 'copied' ? 'Kopieret! Send den til en, der praler.' : status === 'shared' ? 'Resultatet er delt.' : status === 'manual' ? 'Markér teksten herunder, og kopiér den.' : ''
  return <div className="share-result">
    <button className="share-button" disabled={status === 'sharing'} onClick={handleShare}>
      {status === 'sharing' ? 'Et øjeblik…' : 'Del dit resultat'}
    </button>
    <p className="share-status" role="status" aria-live="polite">{message || '\u00a0'}</p>
    {status === 'manual' && <textarea className="share-text" aria-label="Resultattekst til kopiering" value={text} readOnly rows={4} onFocus={(event) => event.target.select()} />}
  </div>
}
