import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { setCurrentUserRole, setCurrentUserName, refetchData } = useApp()
  
  // Tab Mode: 'login' (Masuk), 'signup' (Buat Akun Baru), atau 'forgot' (Lupa Password)
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(() => (tabParam === 'signup' ? 'signup' : tabParam === 'forgot' ? 'forgot' : 'login'))

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t === 'signup' || t === 'login' || t === 'forgot') {
      setActiveTab(t)
    }
  }, [searchParams])
  
  // State verifikasi pendaftaran: 'form' (isi data akun) atau 'otp' (input kode OTP 6/8 digit)
  const [signUpStep, setSignUpStep] = useState('form')
  const [otpVerifiedNeedsPassword, setOtpVerifiedNeedsPassword] = useState(false)
  
  // Field form login / signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
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
      const currentTabParam = searchParams.get('tab')

      // Jika pengguna secara eksplisit diarahkan ke tab login (mis. setelah logout), bersihkan sesi OTP lama agar tidak muncul mendadak
      if (currentTabParam === 'login') {
        sessionStorage.removeItem('eventloop_pending_signup_otp')
        sessionStorage.removeItem('eventloop_pending_forgot_otp')
        return
      }

      // 1. Cek sesi pending pendaftaran akun
      const savedPending = sessionStorage.getItem('eventloop_pending_signup_otp')
      if (savedPending && currentTabParam !== 'forgot') {
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
      if (savedForgot && currentTabParam !== 'signup') {
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

  // Reset pesan & update query URL saat ganti tab
  const handleTabChange = async (tab) => {
    const hadPendingForgot = Boolean(sessionStorage.getItem('eventloop_pending_forgot_otp'))
    if ((otpVerifiedNeedsPassword && tab !== 'signup') || (hadPendingForgot && tab !== 'forgot')) {
      try {
        const { data: sData } = await supabase.auth.getSession()
        if (sData?.session) await supabase.auth.signOut()
      } catch (e) {}
      setOtpVerifiedNeedsPassword(false)
    }
    setActiveTab(tab)
    setSearchParams({ tab })
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

    try {
      sessionStorage.removeItem('eventloop_pending_signup_otp')
      sessionStorage.removeItem('eventloop_pending_forgot_otp')
    } catch (e) {}

    let loginEmail = email.trim().toLowerCase()
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
        } else {
          setCurrentUserRole('user')
          setCurrentUserName(userDisplayName)
        }

        // Refresh data Supabase secara instan agar reservasi, event aktif, dan barang sewa sinkron antar-perangkat
        if (refetchData) {
          try {
            await refetchData()
          } catch (syncErr) {
            console.warn('Gagal sinkron data cloud saat login:', syncErr)
          }
        }

        navigate(isAdminEmail(loginEmail) ? '/admin' : '/dashboard', { replace: true })
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 2. ALUR DAFTAR AKUN MAHASISWA - STEP 1: VALIDASI & KIRIM KODE OTP KE OUTLOOK
  //    (TIDAK membuat sesi login sebelum pengguna memasukkan kode OTP yang valid!)
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

    if (!password || password.length < 8) {
      setErrorMsg('Password minimal harus terdiri dari 8 karakter.')
      return
    }

    setLoading(true)
    const studentEmail = nimValidation.generatedEmail
    const cleanNim = nim.trim()
    const cleanName = fullName.trim()

    try {
      // 1. Pastikan NIM / Email ini belum terdaftar aktif di tabel profiles
      try {
        const { data: existingProfiles } = await supabase
          .from('profiles')
          .select('id, email, nim')
          .or(`email.eq.${studentEmail},nim.eq.${cleanNim}`)
          .limit(1)

        if (existingProfiles && existingProfiles.length > 0) {
          setErrorMsg('NIM/Email ini sudah terdaftar di EventLoop. Silakan masuk di tab "Masuk (Login)" atau gunakan fitur "Lupa Password?".')
          setLoading(false)
          return
        }
      } catch (checkErr) {
        console.warn('Catatan cek duplikasi profil:', checkErr)
      }

      // 2. Pastikan tidak ada sesi lama yang menempel sebelum mengirim OTP pendaftaran baru
      try {
        const { data: curSessData } = await supabase.auth.getSession()
        if (curSessData?.session) {
          await supabase.auth.signOut()
        }
      } catch (signOutErr) {}

      // 3. Tandai sesi pending OTP SEBELUM request ke Supabase agar tidak pernah terjadi bypass redirect
      const pendingData = {
        step: 'otp',
        email: studentEmail,
        nim: cleanNim,
        fullName: cleanName,
        password: password,
        sentAt: Date.now()
      }
      sessionStorage.setItem('eventloop_pending_signup_otp', JSON.stringify(pendingData))

      // 4. Kirim kode OTP via signInWithOtp (HANYA mengirim kode ke Outlook, TIDAK membuat sesi login!)
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: studentEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: cleanName,
            nim: cleanNim,
            prodi_code: nimValidation.prodiCode,
            prodi_name: nimValidation.prodiName,
            school: nimValidation.schoolName,
            role: 'student_org'
          }
        }
      })

      if (otpErr) {
        const msg = (otpErr.message || '').toLowerCase()
        const isRateLimit = otpErr.status === 429 || msg.includes('seconds') || msg.includes('rate') || msg.includes('already sent')
        if (isRateLimit) {
          setSignUpStep('otp')
          setOtpVerifiedNeedsPassword(false)
          setResendTimer(60)
          setSuccessMsg(
            `Kode OTP sebelumnya baru saja dikirim ke ${studentEmail}. Silakan periksa Inbox / Junk Email Outlook Anda, atau tunggu 60 detik untuk kirim ulang.`
          )
          return
        }

        // Jika error nyata (bukan rate-limit), batalkan pending OTP dan tetap di form pendaftaran
        sessionStorage.removeItem('eventloop_pending_signup_otp')
        setErrorMsg('Gagal mengirim kode OTP ke Outlook: ' + otpErr.message)
        return
      }

      setSignUpStep('otp')
      setOtpVerifiedNeedsPassword(false)
      setResendTimer(60)
      setSuccessMsg(
        `Kode OTP verifikasi telah dikirim ke ${studentEmail}. Masukkan kode OTP terlebih dahulu untuk mengaktifkan akun. (Cek Inbox, folder Junk/Spam, atau tab Lainnya di Outlook kampus Anda.)`
      )
    } catch (err) {
      sessionStorage.removeItem('eventloop_pending_signup_otp')
      setErrorMsg('Terjadi kesalahan koneksi saat memproses pendaftaran: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 2. ALUR DAFTAR AKUN MAHASISWA - STEP 2: VERIFIKASI KODE OTP & SET PASSWORD
  // ============================================================
  const handleSignUpVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const cleanOtp = (otpCode || '').replace(/\s+/g, '')
    if (!otpVerifiedNeedsPassword && cleanOtp.length < 6) {
      setErrorMsg('Silakan masukkan kode OTP (6 atau 8 digit) yang diterima di email Outlook.')
      return
    }

    if (!password || password.length < 8) {
      setErrorMsg('Password minimal harus terdiri dari 8 karakter.')
      return
    }

    setLoading(true)
    const nimValidation = validateNimStructure(nim)
    const studentEmail = nimValidation.generatedEmail

    try {
      // 1. Verifikasi kode OTP langsung ke Supabase Auth (atau gunakan sesi jika OTP baru saja terverifikasi & tinggal menyimpan password)
      let activeSession = null

      if (otpVerifiedNeedsPassword) {
        const { data: existingSessData } = await supabase.auth.getSession()
        activeSession = existingSessData?.session || null
      }

      if (!activeSession) {
        const { data: emailVerifyData, error: emailVerifyErr } = await supabase.auth.verifyOtp({
          email: studentEmail,
          token: cleanOtp,
          type: 'email'
        })

        if (!emailVerifyErr && emailVerifyData?.session) {
          activeSession = emailVerifyData.session
        } else {
          // Fallback: coba type 'signup' jika token bertipe konfirmasi pendaftaran
          const { data: signupVerifyData, error: signupVerifyErr } = await supabase.auth.verifyOtp({
            email: studentEmail,
            token: cleanOtp,
            type: 'signup'
          })
          if (!signupVerifyErr && signupVerifyData?.session) {
            activeSession = signupVerifyData.session
          }
        }
      }

      if (!activeSession) {
        setErrorMsg('Kode verifikasi OTP salah atau sudah kadaluarsa. Pastikan kode sesuai email terbaru di Outlook Anda.')
        return
      }

      // 2. Simpan password (min. 8 karakter) & metadata identitas kampus ke akun Supabase Auth
      const { error: pwdErr } = await supabase.auth.updateUser({
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

      if (pwdErr) {
        const errLower = (pwdErr.message || '').toLowerCase()
        const isSamePwd = errLower.includes('different from the old password') || errLower.includes('same_password')
        if (!isSamePwd) {
          setOtpVerifiedNeedsPassword(true)
          setErrorMsg(
            `Kode OTP sudah terverifikasi, tetapi password belum memenuhi aturan sistem (${pwdErr.message}). Silakan ubah password minimal 8 karakter di bawah lalu klik Simpan.`
          )
          return
        }
      }

      // 3. Simpan data mahasiswa ke tabel profiles (kolom valid: id, email, full_name, nim, updated_at)
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

      // 4. Hapus penanda pending OTP HANYA setelah OTP valid + password & profil tersimpan
      sessionStorage.removeItem('eventloop_pending_signup_otp')
      setOtpVerifiedNeedsPassword(false)

      setCurrentUserName(fullName.trim())
      setCurrentUserRole('user')

      if (refetchData) {
        try {
          await refetchData()
        } catch (syncErr) {
          console.warn('Gagal sinkron data cloud setelah verifikasi OTP:', syncErr)
        }
      }

      navigate('/profile?required=1', { replace: true })
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat memverifikasi kode OTP: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUpResendOtp = async () => {
    if (resendTimer > 0 || loading) return
    const nimValidation = validateNimStructure(nim)
    if (!nimValidation.isValid) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: nimValidation.generatedEmail,
        options: {
          shouldCreateUser: true,
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
      if (otpErr) {
        setErrorMsg('Gagal mengirim ulang kode OTP: ' + otpErr.message)
      } else {
        try {
          const prevRaw = sessionStorage.getItem('eventloop_pending_signup_otp')
          const prevObj = prevRaw ? JSON.parse(prevRaw) : {}
          sessionStorage.setItem('eventloop_pending_signup_otp', JSON.stringify({
            ...prevObj,
            step: 'otp',
            email: nimValidation.generatedEmail,
            nim: nim.trim(),
            fullName: fullName.trim(),
            password,
            sentAt: Date.now()
          }))
        } catch (storageErr) {}
        setResendTimer(60)
        setSuccessMsg(`Kode OTP baru berhasil dikirim ulang ke ${nimValidation.generatedEmail}.`)
      }
    } catch (err) {
      setErrorMsg('Gagal mengirim ulang kode OTP.')
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

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Password baru minimal terdiri dari 8 karakter.')
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

        // Sign out dulu agar AuthHandler tidak sempat melempar ke dashboard saat pending flag dihapus
        await supabase.auth.signOut()
        sessionStorage.removeItem('eventloop_pending_forgot_otp')

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
              <span>Inventarisasi Terpadu Ormawa & Auditorium Lantai M PMBS</span>
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    NIM (11 Digit) atau Email Terdaftar *
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
                <p className="text-xs text-slate-500">
                  Kode OTP pemulihan dikirim ke <strong className="text-slate-800 font-mono">{resolveEmailFromIdentifier(forgotIdentifier)}</strong>.
                </p>

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
                      Password Baru (Min. 8 Karakter) *
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
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
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
                      minLength={8}
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
              <form onSubmit={handleSignUpRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    NIM Mahasiswa (11 Digit Angka) *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={11}
                      required
                      value={nim}
                      onChange={(e) => handleNimChange(e.target.value)}
                      placeholder="Contoh: 23302410001"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all tracking-wider"
                    />
                  </div>
                  {nim.length === 11 && nimInfo.isValid && (
                    <p className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{nimInfo.prodiName} ({nimInfo.shortSchool} · Angkatan {nimInfo.angkatan})</span>
                    </p>
                  )}
                  {nim.length === 11 && !nimInfo.isValid && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{nimInfo.message}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap Mahasiswa *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Lengkap Sesuai KTM"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Buat Password Akun (Min. 8 Karakter) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      {showSignUpPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSignUpPassword ? 'Sembunyikan' : 'Lihat'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full pl-10 pr-10 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="mt-1 text-[11px] text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Kurang {8 - password.length} karakter lagi (minimal 8 karakter).</span>
                    </p>
                  )}
                  {password.length >= 8 && (
                    <p className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Panjang password memenuhi minimal 8 karakter ({password.length} karakter).</span>
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || nim.length !== 11 || !nimInfo.isValid}
                    className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/15"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{loading ? 'Mengirim Kode OTP...' : 'Daftar & Kirim Kode OTP ke Outlook'}</span>
                  </button>
                </div>
              </form>
            ) : (
              // STEP 2: FORM INPUT KODE OTP DARI EMAIL OUTLOOK (MENDUKUNG 6 ATAU 8 DIGIT)
              <form onSubmit={handleSignUpVerifyOtp} className="space-y-4 py-2 animate-fade-in text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200/60 shadow-2xs">
                  <KeyRound className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {otpVerifiedNeedsPassword ? 'Perbarui Password Akun' : 'Verifikasi Kode OTP'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    {otpVerifiedNeedsPassword
                      ? 'Email kampus Anda sudah terverifikasi. Masukkan password baru minimal 8 karakter untuk menyelesaikan pendaftaran.'
                      : (
                        <>
                          Masukkan kode verifikasi yang dikirim ke <strong className="text-slate-800 font-mono">{nim}@student.prasetiyamulya.ac.id</strong>. Mohon periksa juga folder <em>Junk / Spam</em> Outlook.
                        </>
                      )}
                  </p>
                </div>

                {!otpVerifiedNeedsPassword ? (
                  <div className="space-y-1 text-left pt-2">
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
                        onChange={(e) => setOtpCode(e.target.value.replace(/\s+/g, '').slice(0, 8))}
                        placeholder="12345678"
                        className="w-full text-center tracking-[0.25em] text-2xl font-black font-mono py-2.5 bg-emerald-50/30 border-2 border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 rounded-2xl text-emerald-950 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 text-center mt-1">
                      {otpCode.length}/8 digit (mendukung 6 atau 8 digit)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-left pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password Akun (Min. 8 Karakter) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 cursor-pointer"
                      >
                        {showSignUpPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSignUpPassword ? 'Sembunyikan' : 'Lihat'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={loading || (!otpVerifiedNeedsPassword && otpCode.trim().length < 6)}
                    className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/15"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {loading
                        ? (otpVerifiedNeedsPassword ? 'Menyimpan Password...' : 'Memverifikasi...')
                        : (otpVerifiedNeedsPassword ? 'Simpan Password & Masuk' : 'Verifikasi Kode & Selesaikan')}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (otpVerifiedNeedsPassword) {
                          try { await supabase.auth.signOut() } catch (e) {}
                          setOtpVerifiedNeedsPassword(false)
                        }
                        sessionStorage.removeItem('eventloop_pending_signup_otp')
                        setSignUpStep('form')
                        setOtpCode('')
                        setErrorMsg('')
                      }}
                      className="text-slate-500 hover:text-emerald-700 underline cursor-pointer"
                    >
                      ← Ubah Data Pendaftaran
                    </button>

                    {!otpVerifiedNeedsPassword && (
                      <button
                        type="button"
                        disabled={resendTimer > 0 || loading}
                        onClick={handleSignUpResendOtp}
                        className={`font-semibold cursor-pointer ${
                          resendTimer > 0 
                            ? 'text-slate-400 cursor-not-allowed' 
                            : 'text-emerald-700 hover:underline'
                        }`}
                      >
                        {resendTimer > 0 ? `Kirim ulang (${resendTimer}s)` : 'Kirim Ulang Kode'}
                      </button>
                    )}
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
