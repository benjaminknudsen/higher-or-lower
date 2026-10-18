import { useCallback, useEffect, useState } from 'react'
import { ACCOUNT_EVENT, localAccountStore } from '../services/localAccount'

export default function useLocalAccount(clubId) {
  const read = useCallback(() => ({ profile: localAccountStore.loadProfile(), statistics: localAccountStore.loadStatistics(clubId), persistent: localAccountStore.persistent }), [clubId])
  const [account, setAccount] = useState(read)
  useEffect(() => {
    const sync = () => setAccount(read())
    window.addEventListener(ACCOUNT_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ACCOUNT_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [read])
  return { ...account, saveProfile: localAccountStore.saveProfile }
}
