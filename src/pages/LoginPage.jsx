import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Recycle, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  Sparkles, 
  Building2, 
  User, 
  Hash, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  LogIn,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useApp, isAdminEmail, isCampusEmail, validateNimStructure, getAdminDisplayName } from '../context/AppContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setCurrentUserRole, setCurrentUserName } = useApp()
  
  // Tab Mode: 'login' (Masuk), 'signup' (Buat Akun Baru), atau 'forgot' (Lupa Password)
  const [activeTab, setActiveTab] = useState('login')
  
  // State verifikasi pendaftaran: 'form' (isi data akun) atau 'otp' (input 6-digit kode OTP)
  const [signUpStep, setSignUpStep] = useState('form')
  
  // Field form login / signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [nim, setNim] = useState('')
  const [otpCode, setOtpCode] = useState('')

  // State Lupa Password
  // forgotStep: 'request' (input NIM/email) atau 'reset' (input OTP + password baru)
  const [forgotIdentifier, setForgotIdentifier] = useState('')
  const [forgotStep, setForgotStep] = useState('request')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotTimer, setForgotTimer] = useState(0)

  // State status
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Timer cooldown untuk kirim ulang kode OTP pendaftaran
  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  // Timer cooldown untuk kirim ulang kode OTP lupa password
  useEffect(() => {
    let interval = null
    if (forgotTimer > 0) {
      interval = setInterval(() => {
        setForgotTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [forgotTimer])

  // Pulihkan form jika pengguna me-refresh halaman saat sedang di tahap memasukkan kode OTP
  useEffect(() => {
    try {
      // 1. Cek sesi pending pendaftaran akun
      const savedPending = sessionStorage.getItem('eventloop_pending_signup_otp')
      if (savedPending) {
        const parsed = JSON.parse(savedPending)
        // Masih berlaku dalam rentang waktu 15 menit
        if (parsed && parsed.email && (Date.now() - (parsed.sentAt || 0) < 15 * 60 * 1000)) {
          setActiveTab('signup')
          setSignUpStep('otp')
          if (parsed.email) setEmail(parsed.email)
          if (parsed.nim) setNim(parsed.nim)
          if (parsed.fullName) setFullName(parsed.fullName)
          if (parsed.password) setPassword(parsed.password)

          const elapsed = Math.floor((Date.now() - (parsed.sentAt || 0)) / 1000)
          const remaining = Math.max(0, 60 - elapsed)
          setResendTimer(remaining)
          setSuccessMsg(`Sesi verifikasi OTP dipulihkan. Silakan cek inbox Outlook (${parsed.email}) dan masukkan kodenya.`)
          return
        } else {
          sessionStorage.removeItem('eventloop_pending_signup_otp')
        }
      }

      // 2. Cek sesi pending lupa password
      const savedForgot = sessionStorage.getItem('eventloop_pending_forgot_otp')
      if (savedForgot) {
        const parsedForgot = JSON.parse(savedForgot)
        if (parsedForgot && parsedForgot.email && (Date.now() - (parsedForgot.sentAt || 0) < 15 * 60 * 1000)) {
          setActiveTab('forgot')
          setForgotStep('reset')
          setForgotIdentifier(parsedForgot.identifier || parsedForgot.email)

          const elapsed = Math.floor((Date.now() - (parsedForgot.sentAt || 0)) / 1000)
          const remaining = Math.max(0, 60 - elapsed)
          setForgotTimer(remaining)
          setSuccessMsg(`Sesi reset password dipulihkan. Silakan masukkan kode OTP yang telah dikirim ke ${parsedForgot.email}.`)
        } else {
          sessionStorage.removeItem('eventloop_pending_forgot_otp')
        }
      }
    } catch (err) {
      console.warn('Gagal memulihkan pending OTP:', err)
    }
  }, [])

  // Helper untuk format & validasi NIM 11 Digit
  const handleNimChange = (val) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 11)
    setNim(cleanDigits)
    if (cleanDigits.length === 11) {
      setEmail(`${cleanDigits}@student.prasetiyamulya.ac.id`)
    }
  }

  const nimInfo = validateNimStructure(nim)

  // Helper resolve identifier ke email mahasiswa atau admin
  const resolveEmailFromIdentifier = (raw) => {
    let target = (raw || '').trim()
    if (/^\d{11}$/.test(target)) {
      return `${target}@student.prasetiyamulya.ac.id`
    }
    return target
  }

  // Reset pesan saat ganti tab
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'login') {
      sessionStorage.removeItem('eventloop_pending_signup_otp')
      sessionStorage.removeItem('eventloop_pending_forgot_otp')
      setSignUpStep('form')
      setForgotStep('request')
    } else if (tab === 'signup') {
      sessionStorage.removeItem('eventloop_pending_forgot_otp')
      setForgotStep('request')
    } else if (tab === 'forgot') {
      sessionStorage.removeItem('eventloop_pending_signup_otp')
      setSignUpStep('form')
    }
    setErrorMsg('')
    setSuccessMsg('')
    setOtpCode('')
    setForgotOtp('')
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

        if (isAdminEmail(loginEmail)) {
          const adminName = getAdminDisplayName(loginEmail) || 'Admin Kampus'
          setCurrentUserRole('admin')
          setCurrentUserName(adminName)
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
  // 2. ALUR DAFTAR AKUN MAHASISWA - STEP 1: SIMPAN DATA KE DATABASE & KIRIM KODE OTP KE OUTLOOK
  // ============================================================
  const handleSignUpRequestOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!fullName.trim()) {
      setErrorMsg('Mohon lengkapi Nama Lengkap Anda sesuai identitas kampus.')
      return
    }

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
      // 1. Simpan akun & metadata langsung ke database Supabase Auth (Nama, NIM, Prodi, Password)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: studentEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            nim: nim.trim(),
            prodi_code: nimValidation.prodiCode,
            prodi_name: nimValidation.prodiName,
            school: nimValidation.schoolName,
            role: 'student_org'
          }
        }
      })

      // 2. Simpan juga ke tabel profiles di database (id, email, full_name, nim, updated_at)
      if (signUpData?.user?.id) {
        try {
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            email: studentEmail,
            full_name: fullName.trim(),
            nim: nim.trim(),
            updated_at: new Date().toISOString()
          })
        } catch (dbErr) {
          console.warn('Upsert profile err:', dbErr)
        }
      }

      // 3. Kirim kode OTP via Supabase ke email Outlook mahasiswa
      let otpSent = false
      let otpNotice = ''
      try {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: studentEmail,
          options: {
            shouldCreateUser: true
          }
        })
        if (otpErr) {
          if (otpErr.status === 429 || otpErr.message?.includes('seconds') || otpErr.message?.includes('rate')) {
            otpSent = true // Kode sebelumnya baru saja terkirim
            otpNotice = 'Kode verifikasi telah dikirim. Jika Anda baru saja meminta kode, silakan periksa inbox Outlook atau tunggu 60 detik.'
          } else {
            otpNotice = otpErr.message
          }
        } else {
          otpSent = true
        }
      } catch (errOtp) {
        otpNotice = errOtp.message || ''
      }

      // Simpan data pending agar form OTP tetap aktif saat refresh
      const pendingData = {
        step: 'otp',
        email: studentEmail,
        nim: nim.trim(),
        fullName: fullName.trim(),
        password: password,
        sentAt: Date.now()
      }
      sessionStorage.setItem('eventloop_pending_signup_otp', JSON.stringify(pendingData))
      setSignUpStep('otp')
      setResendTimer(60)

      if (otpSent) {
        setSuccessMsg(
          `Data akun berhasil tersimpan di database! Kode OTP telah dikirim ke ${studentEmail}. Penting: Harap cek Inbox, folder 'Junk Email' / Spam, atau tab 'Lainnya' di Outlook kampus Anda.`
        )
      } else {
        setSuccessMsg(
          `Data Nama & NIM (${nim.trim()}) berhasil dicatat ke database. ${otpNotice ? `Catatan pengiriman: ${otpNotice}` : 'Silakan masukkan kode OTP yang telah Anda terima di email Outlook.'}`
        )
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi saat memproses pendaftaran: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 2. ALUR DAFTAR AKUN MAHASISWA - STEP 2: VERIFIKASI KODE OTP
  // ============================================================
  const handleSignUpVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const cleanOtp = (otpCode || '').trim()
    if (cleanOtp.length < 6) {
      setErrorMsg('Silakan masukkan kode OTP yang diterima di email Outlook.')
      return
    }

    setLoading(true)
    const nimValidation = validateNimStructure(nim)
    const studentEmail = nimValidation.generatedEmail

    try {
      // 1. Verifikasi kode OTP langsung ke Supabase Auth
      let activeSession = null
      const { data: emailVerifyData, error: emailVerifyErr } = await supabase.auth.verifyOtp({
        email: studentEmail,
        token: cleanOtp,
        type: 'email'
      })

      if (!emailVerifyErr && emailVerifyData?.session) {
        activeSession = emailVerifyData.session
      } else {
        // Coba type 'signup' jika token bertipe konfirmasi pendaftaran
        const { data: signupVerifyData, error: signupVerifyErr } = await supabase.auth.verifyOtp({
          email: studentEmail,
          token: cleanOtp,
          type: 'signup'
        })
        if (!signupVerifyErr && signupVerifyData?.session) {
          activeSession = signupVerifyData.session
        }
      }

      if (!activeSession) {
        // Coba verifikasi dengan sign in password jika akun sudah aktif di auth.users
        const { data: passData } = await supabase.auth.signInWithPassword({
          email: studentEmail,
          password
        })
        if (passData?.session) {
          activeSession = passData.session
        }
      }

      if (activeSession) {
        // Hapus penanda sesi pending OTP di browser
        sessionStorage.removeItem('eventloop_pending_signup_otp')

        // 2. Simpan password & user metadata akun
        if (password) {
          try {
            await supabase.auth.updateUser({ 
              password,
              data: {
                full_name: fullName.trim(),
                nim: nim.trim(),
                prodi_code: nimValidation.prodiCode,
                prodi_name: nimValidation.prodiName,
                school: nimValidation.schoolName,
                role: 'student_org'
              }
            })
          } catch (pwdErr) {
            console.warn('Set password err:', pwdErr)
          }
        }

        // 3. Simpan data lengkap mahasiswa ke tabel profiles di database (kolom valid: id, email, full_name, nim, updated_at)
        if (activeSession.user?.id) {
          try {
            await supabase.from('profiles').upsert({
              id: activeSession.user.id,
              email: studentEmail,
              full_name: fullName.trim(),
              nim: nim.trim(),
              updated_at: new Date().toISOString()
            })
          } catch (profileErr) {
            console.warn('Gagal simpan profil:', profileErr)
          }
        }

        setCurrentUserName(fullName.trim())
        setCurrentUserRole('user')
        navigate('/dashboard')
      } else {
        setErrorMsg('Kode verifikasi salah atau sudah kadaluarsa. Pastikan kode sesuai email terbaru di Outlook Anda.')
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat memverifikasi kode OTP: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 3. ALUR LUPA PASSWORD (RESET PASSWORD VIA OTP OUTLOOK)
  // ============================================================
  const handleForgotRequestOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const resolvedEmail = resolveEmailFromIdentifier(forgotIdentifier)
    if (!resolvedEmail) {
      setErrorMsg('Silakan masukkan 11 digit NIM atau email akun terdaftar Anda.')
      return
    }

    if (!isCampusEmail(resolvedEmail) && !isAdminEmail(resolvedEmail)) {
      setErrorMsg('Format NIM atau email tidak valid. Gunakan 11 digit NIM resmi atau email kampus.')
      return
    }

    setLoading(true)
    try {
      // shouldCreateUser: false memastikan tidak membuat akun baru jika belum terdaftar
      const { error } = await supabase.auth.signInWithOtp({
        email: resolvedEmail,
        options: {
          shouldCreateUser: false
        }
      })

      if (error) {
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('signups not allowed') || msg.includes('user not found') || error.status === 400) {
          setErrorMsg('Akun dengan NIM/email ini belum terdaftar di EventLoop. Silakan mendaftar akun baru terlebih dahulu.')
        } else {
          setErrorMsg('Gagal mengirimkan kode OTP: ' + error.message)
        }
        setLoading(false)
        return
      }

      sessionStorage.setItem('eventloop_pending_forgot_otp', JSON.stringify({
        email: resolvedEmail,
        identifier: forgotIdentifier,
        sentAt: Date.now()
      }))

      setForgotStep('reset')
      setForgotTimer(60)
      setSuccessMsg(`Kode OTP reset password telah dikirim ke ${resolvedEmail}. Cek inbox Outlook Anda.`)
    } catch (err) {
      setErrorMsg('Terjadi kendala saat mengirimkan OTP reset password: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotResendOtp = async () => {
    if (forgotTimer > 0) return
    const resolvedEmail = resolveEmailFromIdentifier(forgotIdentifier)
    if (!resolvedEmail) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: resolvedEmail,
        options: {
          shouldCreateUser: false
        }
      })

      if (error) {
        setErrorMsg('Gagal mengirim ulang OTP: ' + error.message)
      } else {
        sessionStorage.setItem('eventloop_pending_forgot_otp', JSON.stringify({
          email: resolvedEmail,
          identifier: forgotIdentifier,
          sentAt: Date.now()
        }))
        setForgotTimer(60)
        setSuccessMsg(`Kode OTP baru berhasil dikirim ulang ke ${resolvedEmail}.`)
      }
    } catch (err) {
      setErrorMsg('Gagal mengirim ulang kode OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmitNewPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const cleanOtp = (forgotOtp || '').trim()
    if (!cleanOtp) {
      setErrorMsg('Silakan masukkan kode OTP yang diterima di email Outlook.')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password baru minimal terdiri dari 6 karakter.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok dengan password baru.')
      return
    }

    setLoading(true)
    const resolvedEmail = resolveEmailFromIdentifier(forgotIdentifier)

    try {
      // 1. Verifikasi kode OTP dengan Supabase Auth
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: resolvedEmail,
        token: cleanOtp,
        type: 'email'
      })

      if (verifyErr) {
        setErrorMsg('Kode OTP salah atau sudah kadaluarsa: ' + verifyErr.message)
        setLoading(false)
        return
      }

      if (data?.session) {
        // 2. Simpan password baru
        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (updateErr) {
          setErrorMsg('Gagal memperbarui password: ' + updateErr.message)
          setLoading(false)
          return
        }

        // 3. Bersihkan status pending forgot OTP
        sessionStorage.removeItem('eventloop_pending_forgot_otp')

        // Sign out agar pengguna dapat login ulang secara bersih dan aman dengan password baru
        await supabase.auth.signOut()

        // Beralih ke tab login
        setActiveTab('login')
        setForgotStep('request')
        setEmail(forgotIdentifier)
        setPassword('')
        setForgotOtp('')
        setNewPassword('')
        setConfirmPassword('')

        setSuccessMsg('✅ Password baru Anda berhasil disimpan! Silakan masuk menggunakan password baru Anda.')
      } else {
        setErrorMsg('Verifikasi berhasil tetapi sesi tidak valid. Silakan coba lagi.')
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat memproses password baru: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6FBF8] text-slate-800 flex items-center justify-center p-4 selection:bg-emerald-100 selection:text-emerald-800">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-sm overflow-hidden border border-emerald-100/90">
        
        {/* Kolom Kiri: Branding & Nilai Sirkular Kampus (Tema Cozy Renewable) */}
        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-green-50/80 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-emerald-100/80">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-200/35 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-52 h-52 bg-teal-200/25 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Recycle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  Event<span className="text-emerald-600">Loop</span>
                </span>
                <span className="text-[10px] text-emerald-700/90 font-semibold uppercase tracking-wider block">
                  Circular Campus Platform
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-2 bg-white/90 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200/70 mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekosistem Peminjaman Berkelanjutan</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug mb-3">
              Kurangi Limbah Event Kampus, Hemat Anggaran Bersama
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Pinjam dan kelola perlengkapan kegiatan mahasiswa secara transparan, mudah dilacak, dan diverifikasi resmi.
            </p>
          </div>

          <div className="pt-8 border-t border-emerald-100/80 space-y-2.5 text-xs text-slate-600 relative z-10">
            <div className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-emerald-100/70 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Pendaftaran Resmi Mahasiswa Wajib Verifikasi OTP Outlook</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-emerald-100/70 shadow-2xs">
              <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Inventarisasi Terpadu Ormawa & Gudang Kampus</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Masuk vs Buat Akun (Tema Cozy & Bersih) */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
          
          {/* TAB SWITCHER: MASUK vs BUAT AKUN */}
          <div className="flex p-1 bg-emerald-50/50 border border-emerald-100/80 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-emerald-900 shadow-2xs border border-emerald-200/60'
                  : 'text-slate-500 hover:text-emerald-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
              <span>Masuk (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-emerald-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun Baru</span>
            </button>
          </div>

          {/* Mode Lupa Password Bar */}
          {activeTab === 'forgot' && (
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-emerald-100/80">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                Mode Pemulihan Password
              </span>
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Masuk
              </button>
            </div>
          )}

          {/* Header Title */}
          <div className="mb-5">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'login' 
                ? 'Selamat Datang Kembali 👋' 
                : activeTab === 'signup'
                  ? (signUpStep === 'otp' ? 'Verifikasi Kode OTP Outlook' : 'Daftar Akun Mahasiswa')
                  : (forgotStep === 'reset' ? 'Setel Ulang Password' : 'Lupa Password Akun')
              }
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'login'
                ? 'Masukkan NIM/email dan password akun Anda untuk masuk'
                : activeTab === 'signup'
                  ? (signUpStep === 'otp'
                      ? `Kode OTP telah dikirimkan ke ${nim}@student.prasetiyamulya.ac.id`
                      : 'Pendaftaran resmi mahasiswa Universitas Prasetiya Mulya.')
                  : (forgotStep === 'reset'
                      ? 'Masukkan kode OTP dari email Outlook dan buat password baru Anda.'
                      : 'Masukkan 11 digit NIM atau email terdaftar untuk menerima kode OTP pemulihan.')
              }
            </p>
          </div>

          {/* Alert Error / Success */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 1: FORM MASUK (LOGIN) -> EMAIL & PASSWORD           */}
          {/* ======================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  NIM (11 Digit) atau Email Akun *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: 23302410001 atau nim@student... / email admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Masukkan 11 digit NIM atau email kampus terdaftar (atau email administrator).
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabChange('forgot')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>{loading ? 'Sedang Masuk...' : 'Masuk ke Dashboard'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* ======================================================= */}
          {/* TAB 3: LUPA PASSWORD (RESET VIA OTP OUTLOOK)            */}
          {/* ======================================================= */}
          {activeTab === 'forgot' && (
            forgotStep === 'request' ? (
              // STEP 1: Masukkan NIM / Email Terdaftar
              <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-950 font-medium leading-relaxed">
                  <KeyRound className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900 block mb-0.5">Pemulihan Akun via OTP Outlook</span>
                    Masukkan 11 digit NIM atau email kampus/admin yang terdaftar. Kami akan mengirimkan kode OTP verifikasi ke email resmi Anda.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    NIM (11 Digit) atau Email Akun Terdaftar *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Contoh: 23302410001 atau nama@student..."
                      className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    💡 Jika memasukkan 11 digit NIM, sistem akan otomatis mengirim OTP ke email SSO Outlook resmi Anda.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>{loading ? 'Mengirim Kode OTP...' : 'Kirim Kode OTP Pemulihan'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="text-xs font-semibold text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ingat password? Kembali ke Masuk</span>
                  </button>
                </div>
              </form>
            ) : (
              // STEP 2: Masukkan Kode OTP & Password Baru
              <form onSubmit={handleForgotSubmitNewPassword} className="space-y-3.5">
                <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950 font-medium">
                  <Mail className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div>Kode OTP pemulihan telah dikirimkan ke:</div>
                    <div className="font-mono font-bold text-emerald-900 mt-0.5">
                      {resolveEmailFromIdentifier(forgotIdentifier)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Verifikasi OTP *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={8}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\s+/g, ''))}
                      placeholder="Masukkan kode OTP"
                      className="w-full pl-9 pr-3 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-emerald-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all uppercase"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password Baru (Min 6 Karakter) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showNewPassword ? 'Sembunyikan' : 'Lihat'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Password baru"
                      className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Konfirmasi Password Baru *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>{loading ? 'Menyimpan Password...' : 'Simpan Password Baru'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request')
                      setForgotOtp('')
                    }}
                    className="text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ganti Email/NIM</span>
                  </button>

                  <button
                    type="button"
                    disabled={forgotTimer > 0 || loading}
                    onClick={handleForgotResendOtp}
                    className={`font-semibold cursor-pointer ${
                      forgotTimer > 0 
                        ? 'text-slate-400 cursor-not-allowed' 
                        : 'text-emerald-600 hover:text-emerald-700 underline'
                    }`}
                  >
                    {forgotTimer > 0 ? `Kirim ulang (${forgotTimer}s)` : 'Kirim Ulang OTP'}
                  </button>
                </div>
              </form>
            )
          )}

          {/* ======================================================= */}
          {/* TAB 2: BUAT AKUN BARU -> KODE VERIFIKASI OTP OUTLOOK     */}
          {/* ======================================================= */}
          {activeTab === 'signup' && (
            signUpStep === 'form' ? (
              // STEP 1: INPUT DATA MAHASISWA & KIRIM KODE OTP
              <form onSubmit={handleSignUpRequestOtp} className="space-y-3.5">
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-950 font-medium leading-relaxed">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900 block mb-0.5">Verifikasi Kode OTP Outlook Kampus</span>
                    Sistem akan mengirimkan kode verifikasi resmi ke inbox email Outlook mahasiswa Anda.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NIM Mahasiswa (11 Digit Angka) *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={11}
                      required
                      value={nim}
                      onChange={(e) => handleNimChange(e.target.value)}
                      placeholder="Contoh: 23302410001"
                      className="w-full pl-9 pr-3 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all tracking-wider"
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
                        <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl text-emerald-950 space-y-1.5">
                          <div className="font-bold flex items-center justify-between text-emerald-800">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Format NIM Terverifikasi</span>
                            </div>
                            <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                              {nimInfo.shortSchool}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-900 font-bold">
                            {nimInfo.prodiName}
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-emerald-800 font-medium pt-1 border-t border-emerald-200/60">
                            <div>Angkatan: <span className="font-semibold">{nimInfo.angkatan}</span></div>
                            <div>No. Urut: <span className="font-mono font-bold">#{nimInfo.nomor}</span></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {nimInfo.message}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap Mahasiswa *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Lengkap Sesuai KTM"
                      className="w-full pl-9 pr-3 py-2 bg-emerald-50/30 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email Kampus Resmi
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Terisi Otomatis Sesuai NIM
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      readOnly
                      value={nim.length === 11 ? `${nim}@student.prasetiyamulya.ac.id` : 'Otomatis terisi saat 11 digit NIM dimasukkan...'}
                      className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Buat Password Akun *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-9 pr-3 py-2 bg-emerald-50/30 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || nim.length !== 11 || !nimInfo.isValid}
                    className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/15"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{loading ? 'Mengirim Kode OTP...' : 'Kirim Kode OTP ke Outlook Kampus'}</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    Kode verifikasi akan dikirimkan langsung ke inbox resmi Outlook kampus Anda.
                  </p>
                </div>
              </form>
            ) : (
              // STEP 2: FORM INPUT KODE OTP DARI EMAIL OUTLOOK (MENDUKUNG 6 ATAU 8 DIGIT)
              <form onSubmit={handleSignUpVerifyOtp} className="space-y-4 py-1 animate-fade-in text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-emerald-200/60">
                  <KeyRound className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">Verifikasi Kode OTP</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Masukkan kode verifikasi yang kami kirimkan ke email Outlook:
                  </p>
                  <div className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold font-mono px-3 py-1 rounded-xl text-xs mt-1.5">
                    {nim}@student.prasetiyamulya.ac.id
                  </div>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl text-left text-[11px] text-emerald-950 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cek Inbox / Spam Outlook Mahasiswa:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Salin kode verifikasi dari email <strong>EventLoop</strong>. Jika belum muncul di kotak masuk utama, mohon periksa folder <strong>'Junk Email' / Spam</strong> atau tab <strong>'Lainnya' (Other)</strong>.
                  </p>
                  <div className="pt-1.5 text-[10px] text-slate-500 border-t border-emerald-100/90 flex items-center justify-between">
                    <span>Data Nama & NIM telah tersimpan.</span>
                    <button
                      type="button"
                      onClick={() => {
                        sessionStorage.removeItem('eventloop_pending_signup_otp')
                        setActiveTab('login')
                        setEmail(nim)
                      }}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Masuk via NIM & Password →
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                    Kode OTP Verifikasi
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <input
                      type="text"
                      maxLength={8}
                      required
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.trim().slice(0, 8))}
                      placeholder="12345678"
                      className="w-full text-center tracking-[0.25em] text-2xl font-black font-mono py-2.5 bg-emerald-50/30 border-2 border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 rounded-2xl text-emerald-950 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    {otpCode.length}/8 digit
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={loading || otpCode.trim().length < 6}
                    className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/15"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Memverifikasi...' : 'Verifikasi Kode & Selesaikan Pendaftaran'}</span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        sessionStorage.removeItem('eventloop_pending_signup_otp')
                        setSignUpStep('form')
                        setOtpCode('')
                        setErrorMsg('')
                      }}
                      className="text-slate-500 hover:text-emerald-700 underline cursor-pointer"
                    >
                      ← Ubah Data Pendaftaran
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handleSignUpRequestOtp}
                      className={`font-semibold cursor-pointer ${
                        resendTimer > 0 
                          ? 'text-slate-400 cursor-not-allowed' 
                          : 'text-emerald-700 hover:underline'
                      }`}
                    >
                      {resendTimer > 0 ? `Kirim ulang (${resendTimer}s)` : 'Kirim Ulang Kode'}
                    </button>
                  </div>
                </div>
              </form>
            )
          )}

          {/* Footer Link ke Beranda */}
          <div className="mt-6 pt-4 border-t border-emerald-100/70 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-emerald-700 transition-colors">
              ← Kembali ke Beranda
            </Link>
          </div>

        </div>

      </div>
    </div>
  )
}
