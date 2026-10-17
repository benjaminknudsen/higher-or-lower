// Safari can settle its installed viewport after the initial layout or resume.
// Normal tabs keep CSS dvh; installed apps share one measured, border-box height.
export function installViewportSizing(win, doc) {
  if (!win.matchMedia('(display-mode: standalone)').matches && !win.navigator.standalone) return () => {}

  let frame = 0
  let settleFrame = 0
  let previousHeight = 0
  function measure() {
    const viewport = win.visualViewport
    // Pinch zoom must not resize/reflow the app under the user's fingers.
    if (viewport && viewport.scale !== 1) return
    const height = Math.round(viewport?.height ?? win.innerHeight)
    if (!Number.isFinite(height) || height <= 0 || height === previousHeight) return
    previousHeight = height
    doc.documentElement.style.setProperty('--app-viewport-height', `${height}px`)
  }
  function schedule() {
    win.cancelAnimationFrame(frame)
    win.cancelAnimationFrame(settleFrame)
    frame = win.requestAnimationFrame(() => {
      measure()
      // Let WebKit finish its launch/rotation layout without requiring a scroll.
      settleFrame = win.requestAnimationFrame(measure)
    })
  }
  function onVisibility() {
    if (doc.visibilityState === 'visible') schedule()
  }
  measure()
  schedule()
  win.addEventListener('resize', schedule)
  win.addEventListener('pageshow', schedule)
  win.visualViewport?.addEventListener('resize', schedule)
  doc.addEventListener('visibilitychange', onVisibility)
  return () => {
    win.cancelAnimationFrame(frame)
    win.cancelAnimationFrame(settleFrame)
    win.removeEventListener('resize', schedule)
    win.removeEventListener('pageshow', schedule)
    win.visualViewport?.removeEventListener('resize', schedule)
    doc.removeEventListener('visibilitychange', onVisibility)
    doc.documentElement.style.removeProperty('--app-viewport-height')
  }
}
