import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Recycle, Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) // Untuk toggle antara Login atau Daftar akun baru

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      // Proses Daftar Akun Baru
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        alert('Gagal mendaftar: ' + error.message)
      } else {
        alert('Pendaftaran berhasil! Silakan masuk dengan akun yang baru dibuat.')
        setIsSignUp(false)
      }
    } else {
      // Proses Login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        alert('Gagal masuk: ' + error.message)
      } else {
        // Berhasil masuk, aplikasi akan otomatis mendeteksi sesi
        window.location.href = '/'
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-green-700 shadow-sm">
            <Recycle className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Daftar Akun EventLoop' : 'Masuk ke EventLoop'}
          </h3>
          <p className="text-sm text-gray-500">
            {isSignUp ? 'Buat akun baru untuk mulai menyewa alat' : 'Gunakan email kampus atau organisasi Anda'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</label>
            <div className="relative mt-1">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@student.prasetiyamulya.ac.id"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</label>
            <div className="relative mt-1">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-all shadow-md shadow-green-600/20"
          >
            <span>{loading ? 'Memproses...' : (isSignUp ? 'Daftar Sekarang' : 'Masuk')}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
          {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-semibold text-green-600 hover:underline"
          >
            {isSignUp ? 'Masuk di sini' : 'Daftar sekarang'}
          </button>
        </div>

      </div>
    </div>
  )
}