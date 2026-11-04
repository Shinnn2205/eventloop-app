import { createClient } from '@supabase/supabase-js'

// URL dan Publishable Key dari Project Supabase
const SUPABASE_URL = 'https://qkhgcgavvlmffihfcwga.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_7S0cSA0oxYfLFfIC7Kfz7Q_i-zTz9NM'

// Konfigurasi Supabase Auth menggunakan sessionStorage:
// 1. Sesi login akan tetap aktif saat halaman di-refresh (reload).
// 2. Sesi login otomatis berakhir (harus login ulang) saat tab ditutup atau browser ditutup/tidak lagi berjalan di latar belakang.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
})
