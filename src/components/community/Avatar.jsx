import { useEffect, useState } from 'react'
import useProfilePhoto from '../../hooks/useProfilePhoto'
import Icon from '../Icon'

function OwnPhoto() {
  const { blob } = useProfilePhoto()
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(null)
  useEffect(() => {
    if (!blob) return
    const next = URL.createObjectURL(blob)
    // The effect owns the URL lifetime, including React Strict Mode cleanup.
    // oxlint-disable-next-line react/set-state-in-effect
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return blob && url && failed !== url ? <img src={url} alt="" onError={() => setFailed(url)} /> : <Icon name="user" />
}
export default function Avatar({ self = false }) {
  return <span className={`fan-avatar ${self ? 'fan-avatar-self' : ''}`} aria-hidden="true">{self ? <OwnPhoto /> : <Icon name="user" />}</span>
}
