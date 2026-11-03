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
  CheckCircle2, 
  AlertCircle,
  LogIn,
  UserPlus
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useApp, isAdminEmail, isCampusEmail } from '../context/AppContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setCurrentUserRole, setCurrentUserName } = useApp()
  
  // Tab Mode: 'login' (Masuk) atau 'signup' (Buat Akun Baru)
  const [activeTab, setActiveTab] = useState('login')
  
  // State verifikasi OTP (hanya untuk Buat Akun)
  const [signUpStep, setSignUpStep] = useState('form') // 'form' | 'otp'
  
  // Field form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nim, setNim] = useState('')
  const [role, setRole] = useState('student_org') // 'student_org' | 'sarpras'
  const [otpCode, setOtpCode] = useState('')

  // State status
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Timer cooldown untuk kirim ulang OTP
  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  // Reset pesan saat ganti tab
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSignUpStep('form')
    setErrorMsg('')
    setSuccessMsg('')
    setOtpCode('')
  }

  // ============================================================
  // 1. ALUR MASUK (LOGIN) - LANGSUNG EMAIL & PASSWORD
  // ============================================================
  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    // Validasi admin role jika memilih sarpras
    if (role === 'sarpras' && !isAdminEmail(email)) {
      setErrorMsg('Akses ditolak: Email ini bukan akun Administrator Sarpras yang diizinkan!')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        setErrorMsg('Email atau password salah: ' + error.message)
      } else if (data?.session) {
        let userDisplayName = data.session.user.user_metadata?.full_name || 'Prasmulyan'

        // Ambil nama dari profil jika ada
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

        if (role === 'sarpras' || isAdminEmail(email)) {
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
      setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 2. ALUR BUAT AKUN (SIGN UP) - DAFTAR LANGSUNG (BYPASS EMAIL GATEWAY)
  // ============================================================
  const handleDirectSignUp = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!fullName.trim() || !nim.trim()) {
      setErrorMsg('Mohon lengkapi Nama Lengkap dan NIM Anda.')
      return
    }

    if (!email.trim()) {
      setErrorMsg('Mohon masukkan email mahasiswa kampus Anda.')
      return
    }

    if (!isCampusEmail(email)) {
      setErrorMsg('Pendaftaran akun mahasiswa WAJIB menggunakan email resmi kampus Prasetiya Mulya (@student.prasetiyamulya.ac.id atau @prasetiyamulya.ac.id) agar terverifikasi dan trusted!')
      return
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password minimal harus 6 karakter.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            nim: nim.trim()
          }
        }
      })

      if (error) {
        setErrorMsg('Gagal mendaftar: ' + error.message)
      } else if (data?.user) {
        // Simpan data lengkap ke tabel 'profiles' di Supabase
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email.trim(),
            full_name: fullName.trim(),
            nim: nim.trim(),
            updated_at: new Date().toISOString()
          })
        } catch (profileErr) {
          console.warn('Gagal simpan profil:', profileErr)
        }

        if (isAdminEmail(email)) {
          setCurrentUserRole('admin')
          setCurrentUserName(fullName.trim() || 'Admin Sarpras')
          navigate('/admin', { replace: true })
        } else {
          setCurrentUserRole('user')
          setCurrentUserName(fullName.trim())
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 3. ALUR BUAT AKUN (SIGN UP) - STEP 1: KIRIM KODE OTP
  // ============================================================
  const handleSignUpRequestOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!fullName.trim() || !nim.trim()) {
      setErrorMsg('Mohon lengkapi Nama Lengkap dan NIM Anda.')
      return
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password minimal harus 6 karakter.')
      return
    }

    setLoading(true)

    try {
      // Kirim kode OTP otomatis ke email pendaftar baru
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: {
            full_name: fullName.trim(),
            nim: nim.trim()
          }
        }
      })

      if (error) {
        setErrorMsg('Gagal mengirim kode verifikasi ke email: ' + error.message)
      } else {
        setSignUpStep('otp')
        setSuccessMsg(`Kode verifikasi 6-digit telah dikirim ke ${email}. Silakan periksa inbox atau spam email Anda.`)
        setResendTimer(45)
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi. Silakan periksa kembali email Anda.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 3. ALUR BUAT AKUN (SIGN UP) - STEP 2: VERIFIKASI KODE OTP
  // ============================================================
  const handleSignUpVerifyOtp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMsg('Silakan masukkan 6 digit kode verifikasi yang Anda terima di email.')
      return
    }

    setLoading(true)

    try {
      // Verifikasi token OTP dari email
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email'
      })

      if (error) {
        setErrorMsg('Kode verifikasi salah atau sudah kadaluarsa. Silakan periksa kembali.')
      } else if (data?.session) {
        // Set password akun agar user nanti bisa login langsung dengan email & password
        if (password) {
          try {
            await supabase.auth.updateUser({ password })
          } catch (pwdErr) {
            console.warn('Gagal set password:', pwdErr)
          }
        }

        // Simpan data lengkap ke tabel 'profiles' di Supabase
        if (data.session.user?.id) {
          try {
            await supabase.from('profiles').upsert({
              id: data.session.user.id,
              email: email.trim(),
              full_name: fullName.trim(),
              nim: nim.trim(),
              updated_at: new Date().toISOString()
            })
          } catch (profileErr) {
            console.warn('Gagal simpan profil:', profileErr)
          }
        }

        if (isAdminEmail(email)) {
          setCurrentUserRole('admin')
          setCurrentUserName(fullName.trim() || 'Admin Sarpras')
          navigate('/admin', { replace: true })
        } else {
          setCurrentUserRole('user')
          setCurrentUserName(fullName.trim())
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err) {
      setErrorMsg('Gagal memverifikasi pendaftaran. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
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
              <Sparkles className="w-3.5 h-3.5" /> Platform Sirkular Kampus
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
              Kurangi Limbah Event Kampus, Hemat Biaya Bersama
            </h2>
            <p className="text-green-100 text-sm leading-relaxed">
              Pinjam dan kelola perlengkapan kegiatan kampus dengan mudah, transparan, dan terverifikasi secara resmi.
            </p>
          </div>

          <div className="pt-8 border-t border-white/20 space-y-3 text-xs text-green-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-300" />
              <span>Pendaftaran Baru Wajib Verifikasi Kode OTP Email</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-300" />
              <span>Terintegrasi dengan Biro Kemahasiswaan & Sarpras</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Masuk vs Buat Akun */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          
          {/* TAB SWITCHER: MASUK vs BUAT AKUN */}
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'signup'
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Buat Akun (OTP)</span>
            </button>
          </div>

          {/* Header Title */}
          <div className="mb-5">
            <h3 className="text-2xl font-bold text-gray-900">
              {activeTab === 'login' 
                ? 'Selamat Datang Kembali 👋' 
                : (signUpStep === 'otp' ? 'Verifikasi Kode Email' : 'Daftar Akun Baru')
              }
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {activeTab === 'login'
                ? 'Masukkan email dan password akun Anda untuk masuk'
                : (signUpStep === 'otp'
                    ? `Masukkan 6-digit kode yang dikirim ke ${email}`
                    : 'Lengkapi identitas Anda. Sistem akan memverifikasi email dengan kode OTP.')
              }
            </p>
          </div>

          {/* Alert Error / Success */}
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

          {/* ======================================================= */}
          {/* TAB 1: FORM MASUK (LOGIN) -> EMAIL & PASSWORD           */}
          {/* ======================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Role Masuk
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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'sarpras' ? 'gabrieljason47@gmail.com / ac523634@gmail.com' : 'student@prasetiyamulya.ac.id'}
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
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-md shadow-green-600/20 transition-all"
              >
                <span>{loading ? 'Sedang Masuk...' : 'Masuk ke Dashboard'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* ======================================================= */}
          {/* TAB 2: BUAT AKUN BARU -> VERIFIKASI DENGAN KODE OTP    */}
          {/* ======================================================= */}
          {activeTab === 'signup' && (
            signUpStep === 'form' ? (
              // Step 1: Input Data & Kirim OTP
              <form onSubmit={handleSignUpRequestOtp} className="space-y-3.5">
                <div className="bg-green-50 border border-green-200 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-green-900 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-green-700 flex-shrink-0" />
                  <span>Trusted Campus Account: Wajib menggunakan email resmi mahasiswa Prasetiya Mulya (@student.prasetiyamulya.ac.id).</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nama Lengkap *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama Mahasiswa"
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      NIM *
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        placeholder="233024..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Kampus *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@prasetiyamulya.ac.id"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Buat Password Akun *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleDirectSignUp}
                    disabled={loading}
                    className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold shadow-md shadow-green-700/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Mahasiswa (Langsung Aktif)'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 text-xs font-semibold text-gray-600 hover:text-green-800 hover:bg-green-50 rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-green-700" />
                    <span>Atau Kirim Kode OTP ke Email</span>
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">
                    Gunakan 'Daftar Langsung' jika server email SSO kampus memblokir email masuk dari luar.
                  </p>
                </div>
              </form>
            ) : (
              // Step 2: Input 6 Digit Kode OTP
              <form onSubmit={handleSignUpVerifyOtp} className="space-y-4 animate-fade-in-up">
                <div className="bg-green-50/70 p-3.5 rounded-2xl border border-green-200 text-center text-xs">
                  <div className="text-gray-500">Kode verifikasi pendaftaran telah dikirim ke:</div>
                  <div className="font-bold text-gray-900 mt-0.5">{email}</div>
                </div>

                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-[11px] text-blue-900 leading-relaxed text-left space-y-1">
                  <div className="font-bold flex items-center gap-1 text-blue-950">
                    <span>💡 Tips Email SSO Mahasiswa:</span>
                  </div>
                  <p>Jika kode belum muncul di tab <strong>Focused/Utama</strong>, mohon periksa tab <strong>'Other'</strong> atau folder <strong>'Junk Email / Spam'</strong> pada Outlook/Webmail kampus Anda.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                    Masukkan 6 Digit Kode OTP
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.4em] text-2xl font-black font-mono py-2.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 text-center mt-1.5">
                    Periksa inbox atau folder spam email Anda untuk melihat kode.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.trim().length < 6}
                  className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold shadow-md shadow-green-700/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Memverifikasi...' : 'Verifikasi Kode & Masuk'}</span>
                </button>

                {/* Tombol Bypass jika email SSO kampus menolak email Supabase */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-1.5">
                  <p className="text-[11px] text-amber-900 font-medium">
                    Kode tidak masuk karena filter email kampus?
                  </p>
                  <button
                    type="button"
                    onClick={handleDirectSignUp}
                    disabled={loading}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 underline inline-block"
                  >
                    👉 Klik di sini untuk Selesaikan Pendaftaran Langsung
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSignUpStep('form')
                      setOtpCode('')
                      setErrorMsg('')
                    }}
                    className="text-gray-500 hover:text-gray-700 underline"
                  >
                    ← Ubah Data Pendaftaran
                  </button>

                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleSignUpRequestOtp}
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
          )}

          {/* Footer Link ke Beranda */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
              ← Kembali ke Beranda
            </Link>
          </div>

        </div>

      </div>
    </div>
  )
}
