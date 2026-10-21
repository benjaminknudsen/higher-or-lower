import { useState } from 'react'
import PlayerSilhouetteFallback from './PlayerSilhouetteFallback'
import './PlayerIllustration.css'

const STANDARD_IMAGE = '/images/player-silhouette.webp'
// JS-built public URLs need Vite's deployment prefix; CSS URLs are rewritten by Vite.
const deployedImagePath = path => `${import.meta.env.BASE_URL}${path.slice(1)}`
function localImagePath(value) {
  if (typeof value !== 'string' || !/^\/(?!\/)[^?#\\]+\.(png|jpe?g|webp|avif|svg)$/i.test(value)) return null
  try {
    const decoded = decodeURIComponent(value)
    return decoded.includes('..') || decoded.includes('\\') || decoded.startsWith('//') ? null : value
  } catch { return null }
}

// One original anonymous asset for every player. No real-player likeness or number.
export default function PlayerIllustration({ name, imageSrc, silhouetteSrc = STANDARD_IMAGE, shadow = false, broadcast = false }) {
  const standardImage = localImagePath(silhouetteSrc) ?? STANDARD_IMAGE
  const [failedImages, setFailedImages] = useState([])
  const fail = path => setFailedImages(previous => previous.includes(path) ? previous : [...previous, path])
  // Broadcast cards reveal existing artwork detail without inventing player portraits.
  if (broadcast) {
    const customImage = localImagePath(imageSrc)
    const path = [customImage, standardImage, STANDARD_IMAGE].find(value => value && !failedImages.includes(value))
    return path ? <img className={`player-illustration player-illustration-broadcast ${path === customImage ? 'player-illustration-photo' : 'player-illustration-artwork'}`}
      src={deployedImagePath(path)} alt="" draggable="false" onError={() => fail(path)} /> : <PlayerSilhouetteFallback name={name} />
  }
  // Gameplay shadows use anonymous contours: no real player photo or shirt print.
  if (shadow) {
    const shadowImage = failedImages.includes(standardImage) ? STANDARD_IMAGE : standardImage
    return failedImages.includes(shadowImage) ? null : <img
      className="player-illustration player-illustration-shadow"
      src={deployedImagePath(shadowImage)} alt="" draggable="false" onError={() => fail(shadowImage)} />
  }
  const customImage = localImagePath(imageSrc)
  if (customImage && !failedImages.includes(customImage)) return <img className="player-illustration player-illustration-photo" src={deployedImagePath(customImage)} alt="" draggable="false" onError={() => fail(customImage)} />
  if (failedImages.includes(standardImage)) return <PlayerSilhouetteFallback name={name} />

  const words = name.trim().split(/\s+/)
  const lines = name.length > 18 && words.length > 1
    ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
    : [name]
  return <svg className="player-illustration player-illustration-realistic" viewBox="0 0 280 420" fill="none" aria-hidden="true" focusable="false">
    <image href={deployedImagePath(standardImage)} width="280" height="420" preserveAspectRatio="xMidYMid meet" onError={() => fail(standardImage)} />
    {lines.map((line, index) => <text key={index} x="140" y={lines.length > 1 ? 133 + index * 11 : 139}
      textAnchor="middle" fill="#eee9e9" fontFamily="Arial, sans-serif" fontWeight="700"
      fontSize={line.length > 15 ? 8 : 9} letterSpacing=".6"
      textLength={line.length > 15 ? 87 : undefined} lengthAdjust="spacingAndGlyphs">{line.toLocaleUpperCase('da-DK')}</text>)}
  </svg>
}
