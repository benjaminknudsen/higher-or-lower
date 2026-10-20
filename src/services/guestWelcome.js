const KEY = 'fcm.guest-welcome.v1'

export const isGuestWelcomeHome = hash => ['', '#velkommen', '#forside', '#spiltilstande'].includes(hash)

export function createGuestWelcomeSession(storage) {
  let seenInMemory = false
  let wasSignedIn = false
  function seen() {
    try { return seenInMemory || storage?.getItem(KEY) === 'shown' }
    catch { return seenInMemory }
  }
  return {
    accountChanged(status) {
      if (status === 'signed-in') wasSignedIn = true
      if (status === 'guest' && wasSignedIn) {
        wasSignedIn = false
        seenInMemory = false
        try { storage?.removeItem(KEY) } catch { /* Memory still allows a new invitation after logout. */ }
      }
    },
    canShow({ ready, status, hash, modalOpen = false, visible = true }) {
      return Boolean(ready && status === 'guest' && isGuestWelcomeHome(hash) && !modalOpen && visible && !seen())
    },
    markShown() {
      seenInMemory = true
      try { storage?.setItem(KEY, 'shown') } catch { /* Once per page lifetime if sessionStorage is blocked. */ }
    },
  }
}
