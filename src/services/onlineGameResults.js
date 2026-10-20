const PREFIX = 'fcm.online-results.v1:'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CHANGE_EVENT = 'fcm-online-results-changed'
const FAILURE_EVENT = 'fcm-online-result-error'

function notifyChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function reportOnlineResultError(userId,message) {
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(FAILURE_EVENT,{detail:{userId,message}}))
}

function validResult(result) {
  if (!result || !UUID.test(result.resultId) || !['appearances', 'goals', 'lineup'].includes(result.gameType)
      || typeof result.isPerfect!=='boolean'
      || ![result.score, result.answers, result.correct, result.durationMs].every(Number.isSafeInteger)
      || result.score < 0 || result.answers < 0 || result.correct < 0 || result.durationMs < 0) return false
  if (result.gameType === 'lineup') return result.score <= 110 && result.score % 5 === 0
    && result.answers === 11 && result.correct <= 11
    && Number.isSafeInteger(result.hints) && result.hints >= 0 && result.hints <= 11
    && Number.isSafeInteger(result.errors) && result.errors >= 0 && result.errors <= 3
    && result.hints * 5 <= result.correct * 10
    && result.score === Math.max(0, result.correct * 10 - result.hints * 5)
    && result.correct + result.errors <= 13 && (result.correct < 11 || result.errors < 3)
    && result.durationMs <= 180000
    && result.isPerfect === (result.correct === 11)
  return result.score <= 160 && result.answers >= 1 && result.answers <= 160
    && result.score <= result.answers && result.answers <= result.score + 1
    && result.correct === result.score && result.hints === null && result.errors === null
    && !result.isPerfect && result.durationMs === 0
}

function normalizeStoredResult(result) {
  if (!result || typeof result !== 'object') return result
  if (result.gameType !== 'lineup' && !Object.hasOwn(result, 'hints') && !Object.hasOwn(result, 'errors')) {
    return { ...result, hints: null, errors: null }
  }
  if (result.gameType === 'lineup' && !Object.hasOwn(result, 'hints') && !Object.hasOwn(result, 'errors')) {
    const inferredHints = (result.correct * 10 - result.score) / 5
    return { ...result, hints: inferredHints, errors: 0, isPerfect: result.correct === 11 }
  }
  return result
}

function key(userId) {
  if (!UUID.test(userId ?? '')) throw new Error('Ugyldigt konto-ID til resultatsynkronisering.')
  return PREFIX + userId
}

export function createOnlineGameResults(client, storage) {
  function read(userId) {
    const raw = storage?.getItem(key(userId))
    if (!raw) return []
    try {
      const rawQueue = JSON.parse(raw)
      if(!Array.isArray(rawQueue))throw new Error()
      const normalized = rawQueue.map(normalizeStoredResult)
      if(normalized.some(result=>!validResult(result)))throw new Error()
      return normalized
    } catch {
      throw new Error('Den lokale kø med usynkroniserede resultater kunne ikke læses.')
    }
  }
  function write(userId, queue) {
    if (!storage) throw new Error('Lokal lagring er utilgængelig; resultatet kan ikke kø-synkroniseres.')
    try {
      if (queue.length) storage.setItem(key(userId), JSON.stringify(queue))
      else storage.removeItem(key(userId))
      notifyChanged()
    } catch {
      throw new Error('Lokal lagring er fuld; resultatet kan ikke gemmes til senere synkronisering.')
    }
  }
  async function flush(userId) {
    if (!client) return { ok: false, pending: read(userId).length, message: 'Supabase er ikke konfigureret.' }
    const queue = read(userId)
    for (let index = 0; index < queue.length; index++) {
      const result = queue[index]
      try {
        const { error } = await client.rpc('submit_game_result', {
          p_user_id: userId,
          p_game_type: result.gameType,
          p_result_id: result.resultId,
          p_score: result.score,
          p_answers: result.answers,
          p_correct: result.correct,
          p_hints: result.hints,
          p_errors: result.errors,
          p_is_perfect: result.isPerfect,
          p_duration_ms: result.durationMs,
        })
        if (error) return { ok: false, pending: queue.length, message: 'Resultatet afventer synkronisering. Kontrollér forbindelsen, og prøv igen.' }
      } catch {
        return { ok: false, pending: queue.length, message: 'Resultatet afventer synkronisering. Kontrollér forbindelsen, og prøv igen.' }
      }
      queue.splice(index, 1)
      index--
      write(userId, queue)
    }
    return { ok: true, pending: 0, message: '' }
  }
  return {
    pendingCount(userId) {
      try { return read(userId).length } catch { return -1 }
    },
    async submit(userId, result) {
      if (!validResult(result)) return { ok: false, pending: 0, message: 'Resultatet matcher ikke spillets format.' }
      const queue = read(userId)
      const previous=queue.find(item => item.gameType === result.gameType && item.resultId === result.resultId)
      if(previous&&JSON.stringify(previous)!==JSON.stringify(result))return {ok:false,pending:queue.length,message:'Resultat-ID’et er allerede knyttet til andre data.'}
      if (!previous) {
        queue.push(result)
        write(userId, queue)
      }
      return flush(userId)
    },
    flush,
  }
}
