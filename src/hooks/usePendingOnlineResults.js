import { useEffect, useState } from 'react'
import { onlineGameResults } from '../services/onlineGameResultsRuntime.js'

export default function usePendingOnlineResults(userId) {
  const key=userId??''
  const [result,setResult]=useState({key:'',count:0})
  useEffect(()=>{
    if(!key)return undefined
    const refresh=()=>setResult({key,count:onlineGameResults.pendingCount(key)})
    refresh()
    window.addEventListener('fcm-online-results-changed',refresh)
    return()=>window.removeEventListener('fcm-online-results-changed',refresh)
  },[key])
  return result.key===key?result.count:0
}
