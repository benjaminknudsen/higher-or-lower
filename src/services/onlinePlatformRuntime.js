import { supabase } from '../lib/supabase.js'
import { createOnlinePlatform } from './onlinePlatform.js'

export const onlinePlatform = createOnlinePlatform(supabase)
