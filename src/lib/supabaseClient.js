import { createClient } from '@supabase/supabase-js'

// Ganti dengan URL dan Anon Key dari Project Supabase kamu
const SUPABASE_URL = 'https://qkhgcgavvlmffihfcwga.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_7S0cSA0oxYfLFfIC7Kfz7Q_i-zTz9NM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)