import { useEffect, useRef } from 'react'
import useAuthAccount from '../../hooks/useAuthAccount.js'
import { authAccount } from '../../services/authAccount.js'
import { createGuestWelcomeSession, isGuestWelcomeHome } from '../../services/guestWelcome.js'
import './GuestWelcome.css'

let storage
try { storage = window.sessionStorage } catch { /* Use the in-memory session fallback. */ }
const invitation = createGuestWelcomeSession(storage)

export default function GuestWelcome({ ready }) {
  const account = useAuthAccount()
  const dialogRef = useRef(null)
  const returnFocus = useRef(null)
  const handingOff = useRef(false)

  function restoreFocus() {
    const target = returnFocus.current
    if (target?.isConnected && !document.querySelector('dialog[open]')) target.focus({ preventScroll: true })
  }
  function dismiss(mode) {
    handingOff.current = Boolean(mode)
    dialogRef.current?.close()
    restoreFocus()
    if (mode) authAccount.open(mode)
  }

  useEffect(() => {
    invitation.accountChanged(account.status)
    const dialog = dialogRef.current
    let frame
    function reconcile() {
      const otherModal = [...document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]')].some(element => element !== dialog)
      const modalOpen = Boolean(account.mode || otherModal)
      const eligible = ready && account.status === 'guest' && isGuestWelcomeHome(window.location.hash) && !modalOpen
      if (dialog.open) {
        if (!eligible) dialog.close()
        return
      }
      if (!invitation.canShow({ ready, status: account.status, hash: window.location.hash, modalOpen, visible: document.visibilityState === 'visible' })) return
      const focused = document.activeElement
      returnFocus.current = focused && focused !== document.body ? focused : document.querySelector('#welcome-title, .menu-mode-playable, .menu-header a')
      handingOff.current = false
      dialog.showModal()
      invitation.markShown()
      dialog.querySelector('.guest-welcome-primary')?.focus({ preventScroll: true })
    }
    function schedule() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(reconcile)
    }
    const observer = new MutationObserver(schedule)
    function navigation() {
      const home = isGuestWelcomeHome(window.location.hash)
      if (!home) dialog.close()
      observer.disconnect()
      if (ready && account.status === 'guest' && home && !account.mode) {
        observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open', 'aria-modal'] })
      }
      schedule()
    }
    window.addEventListener('hashchange', navigation)
    window.addEventListener('pageshow', schedule)
    document.addEventListener('visibilitychange', schedule)
    navigation()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('hashchange', navigation)
      window.removeEventListener('pageshow', schedule)
      document.removeEventListener('visibilitychange', schedule)
      dialog.close()
    }
  }, [account.status, account.mode, ready])

  return <dialog ref={dialogRef} className="guest-welcome-dialog" aria-labelledby="guest-welcome-title" aria-describedby="guest-welcome-description"
    onCancel={event => { event.preventDefault(); dismiss() }} onClose={() => { if (!handingOff.current) restoreFocus() }}>
    <button className="guest-welcome-close" type="button" aria-label="Luk velkomst" onClick={() => dismiss()}>×</button>
    <div className="guest-welcome-icon" aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="currentColor" focusable="false">
        <path d="M50 48c-8 0-10 10-17 16l-8 8c-6 6-5 12 1 15 7 4 15-3 24-3s17 7 24 3c6-3 7-9 1-15l-8-8c-7-6-9-16-17-16Z" />
        <ellipse cx="23" cy="43" rx="9" ry="13" transform="rotate(-28 23 43)" />
        <ellipse cx="39" cy="27" rx="9" ry="14" transform="rotate(-12 39 27)" />
        <ellipse cx="61" cy="27" rx="9" ry="14" transform="rotate(12 61 27)" />
        <ellipse cx="77" cy="43" rx="9" ry="13" transform="rotate(28 77 43)" />
        <path d="m12 27-1-9 7 6Zm22-17 2-9 4 8Zm26-1 4-8 2 9Zm22 15 7-6-1 9Z" />
      </svg>
    </div>
    <h2 id="guest-welcome-title">Bliv en del af FCM Games</h2>
    <p id="guest-welcome-description">Opret en gratis konto, gem dine rekorder, saml medaljer og kæmp om pladserne på leaderboardet.</p>
    <div className="guest-welcome-actions">
      <button className="guest-welcome-primary" type="button" onClick={() => dismiss('signup')}>Opret gratis konto</button>
      <button className="guest-welcome-login" type="button" onClick={() => dismiss('login')}>Jeg har allerede en konto</button>
      <button className="guest-welcome-guest" type="button" onClick={() => dismiss()}>Fortsæt som gæst</button>
    </div>
  </dialog>
}
