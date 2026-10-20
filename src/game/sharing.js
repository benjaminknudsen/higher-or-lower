export function resultShareText({ clubName, modeTitle, score, highScore, testData = false }) {
  const gameTitle = modeTitle.startsWith('Higher or Lower') ? modeTitle : `Higher or Lower – ${modeTitle}`
  return `Jeg fik ${score} rigtige i træk i ${clubName} ${gameTitle}! Min rekord er ${highScore}. Hvem slår den? ⚽${testData ? ' (Fiktive testdata)' : ''}`
}

export async function shareOrCopy({ title, text }, platform = globalThis.navigator) {
  try {
    if (typeof platform?.share === 'function') {
      await platform.share({ title, text })
      return 'shared'
    }
  } catch (error) {
    // Cancelling the native sheet is intentional. Do not silently copy afterward.
    if (error?.name === 'AbortError') return 'cancelled'
  }
  try {
    if (typeof platform?.clipboard?.writeText === 'function') {
      await platform.clipboard.writeText(text)
      return 'copied'
    }
  } catch { /* Restricted contexts: offer selectable text instead. */ }
  return 'manual'
}
