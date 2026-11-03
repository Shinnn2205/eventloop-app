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
  
  // State verifikasi email: 'form' (isi data) atau 'sent' (link terkirim ke Outlook)
  const [signUpStep, setSignUpStep] = useState('form')
  
  // Field form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nim, setNim] = useState('')
  const [role, setRole] = useState('student_org') // 'student_org' | 'sarpras'

  // State status
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Timer cooldown untuk kirim ulang link
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
  // 2. ALUR DAFTAR AKUN MAHASISWA (KIRIM LINK VERIFIKASI KE OUTLOOK)
  // ============================================================
  const handleSignUpRequestLink = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!fullName.trim()) {
      setErrorMsg('Mohon lengkapi Nama Lengkap Anda sesuai identitas kampus.')
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
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, nim')
        .eq('nim', nim.trim())
        .maybeSingle()

      if (existingUser) {
        setErrorMsg(`NIM ${nim.trim()} sudah terdaftar dalam sistem. Silakan langsung login pada tab 'Masuk (Login)'.`)
        setLoading(false)
        return
      }

      // 2. Kirim link verifikasi otomatis via Gmail SMTP ke Outlook mahasiswa
      const { error } = await supabase.auth.signInWithOtp({
        email: studentEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
          data: {
            full_name: fullName.trim(),
            nim: nim.trim(),
            role: 'student_org'
          }
        }
      })

      if (error) {
        setErrorMsg('Gagal mengirim link verifikasi: ' + error.message)
      } else {
        setSignUpStep('sent')
        setResendTimer(60)
        setSuccessMsg(`Link verifikasi berhasil dikirim ke ${studentEmail}!`)
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi saat mengirim email verifikasi.')
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
              <span>Daftar Akun Mahasiswa</span>
            </button>
          </div>

          {/* Header Title */}
          <div className="mb-5">
            <h3 className="text-2xl font-bold text-gray-900">
              {activeTab === 'login' 
                ? 'Selamat Datang Kembali 👋' 
                : (signUpStep === 'sent' ? 'Periksa Inbox Outlook Kampus' : 'Daftar Akun Mahasiswa Resmi')
              }
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {activeTab === 'login'
                ? 'Masukkan NIM/email dan password akun Anda untuk masuk'
                : (signUpStep === 'sent'
                    ? `Link verifikasi telah dikirim ke ${nim}@student.prasetiyamulya.ac.id`
                    : 'Pendaftaran diverifikasi langsung melalui link resmi ke Outlook kampus.')
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
                  {role === 'sarpras' ? 'Email Administrator Sarpras *' : 'NIM (11 Digit) atau Email Kampus *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'sarpras' ? 'admin@gmail.com' : 'Contoh: 23302410001 atau nim@student...'}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
                {role === 'student_org' && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    💡 Cukup ketik 11 digit NIM atau alamat email mahasiswa Anda.
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
          )}

          {/* ======================================================= */}
          {/* TAB 2: BUAT AKUN BARU -> LINK VERIFIKASI KE OUTLOOK      */}
          {/* ======================================================= */}
          {activeTab === 'signup' && (
            signUpStep === 'form' ? (
              // STEP 1: INPUT DATA MAHASISWA & KIRIM LINK KE OUTLOOK
              <form onSubmit={handleSignUpRequestLink} className="space-y-3.5">
                <div className="bg-green-50 border border-green-200 p-3 rounded-2xl flex items-start gap-2.5 text-[11px] text-green-950 font-medium leading-relaxed">
                  <ShieldCheck className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-green-900 block mb-0.5">Verifikasi Resmi Outlook Kampus</span>
                    Link verifikasi akan dikirimkan langsung ke email Outlook kampus Anda. Cukup klik link tersebut untuk langsung aktif dan masuk ke Dashboard tanpa ribet!
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
                      placeholder="Contoh: 23302410001"
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
                      Email Kampus Resmi
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
                    <Mail className="w-4 h-4" />
                    <span>{loading ? 'Mengirim Link Verifikasi...' : 'Kirim Link Verifikasi ke Outlook Kampus'}</span>
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    Sistem akan mengirimkan link masuk langsung ke email Outlook mahasiswa Anda.
                  </p>
                </div>
              </form>
            ) : (
              // STEP 2: SCREEN MENUNGGU KLIK DI OUTLOOK
              <div className="space-y-4 py-2 animate-fade-in-up text-center">
                <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Mail className="w-8 h-8 animate-bounce" />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900">Link Verifikasi Terkirim!</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Kami telah mengirimkan link masuk resmi ke kotak masuk Outlook Anda:
                  </p>
                  <div className="inline-block bg-green-50 border border-green-200 text-green-950 font-bold font-mono px-3 py-1.5 rounded-xl text-xs mt-2">
                    {nim}@student.prasetiyamulya.ac.id
                  </div>
                </div>

                <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl text-left text-xs text-blue-950 space-y-1.5 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Langkah Mudah:</span>
                  </div>
                  <p>1. Buka <strong>Outlook / Webmail Kampus Prasetiya Mulya</strong> di tab lain atau di HP Anda.</p>
                  <p>2. Cari email dari <strong>EventLoop Prasetiya Mulya</strong>.</p>
                  <p>3. <strong>Klik link verifikasi</strong> di dalam email tersebut. Anda akan langsung otomatis masuk ke Dashboard EventLoop tanpa perlu memasukkan kode apapun!</p>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href="https://outlook.office.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all block"
                  >
                    <span>Buka Outlook Webmail Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setSignUpStep('form')}
                      className="text-gray-500 hover:text-gray-700 underline"
                    >
                      ← Ubah Data Pendaftaran
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handleSignUpRequestLink}
                      className={`font-semibold ${
                        resendTimer > 0 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-green-700 hover:underline'
                      }`}
                    >
                      {resendTimer > 0 ? `Kirim ulang link (${resendTimer}s)` : 'Kirim Ulang Link'}
                    </button>
                  </div>
                </div>
              </div>
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
