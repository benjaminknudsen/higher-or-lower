const DATABASE = 'fcm-games-profile-photo'
const STORE = 'photos'
const KEY = 'self'

// A single Blob record; this adapter can later be replaced by remote storage.
export function createProfilePhotoRepository(indexedDB) {
  async function run(mode, operation) {
    if (!indexedDB) throw new Error('Billedlagring er ikke tilgængelig i denne browser.')
    const db = await new Promise((resolve, reject) => {
      let blocked = false
      const request = indexedDB.open(DATABASE, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(STORE)
      request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result) }
      request.onerror = () => reject(request.error)
      request.onblocked = () => { blocked = true; reject(new Error('Luk andre faner med appen, og prøv igen.')) }
    })
    db.onversionchange = () => db.close()
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = operation(transaction.objectStore(STORE))
        transaction.oncomplete = () => resolve(request.result ?? null)
        transaction.onerror = () => reject(transaction.error || new Error('Billedet kunne ikke gemmes.'))
        transaction.onabort = () => reject(transaction.error || new Error('Billedlagringen blev afbrudt.'))
      })
    } finally { db.close() }
  }
  return {
    load: () => run('readonly', store => store.get(KEY)),
    save: blob => run('readwrite', store => store.put(blob, KEY)),
    remove: () => run('readwrite', store => store.delete(KEY)),
  }
}
