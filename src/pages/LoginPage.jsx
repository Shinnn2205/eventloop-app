import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Recycle, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  User, 
  Hash, 
  KeyRound, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useApp } from '../context/AppContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setCurrentUserRole, setCurrentUserName } = useApp()
  
  // State mode
  const [authMethod, setAuthMethod] = useState('otp') // 'otp' | 'password'
  const [otpStep, setOtpStep] = useState('request') // 'request' | 'verify'
  
  // State form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [nim, setNim] = useState('')
  const [role, setRole] = useState('student_org') // 'student_org' | 'sarpras'
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Countdown timer untuk kirim ulang OTP
  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  // --- STEP 1: KIRIM KODE OTP KE EMAIL ---
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!email) {
      setErrorMsg('Silakan masukkan alamat email Anda.')
      return
    }

    if (role === 'sarpras' && !email.includes('admin') && !email.includes('sarpras')) {
      setErrorMsg('Akses ditolak: Email ini bukan akun Administrator Sarpras!')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: {
            full_name: fullName.trim() || 'Prasmulyan',
            nim: nim.trim() || ''
          }
        }
      })

      if (error) {
        setErrorMsg('Gagal mengirim kode verifikasi: ' + error.message)
      } else {
        setOtpStep('verify')
        setSuccessMsg(`Kode verifikasi telah dikirim otomatis ke ${email}. Silakan cek kotak masuk (inbox) atau spam email Anda.`)
        setResendTimer(45) // 45 detik cooldown kirim ulang
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // --- STEP 2: VERIFIKASI KODE OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMsg('Silakan masukkan 6 digit kode verifikasi yang Anda terima di email.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email'
      })

      if (error) {
        setErrorMsg('Kode verifikasi salah atau sudah kadaluarsa. Silakan periksa kembali atau kirim ulang kode.')
      } else if (data?.session) {
        let userDisplayName = fullName.trim() || data.session.user.user_metadata?.full_name || 'Prasmulyan'

        // Simpan / update profil di Supabase
        if (data.session.user?.id) {
          try {
            await supabase.from('profiles').upsert({
              id: data.session.user.id,
              email: email.trim(),
              full_name: userDisplayName,
              nim: nim.trim() || data.session.user.user_metadata?.nim || '',
              updated_at: new Date().toISOString()
            })
          } catch (profileErr) {
            console.warn('Gagal simpan profil:', profileErr)
          }
        }

        // Arahkan sesuai role
        if (role === 'sarpras') {
          setCurrentUserRole('admin')
          setCurrentUserName('Admin Sarpras')
          navigate('/admin', { replace: true })
        } else {
          setCurrentUserRole('user')
          setCurrentUserName(userDisplayName)
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err) {
      setErrorMsg('Gagal memverifikasi kode. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // --- ALTERNATIF: LOGIN DENGAN PASSWORD ---
  const handlePasswordAuth = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName || 'Prasmulyan',
            nim: nim || '00000000',
          }
        }
      })

      if (error) {
        setErrorMsg('Gagal mendaftar: ' + error.message)
      } else {
        if (data?.user?.id) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: email.trim(),
              full_name: fullName || 'Prasmulyan',
              nim: nim || '00000000',
              updated_at: new Date().toISOString()
            })
          } catch (profileErr) {
            console.warn('Gagal simpan profil:', profileErr)
          }
        }
        alert('Pendaftaran berhasil! Silakan periksa email untuk konfirmasi atau masuk.')
        setIsSignUp(false)
      }
    } else {
      if (role === 'sarpras' && !email.includes('admin') && !email.includes('sarpras')) {
        setErrorMsg('Akses ditolak: Email ini bukan akun Administrator Sarpras!')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      })

      if (error) {
        setErrorMsg('Gagal masuk: ' + error.message)
      } else if (data?.session) {
        let userDisplayName = data.session.user.user_metadata?.full_name || 'Prasmulyan'
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nim')
            .eq('id', data.session.user.id)
            .single()
          if (profile?.full_name) {
            userDisplayName = profile.full_name
          }
        } catch (fetchErr) {
          console.warn('Gagal ambil data profil:', fetchErr)
        }

        if (role === 'sarpras') {
          setCurrentUserRole('admin')
          setCurrentUserName('Admin Sarpras')
          navigate('/admin', { replace: true })
        } else {
          setCurrentUserRole('user')
          setCurrentUserName(userDisplayName)
          navigate('/dashboard', { replace: true })
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Kolom Kiri: Branding & Informasi */}
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
              <Sparkles className="w-3.5 h-3.5" /> Verifikasi Otomatis by System
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
              Kurangi Limbah Event Kampus, Hemat Biaya Bersama
            </h2>
            <p className="text-green-100 text-sm leading-relaxed">
              Login aman tanpa ribet mengingat password. Sistem akan mengirimkan kode 6-digit verifikasi langsung ke email Anda.
            </p>
          </div>

          <div className="pt-8 border-t border-white/20 space-y-3 text-xs text-green-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-300" />
              <span>Verifikasi Kode OTP Resmi Supabase Auth</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-300" />
              <span>Terintegrasi dengan Biro Kemahasiswaan & Sarpras</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Autentikasi */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          
          {/* Header Title */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {authMethod === 'otp' 
                ? (otpStep === 'verify' ? 'Masukkan Kode Verifikasi' : 'Masuk via Email')
                : (isSignUp ? 'Daftar Akun Baru' : 'Masuk dengan Password')
              }
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {authMethod === 'otp'
                ? (otpStep === 'verify' 
                    ? `Periksa email Anda di ${email}` 
                    : 'Kode 6-digit akan otomatis dikirimkan ke email Anda')
                : 'Gunakan email dan password terdaftar Anda'
              }
            </p>
          </div>

          {/* Alert Message */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PILIHAN ROLE (Hanya saat step request) */}
          {otpStep === 'request' && (
            <div className="mb-4">
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
                  🎓 Mahasiswa / Org
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
                  🏫 Admin Kampus
                </button>
              </div>
            </div>
          )}

          {/* --- METODE 1: VERIFIKASI KODE EMAIL (OTP) --- */}
          {authMethod === 'otp' ? (
            otpStep === 'request' ? (
              // Step 1: Input Email & Identitas
              <form onSubmit={handleSendOtp} className="space-y-4">
                {role === 'student_org' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Nama Lengkap (Opsional)
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nama Anda"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        NIM (Opsional)
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={nim}
                          onChange={(e) => setNim(e.target.value)}
                          placeholder="233024..."
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Alamat Email Kampus *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === 'sarpras' ? 'admin@prasetiyamulya.ac.id' : 'student@prasetiyamulya.ac.id'}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Sistem akan mengirimkan 6 digit kode akses verifikasi ke email ini.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-md shadow-green-600/20 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Mengirim Kode...' : 'Kirim Kode Verifikasi ke Email'}</span>
                </button>
              </form>
            ) : (
              // Step 2: Input Kode OTP 6-Digit
              <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in-up">
                <div className="bg-green-50/60 p-4 rounded-2xl border border-green-200/60 text-center">
                  <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-gray-600">Kode verifikasi telah dikirim ke:</div>
                  <div className="font-bold text-gray-900 text-sm">{email}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                    Masukkan 6 Digit Kode Verifikasi
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] text-2xl font-black font-mono py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    Buka inbox atau folder spam email Anda, lalu salin kode 6-digit tersebut ke sini.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.trim().length < 6}
                  className="w-full btn-primary text-sm !py-3.5 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold shadow-md shadow-green-600/20 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Memverifikasi...' : 'Verifikasi Kode & Masuk'}</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('request')
                      setOtpCode('')
                      setErrorMsg('')
                    }}
                    className="text-gray-500 hover:text-gray-700 underline"
                  >
                    ← Ganti Email
                  </button>

                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleSendOtp}
                    className={`font-semibold ${
                      resendTimer > 0 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-green-700 hover:underline'
                    }`}
                  >
                    {resendTimer > 0 ? `Kirim ulang (${resendTimer}s)` : 'Kirim Ulang Kode'}
                  </button>
                </div>
              </form>
            )
          ) : (
            // --- METODE 2: LOGIN VIA PASSWORD (OPSIONAL) ---
            <form onSubmit={handlePasswordAuth} className="space-y-4">
              {isSignUp && role === 'student_org' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Nama Mahasiswa"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      NIM
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        required
                        placeholder="233024..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                    placeholder="student@prasetiyamulya.ac.id"
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
          )}

          {/* Toggle Switch Antara Verifikasi Kode Email vs Password */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setAuthMethod(authMethod === 'otp' ? 'password' : 'otp')
                setOtpStep('request')
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className="text-xs font-bold text-green-700 hover:underline block mx-auto"
            >
              {authMethod === 'otp' 
                ? '🔑 Atau Masuk Menggunakan Password' 
                : '✉️ Atau Masuk dengan Kode Verifikasi Email (Tanpa Password)'
              }
            </button>

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
