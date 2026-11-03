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
import { useApp, isAdminEmail, isCampusEmail, validateNimStructure } from '../context/AppContext'

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

  // State Modal SSO Microsoft 365 Kampus
  const [showSsoModal, setShowSsoModal] = useState(false)
  const [ssoNim, setSsoNim] = useState('23302410001')
  const [ssoName, setSsoName] = useState('Choirul Arifin')
  const [ssoPassword, setSsoPassword] = useState('')
  const [isEditingSsoAccount, setIsEditingSsoAccount] = useState(false)

  // Otomatis deteksi nama mahasiswa dari NIM jika sudah terdaftar
  useEffect(() => {
    if (ssoNim && ssoNim.length === 11) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('nim', ssoNim)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) {
            setSsoName(data.full_name)
          }
        })
    }
  }, [ssoNim])

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

  // Helper untuk format & validasi NIM 11 Digit
  const handleNimChange = (val) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 11)
    setNim(cleanDigits)
    if (cleanDigits.length === 11) {
      setEmail(`${cleanDigits}@student.prasetiyamulya.ac.id`)
    }
  }

  const nimInfo = validateNimStructure(nim)

  // Reset pesan saat ganti tab
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSignUpStep('form')
    setErrorMsg('')
    setSuccessMsg('')
    setOtpCode('')
  }

  // ============================================================
  // 1. ALUR MASUK (LOGIN) - NIM (11 DIGIT) ATAU EMAIL & PASSWORD
  // ============================================================
  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    let loginEmail = email.trim()
    // Jika mahasiswa memasukkan 11 digit NIM, konversi otomatis ke email SSO kampus
    if (/^\d{11}$/.test(loginEmail)) {
      loginEmail = `${loginEmail}@student.prasetiyamulya.ac.id`
    }

    // Validasi admin role jika memilih sarpras
    if (role === 'sarpras' && !isAdminEmail(loginEmail)) {
      setErrorMsg('Akses ditolak: Email ini bukan akun Administrator Sarpras yang diizinkan!')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      })

      if (error) {
        setErrorMsg('NIM/Email atau password salah: ' + error.message)
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

        if (role === 'sarpras' || isAdminEmail(loginEmail)) {
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
  // 2. ALUR DAFTAR AKUN MAHASISWA (VALIDASI NIM 11 DIGIT + SSO)
  // ============================================================
  const handleRegisterStudent = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!fullName.trim()) {
      setErrorMsg('Mohon lengkapi Nama Lengkap Anda.')
      return
    }

    // Validasi struktur 11 digit NIM: 3 digit prodi, 2 digit angkatan, 6 digit nomor
    const nimValidation = validateNimStructure(nim)
    if (!nimValidation.isValid) {
      setErrorMsg(nimValidation.message)
      return
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password minimal harus 6 karakter.')
      return
    }

    setLoading(true)

    const studentEmail = nimValidation.generatedEmail

    try {
      // 1. Cek duplikasi NIM di database Supabase agar tidak ada NIM ganda
      const { data: existingUser, error: checkErr } = await supabase
        .from('profiles')
        .select('id, nim')
        .eq('nim', nim.trim())
        .maybeSingle()

      if (existingUser) {
        setErrorMsg(`NIM ${nim.trim()} sudah terdaftar dalam sistem. Silakan langsung masuk pada tab 'Masuk Akun'.`)
        setLoading(false)
        return
      }

      // 2. Mendaftarkan akun mahasiswa
      const { data, error } = await supabase.auth.signUp({
        email: studentEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            nim: nim.trim(),
            role: 'student_org'
          }
        }
      })

      if (error) {
        setErrorMsg('Gagal mendaftarkan akun: ' + error.message)
      } else if (data?.user) {
        // 3. Simpan data lengkap ke tabel 'profiles' di Supabase
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: studentEmail,
            full_name: fullName.trim(),
            nim: nim.trim(),
            updated_at: new Date().toISOString()
          })
        } catch (profileErr) {
          console.warn('Gagal simpan profil:', profileErr)
        }

        setCurrentUserRole('user')
        setCurrentUserName(fullName.trim())
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 3. ALUR LOGIN CEPAT SSO KAMPUS (MICROSOFT 365 / OUTLOOK)
  // ============================================================
  const handleSsoLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const cleanNim = (ssoNim || '').replace(/\D/g, '').slice(0, 11)
    if (cleanNim.length !== 11) {
      setErrorMsg('NIM mahasiswa pada SSO harus tepat 11 digit angka.')
      setLoading(false)
      return
    }

    const ssoEmail = `${cleanNim}@student.prasetiyamulya.ac.id`
    const pwToUse = ssoPassword || `PrasMul${cleanNim}!`

    try {
      // 1. Coba login terlebih dahulu dengan password yang dimasukkan
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: ssoEmail,
        password: pwToUse
      })

      if (loginData?.session) {
        let displayName = ssoName
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nim')
            .eq('id', loginData.session.user.id)
            .single()
          if (profile?.full_name) displayName = profile.full_name
        } catch (e) {}

        setCurrentUserRole('user')
        setCurrentUserName(displayName)
        setShowSsoModal(false)
        navigate('/dashboard', { replace: true })
        return
      }

      // Jika login gagal dan error adalah password salah
      if (loginError && loginError.message.toLowerCase().includes('invalid login credentials')) {
        // Cek apakah akun memang sudah terdaftar
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, full_name, nim')
          .eq('email', ssoEmail)
          .maybeSingle()

        if (existingProfile) {
          setErrorMsg('Password akun Anda salah. Silakan masukkan password yang benar yang Anda buat saat mendaftar.')
          setLoading(false)
          return
        }
      }

      // 2. Jika akun belum terdaftar sama sekali di Supabase, buat akun baru secara otomatis
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: ssoEmail,
        password: pwToUse,
        options: {
          data: {
            full_name: ssoName.trim() || 'Choirul Arifin',
            nim: cleanNim,
            role: 'student_org'
          }
        }
      })

      if (signupData?.user) {
        try {
          await supabase.from('profiles').upsert({
            id: signupData.user.id,
            email: ssoEmail,
            full_name: ssoName.trim() || 'Choirul Arifin',
            nim: cleanNim,
            updated_at: new Date().toISOString()
          })
        } catch (pErr) {}

        setCurrentUserRole('user')
        setCurrentUserName(ssoName.trim() || 'Choirul Arifin')
        setShowSsoModal(false)
        navigate('/dashboard', { replace: true })
      } else {
        setErrorMsg('Gagal otentikasi SSO: ' + (signupError?.message || loginError?.message || 'Periksa kembali data Anda.'))
      }
    } catch (err) {
      setErrorMsg('Terjadi kendala koneksi ke server SSO.')
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
            <div className="space-y-4">
              {/* Tombol Cepat Masuk SSO Mahasiswa (Microsoft 365 / Outlook) */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡ Single Sign-On (SSO) Kampus</span>
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    Microsoft 365
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSsoModal(true)}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-blue-600 hover:text-white border border-blue-300 hover:border-blue-600 rounded-xl font-bold text-xs text-gray-800 shadow-sm transition-all group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  <span>Masuk dengan Outlook Mahasiswa</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              <div className="relative flex items-center my-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Atau Masuk dengan Akun Manual
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

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
                  {role === 'sarpras' ? 'Email Administrator Sarpras *' : 'NIM (11 Digit) atau Email Kampus *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'sarpras' ? 'admin@gmail.com' : 'Contoh: 23324000123 atau nim@student...'}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
                {role === 'student_org' && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    💡 Anda bisa memasukkan 11 digit NIM atau alamat email SSO resmi Anda.
                  </p>
                )}
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
          </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: BUAT AKUN BARU -> SSO KAMPUS (NIM 11 DIGIT)      */}
          {/* ======================================================= */}
          {activeTab === 'signup' && (
            <form onSubmit={handleRegisterStudent} className="space-y-3.5">
              <div className="bg-green-50 border border-green-200 p-3 rounded-2xl flex items-start gap-2.5 text-[11px] text-green-950 font-medium leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-green-900 block mb-0.5">Akun Resmi Mahasiswa (SSO Kampus)</span>
                  Pendaftaran diverifikasi langsung berdasarkan <strong>11 digit NIM resmi</strong> Prasetiya Mulya. Email SSO terkunci otomatis sesuai identitas kampus Anda.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  NIM Mahasiswa (11 Digit Angka) *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={11}
                    required
                    value={nim}
                    onChange={(e) => handleNimChange(e.target.value)}
                    placeholder="Contoh: 23324000123"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all tracking-wider"
                  />
                </div>

                {/* Live Badge Rincian NIM */}
                {nim.length > 0 && (
                  <div className="mt-1.5 text-[11px]">
                    {nim.length < 11 ? (
                      <span className="text-amber-700 font-medium">
                        ⏳ {nim.length}/11 digit (Ketik {11 - nim.length} digit lagi)
                      </span>
                    ) : nimInfo.isValid ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-950 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Format NIM Terverifikasi</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold text-emerald-900 pt-0.5">
                          <div>Jurusan: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{nimInfo.prodi}</span></div>
                          <div>Angkatan: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{nimInfo.angkatan}</span></div>
                          <div>No. Urut: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">#{nimInfo.nomor}</span></div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {nimInfo.message}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Mahasiswa *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap Sesuai KTM"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email SSO Kampus Resmi
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Terkunci Otomatis Sesuai NIM
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    readOnly
                    value={nim.length === 11 ? `${nim}@student.prasetiyamulya.ac.id` : 'Otomatis terisi saat 11 digit NIM dimasukkan...'}
                    className="w-full pl-9 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-600 font-mono cursor-not-allowed select-none"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || nim.length !== 11 || !nimInfo.isValid}
                  className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold shadow-md shadow-green-700/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Mahasiswa Resmi'}</span>
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Dengan mendaftar, akun Anda terikat secara resmi dengan NIM dan domain mahasiswa Universitas Prasetiya Mulya.
                </p>
              </div>
            </form>
          )}

          {/* Footer Link ke Beranda */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
              ← Kembali ke Beranda
            </Link>
          </div>

        </div>

      </div>
      {/* Modal Autentikasi SSO Kampus (Microsoft 365 / Prasetiya Mulya) */}
      {showSsoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header Modal */}
            <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white relative">
              <button 
                type="button"
                onClick={() => setShowSsoModal(false)}
                className="absolute top-5 right-5 text-gray-300 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-white/10 transition-all"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                <span className="text-xs font-bold tracking-wider uppercase text-blue-200">Microsoft Entra ID</span>
              </div>
              <h3 className="text-lg font-bold">Portal SSO Prasetiya Mulya</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Otentikasi Mahasiswa Resmi (Outlook / Microsoft 365)
              </p>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 flex-shrink-0">
                  PM
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="text-xs font-bold text-gray-900 truncate">
                    {ssoName}
                  </div>
                  <div className="text-[11px] font-mono text-blue-900 font-bold truncate">
                    {ssoNim}@student.prasetiyamulya.ac.id
                  </div>
                  <div className="text-[10px] text-green-700 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                    <span>Akun Kampus Terverifikasi Aktif</span>
                  </div>
                </div>
              </div>

              {isEditingSsoAccount ? (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      NIM Mahasiswa (11 Digit) *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={ssoNim}
                      onChange={(e) => setSsoNim(e.target.value)}
                      placeholder="Contoh: 23302410001"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nama Mahasiswa
                    </label>
                    <input
                      type="text"
                      value={ssoName}
                      onChange={(e) => setSsoName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingSsoAccount(true)}
                  className="text-xs text-blue-700 hover:text-blue-900 hover:underline font-semibold block text-center w-full py-1"
                >
                  Ganti NIM / Akun Mahasiswa Lain
                </button>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password Akun Mahasiswa *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={ssoPassword}
                    onChange={(e) => setSsoPassword(e.target.value)}
                    placeholder="Masukkan password akun Anda"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSsoLogin}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Menghubungkan ke SSO Kampus...' : 'Masuk Langsung dengan Akun Ini'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSsoModal(false)}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
