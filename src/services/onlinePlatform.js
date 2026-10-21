export const GAME_TYPES = Object.freeze(['appearances', 'goals', 'lineup'])
export const ONLINE_STAT_COLUMNS = 'game_type,games_played,best_score,total_answers,total_correct,perfect_games,updated_at'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function publicAttemptsForGame(attempts, gameType) {
  if (!Array.isArray(attempts?.[gameType])) throw new Error('Spillerprofilen indeholder ugyldige forsøgsdata.')
  return attempts[gameType].slice(0, 3).map((attempt, index) => {
    const createdAt = new Date(attempt.created_at)
    if (!Number.isSafeInteger(attempt.score) || attempt.score < 0 || !Number.isFinite(createdAt.getTime())) {
      throw new Error('Spillerprofilen indeholder ugyldige forsøgsdata.')
    }
    return { id: `${gameType}:${index}`, score: attempt.score, createdAt: createdAt.toISOString() }
  })
}

export function createOnlinePlatform(client) {
  return {
    async getStats(userId, gameType) {
      if (!client) throw new Error('Online statistik er ikke konfigureret.')
      if (!userId || !GAME_TYPES.includes(gameType)) throw new Error('Ugyldig konto eller spiltype.')
      const { data, error } = await client.from('game_stats').select(ONLINE_STAT_COLUMNS)
        .eq('user_id', userId).eq('game_type', gameType).maybeSingle()
      if (error) throw new Error('Online-statistikken kunne ikke hentes.')
      return data ?? { game_type: gameType, games_played: 0, best_score: 0, total_answers: 0, total_correct: 0, perfect_games: 0 }
    },
    async getPublicProfile(userId) {
      if (!client) throw new Error('Online profiler er ikke konfigureret.')
      if (typeof userId !== 'string' || !UUID_PATTERN.test(userId)) throw new Error('Profilens link er ugyldigt.')
      const { data, error } = await client.rpc('get_public_player_profile', { p_user_id: userId })
      if (error?.code === 'PGRST202') throw new Error('Offentlige profiler kræver Supabase-migration 006.')
      if (error) throw new Error('Spillerens offentlige profil kunne ikke hentes.')
      if (data === null) return null
      if (data?.public_profile_version !== 1 || typeof data.profile?.id !== 'string'
        || data.profile.id.toLowerCase() !== userId.toLowerCase()
        || typeof data.profile.username !== 'string' || !Array.isArray(data.stats)
        || !data.attempts || typeof data.attempts !== 'object') {
        throw new Error('Spillerprofilen indeholder ugyldige data.')
      }
      const stats = Object.fromEntries(data.stats.map(row => {
        if (!GAME_TYPES.includes(row.game_type)
          || !['games_played', 'best_score', 'total_answers', 'total_correct', 'perfect_games'].every(key => Number.isSafeInteger(row[key]) && row[key] >= 0)) {
          throw new Error('Spillerprofilen indeholder ugyldige statistikdata.')
        }
        return [row.game_type, row]
      }))
      for (const gameType of ['appearances', 'lineup']) {
        stats[gameType] ??= {
          game_type: gameType, games_played: 0, best_score: 0, total_answers: 0, total_correct: 0, perfect_games: 0,
        }
      }
      return {
        profile: { id: data.profile.id, username: data.profile.username, avatar_path: data.profile.avatar_path ?? null },
        stats,
        attempts: {
          appearances: publicAttemptsForGame(data.attempts, 'appearances'),
          lineup: publicAttemptsForGame(data.attempts, 'lineup'),
        },
      }
    },
    async listLeaderboard(gameType, { limit = 25, offset = 0 } = {}) {
      if (!client) throw new Error('Online leaderboard er ikke konfigureret.')
      if (!GAME_TYPES.includes(gameType) || !Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(offset) || offset < 0 || offset > 5000) {
        throw new Error('Ugyldig leaderboardforespørgsel.')
      }
      const { data, error } = await client.rpc('get_game_leaderboard', {
        p_game_type: gameType, p_limit: limit, p_offset: offset,
      })
      if (error) throw new Error('Leaderboard kunne ikke hentes.')
      if (data?.attempt_leaderboard_version !== 1) {
        throw new Error('Forsøgsranglisten kræver migration 005 i Supabase.')
      }
      const entries = Array.isArray(data?.entries) ? data.entries.map(entry => ({
        id: `${entry.user_id}:${entry.result_id}`,
        playerId: entry.user_id,
        name: entry.username,
        avatarPath: entry.avatar_path,
        score: entry.score,
        rank: entry.rank,
        resultId: entry.result_id,
      })) : []
      const ownEntries = Array.isArray(data?.own_entries) ? data.own_entries.map(entry => ({
        id: `${entry.user_id}:${entry.result_id}`,
        playerId: entry.user_id,
        name: entry.username,
        avatarPath: entry.avatar_path,
        score: entry.score,
        rank: entry.rank,
        resultId: entry.result_id,
        isSelf: true,
      })) : []
      return { entries, ownEntries, total: Number.isSafeInteger(data?.total) ? data.total : 0, source: 'online' }
    },
    async getMyTopThreeResults(userId, gameType) {
      if (!client) throw new Error('Online forsøg er ikke konfigureret.')
      if (!userId || !GAME_TYPES.includes(gameType)) throw new Error('Ugyldig konto eller spiltype.')
      const { data, error } = await client.rpc('get_my_top_three_results', { p_game_type: gameType })
      if (error) throw new Error('Dine bedste forsøg kunne ikke hentes.')
      if (data?.top_three_version !== 1 || !Array.isArray(data.attempts)) {
        throw new Error('Dine 3 bedste forsøg kræver migration 004 i Supabase.')
      }
      return (Array.isArray(data?.attempts) ? data.attempts : []).slice(0, 3).map(attempt => {
        const createdAt = new Date(attempt.created_at)
        if (!Number.isSafeInteger(attempt.score) || attempt.score < 0 || !Number.isFinite(createdAt.getTime())) {
          throw new Error('Dine bedste forsøg indeholder ugyldige data.')
        }
        return { id: attempt.result_id, score: attempt.score, createdAt: createdAt.toISOString() }
      }).sort((a, b) => b.score - a.score || Date.parse(a.createdAt) - Date.parse(b.createdAt)
        || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    },
  }
}

export function rankLeaderboard(entries) {
  const seen = new Set()
  const sorted = entries.filter(entry => {
    if (!entry.id || seen.has(entry.id) || !entry.name || !Number.isSafeInteger(entry.score) || entry.score < 0) return false
    seen.add(entry.id)
    return true
  }).map(entry => ({ ...entry })).sort((a, b) => b.score - a.score
    || Date.parse(a.createdAt) - Date.parse(b.createdAt)
    || (a.resultId < b.resultId ? -1 : a.resultId > b.resultId ? 1 : 0)
    || (a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0))
  return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }))
}
