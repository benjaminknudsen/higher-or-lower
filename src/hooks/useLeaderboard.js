import { useEffect, useState } from 'react'
import { onlinePlatform } from '../services/onlinePlatformRuntime.js'

const PAGE_SIZE = 25
// The public leaderboard is exclusively Higher or Lower – Flest kampe.
const GAME_TYPE = 'appearances'

export default function useLeaderboard(userId) {
  const key=`${GAME_TYPE}:${userId??''}`
  const [result, setResult] = useState({ key:'',entries: [], ownEntries: [], total: 0, loading: true, loadingMore: false, failed: false, error: '' })
  useEffect(() => {
    let current = true
    onlinePlatform.listLeaderboard(GAME_TYPE, { limit: PAGE_SIZE, offset: 0 }).then(data => {
      if (current) setResult({
        key,
        ...data,
        entries: userId ? data.entries.map(entry => ({ ...entry, isSelf: entry.playerId === userId })) : data.entries,
        ownEntries: userId ? data.ownEntries : [],
        loading: false, loadingMore: false, failed: false, error: '',
      })
    }).catch(error => {
      if (current) setResult({ key,entries: [], ownEntries: [], total: 0, loading: false, loadingMore: false, failed: true, error: error.message })
    })
    return () => { current = false }
  }, [userId, key])
  async function loadMore() {
    if (result.key!==key||result.loading || result.loadingMore || result.failed || result.entries.length >= result.total) return
    setResult(previous => ({ ...previous, loadingMore: true }))
    try {
      const data = await onlinePlatform.listLeaderboard(GAME_TYPE, { limit: PAGE_SIZE, offset: result.entries.length })
      setResult(previous => ({
        ...previous,
        entries: [...previous.entries, ...data.entries.map(entry => ({ ...entry, isSelf: entry.playerId === userId }))],
        ownEntries: userId ? data.ownEntries : [],
        total: data.total,
        loadingMore: false,
      }))
    } catch (error) {
      setResult(previous => ({ ...previous, loadingMore: false, error: error.message }))
    }
  }
  if(result.key!==key)return {entries:[],ownEntries:[],total:0,loading:true,loadingMore:false,failed:false,error:'',loadMore}
  return { ...result, loadMore }
}
