import { supabase } from '../lib/supabase.js'
import { createOnlineGameResults } from './onlineGameResults.js'

let storage
try { storage = window.localStorage } catch {}
export const onlineGameResults = createOnlineGameResults(supabase, storage)
