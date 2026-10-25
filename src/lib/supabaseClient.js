import { createClient } from '@supabase/supabase-js'

// Ganti dengan URL dan Anon Key dari Project Supabase kamu
<<<<<<< HEAD
const SUPABASE_URL = 'https://qkhgcgavvlmffihfcwga.supabase.co/rest/v1/'
=======
const SUPABASE_URL = 'https://qkhgcgavvlmffihfcwga.supabase.co'
>>>>>>> e91cd7139b12dbd3b4bce4ddb9285216219052f2
const SUPABASE_ANON_KEY = 'sb_publishable_7S0cSA0oxYfLFfIC7Kfz7Q_i-zTz9NM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)