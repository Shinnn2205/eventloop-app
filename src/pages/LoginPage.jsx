import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Recycle, Mail, Lock, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useApp } from '../context/AppContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setCurrentUserRole } = useApp()
  const [email, setEmail] = useState('23302410001@student.prasetiyamulya.ac.id')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student_org')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        alert('Gagal mendaftar: ' + error.message)
      } else {
        alert('Pendaftaran berhasil! Silakan masuk.')
        setIsSignUp(false)
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        alert('Gagal masuk: ' + error.message)
      } else if (data?.session) {
        if (role === 'sarpras') {
          setCurrentUserRole('admin')
          navigate('/admin', { replace: true })
        } else {
          setCurrentUserRole('user')
          navigate('/dashboard', { replace: true })
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Left Info Panel */}
        <div className="bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">EventLoop</span>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-green-200 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Campus Circular Portal
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
              Kurangi Limbah Event Kampus, Hemat Biaya Bersama
            </h2>
            <p className="text-green-100 text-sm leading-relaxed">
              Masuk untuk memesan perlengkapan acara, kelola inventory organisasi, dan pantau skor circular eventmu secara real-time.
            </p>
          </div>

          <div className="pt-8 border-t border-white/20 space-y-3 text-xs text-green-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-300" />
              <span>Autentikasi Aman Berbasis Supabase Auth</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-300" />
              <span>Terintegrasi dengan Biro Kemahasiswaan & Sarpras</span>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {isSignUp ? 'Daftar Akun EventLoop' : 'Masuk ke EventLoop'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isSignUp ? 'Buat akun Supabase baru' : 'Gunakan email kampus atau organisasi Anda'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Role Pengguna
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student_org')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    role === 'student_org'
                      ? 'bg-green-50 border-green-500 text-green-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🎓 Organisasi / User
                </button>
                <button
                  type="button"
                  onClick={() => setRole('sarpras')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    role === 'sarpras'
                      ? 'bg-green-50 border-green-500 text-green-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🏫 Admin Kampus / Sarpras
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Kampus
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="organisasi@kampus.ac.id"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 mt-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-md shadow-green-600/20"
            >
              <span>{loading ? 'Memproses...' : (isSignUp ? 'Daftar Akun Baru' : 'Masuk ke Dashboard')}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
            <p className="text-xs text-gray-500">
              {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun di Supabase?'}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-green-700 hover:underline"
              >
                {isSignUp ? 'Masuk di sini' : 'Daftar sekarang'}
              </button>
            </p>
            <div>
              <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
                ← Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}