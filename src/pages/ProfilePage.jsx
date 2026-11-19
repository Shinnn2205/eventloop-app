import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, formatIndonesianWaNumber, isSystemMetaTxn } from '../context/AppContext'
import { supabase } from '../lib/supabaseClient'
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Recycle, 
  DollarSign, 
  Calendar,
  Hash,
  AlertCircle
} from 'lucide-react'

export default function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { 
    currentUserName, 
    setCurrentUserName,
    currentUserStudyProgram, 
    setCurrentUserStudyProgram,
    currentUserOrg,
    setCurrentUserOrg,
    currentUserPhone,
    setCurrentUserPhone,
    isProfileComplete,
    saveUserContactToDirectory,
    currentUserRole, 
    sessionUser,
    activeReservation,
    transactions = []
  } = useApp()

  const isForcedOnboarding = currentUserRole === 'user' && (!isProfileComplete || searchParams.get('required') === '1')

  // Form states - Dikosongkan secara default sebelum diisi dan disimpan pengguna
  const [fullName, setFullName] = useState(currentUserName !== 'Prasmulyan' ? (currentUserName || '') : '')
  const [orgName, setOrgName] = useState(() => currentUserOrg || localStorage.getItem('eventloop_user_org') || '')
  const [prodi, setProdi] = useState(currentUserStudyProgram !== 'Prasetiya Mulya' ? (currentUserStudyProgram || '') : '')
  const [nim, setNim] = useState(() => localStorage.getItem('eventloop_user_nim') || '')
  const [phone, setPhone] = useState(() => currentUserPhone || localStorage.getItem('eventloop_user_phone') || '')
  
  // Payout bank account - Kosong secara default sebelum diatur
  const [bankName, setBankName] = useState(() => localStorage.getItem('eventloop_payout_bank') || '')
  const [accountNumber, setAccountNumber] = useState(() => localStorage.getItem('eventloop_payout_acc_number') || '')
  const [accountHolder, setAccountHolder] = useState(() => localStorage.getItem('eventloop_payout_acc_holder') || '')

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Muat data profil resmi pengguna dari Supabase database
  useEffect(() => {
    async function loadDbProfile() {
      if (sessionUser?.id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, nim, email')
            .eq('id', sessionUser.id)
            .single()

          const meta = sessionUser.user_metadata || {}

          if (data) {
            if (data.full_name) setFullName(data.full_name)
            if (data.nim) {
              setNim(data.nim)
              try { localStorage.setItem('eventloop_user_nim', data.nim) } catch (e) {}
            }
          }

          if (meta) {
            if (meta.full_name && !data?.full_name) setFullName(meta.full_name)
            if (meta.nim && !data?.nim) {
              setNim(meta.nim)
              try { localStorage.setItem('eventloop_user_nim', meta.nim) } catch (e) {}
            }
            if (meta.prodi_name) setProdi(meta.prodi_name)
            if (meta.org_name) {
              setOrgName(meta.org_name)
              try { localStorage.setItem('eventloop_user_org', meta.org_name) } catch (e) {}
            }
            if (meta.phone) {
              setPhone(meta.phone)
              try { localStorage.setItem('eventloop_user_phone', meta.phone) } catch (e) {}
            }
            if (meta.bank_name) {
              setBankName(meta.bank_name)
              try { localStorage.setItem('eventloop_payout_bank', meta.bank_name) } catch (e) {}
            }
            if (meta.bank_account) {
              setAccountNumber(meta.bank_account)
              try { localStorage.setItem('eventloop_payout_acc_number', meta.bank_account) } catch (e) {}
            }
            if (meta.bank_holder) {
              setAccountHolder(meta.bank_holder)
              try { localStorage.setItem('eventloop_payout_acc_holder', meta.bank_holder) } catch (e) {}
            }
          }
        } catch (e) {
          console.warn('Load profile notice:', e)
        }
      }
    }
    loadDbProfile()
  }, [sessionUser])

  const userEmail = sessionUser?.email || (nim ? `${nim}@student.prasetiyamulya.ac.id` : '-')

  // Hitung dampak sirkular ormawa murni dari transaksi/reservasi nyata tanpa data rekaan atau double-count
  const userTxns = transactions.filter(t => {
    if (isSystemMetaTxn(t.itemName)) return false
    const qLow = (t.qrisStatus || '').toLowerCase()
    if (qLow.includes('reject') || qLow.includes('tolak') || qLow.includes('cancel') || qLow.includes('batal')) return false
    if (sessionUser?.id && t.userId) return t.userId === sessionUser.id
    return (
      (fullName && t.borrowerName && t.borrowerName.toLowerCase().includes(fullName.toLowerCase())) ||
      (orgName && t.buyerOrg && t.buyerOrg.toLowerCase().includes(orgName.toLowerCase()))
    )
  })

  const activeAlreadyInTxns = Boolean(activeReservation?.txnId && userTxns.some(t => String(t.id) === String(activeReservation.txnId)))
  const eventsCount = userTxns.length + (activeReservation?.eventName && !activeAlreadyInTxns ? 1 : 0)
  const estimatedSaved = eventsCount > 0 ? eventsCount * 450000 : 0
  const estimatedWasteAvoided = eventsCount > 0 ? Number((eventsCount * 6.5).toFixed(1)) : 0
  const hasAnyBankInput = Boolean(bankName.trim() || accountNumber.trim() || accountHolder.trim())

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    if (!formatIndonesianWaNumber(phone)) {
      setErrorMsg('Nomor WhatsApp tidak valid. Masukkan minimal 10 digit nomor aktif (contoh: 0812xxxxxxxx atau 62812xxxxxxxx).')
      setSaving(false)
      return
    }

    if (hasAnyBankInput && (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim())) {
      setErrorMsg('Jika ingin menyimpan rekening pencairan dana, mohon lengkapi Pilihan Bank, Nomor Rekening, dan Nama Pemilik Rekening.')
      setSaving(false)
      return
    }

    const wasIncomplete = currentUserRole === 'user' && !isProfileComplete

    try {
      if (fullName.trim()) {
        setCurrentUserName(fullName.trim())
        sessionStorage.setItem('eventloop_user_name', fullName.trim())
        localStorage.setItem('eventloop_user_name', fullName.trim())
      }
      if (setCurrentUserStudyProgram && prodi.trim()) {
        setCurrentUserStudyProgram(prodi.trim())
        sessionStorage.setItem('eventloop_user_prodi', prodi.trim())
      }
      if (setCurrentUserOrg) setCurrentUserOrg(orgName.trim())
      if (setCurrentUserPhone) setCurrentUserPhone(phone.trim())

      localStorage.setItem('eventloop_user_org', orgName.trim())
      localStorage.setItem('eventloop_user_nim', nim.trim())
      localStorage.setItem('eventloop_user_phone', phone.trim())
      localStorage.setItem('eventloop_payout_bank', bankName.trim())
      localStorage.setItem('eventloop_payout_acc_number', accountNumber.trim())
      localStorage.setItem('eventloop_payout_acc_holder', accountHolder.trim())

      if (sessionUser?.id) {
        // 1. Simpan ke tabel profiles (kolom valid: id, full_name, nim, email, updated_at)
        const { error: profErr } = await supabase.from('profiles').upsert({
          id: sessionUser.id,
          email: sessionUser.email || (nim ? `${nim.trim()}@student.prasetiyamulya.ac.id` : ''),
          full_name: fullName.trim(),
          nim: nim.trim(),
          updated_at: new Date().toISOString()
        })

        // 2. Simpan metadata lengkap ke user_metadata akun Supabase Auth
        const { error: authErr } = await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            nim: nim.trim(),
            prodi_name: prodi.trim(),
            org_name: orgName.trim(),
            phone: phone.trim(),
            bank_name: bankName.trim(),
            bank_account: accountNumber.trim(),
            bank_holder: accountHolder.trim()
          }
        })

        if (profErr || authErr) {
          throw new Error(profErr?.message || authErr?.message || 'Gagal sinkronisasi ke cloud database')
        }
      }

      // 3. Simpan nomor WA ke direktori kontak cloud agar tombol "Kontak WhatsApp" lintas akun langsung tertuju ke WA Anda
      if (saveUserContactToDirectory) {
        await saveUserContactToDirectory({
          userId: sessionUser?.id || null,
          fullName: fullName.trim(),
          orgName: orgName.trim(),
          phone: phone.trim(),
          role: currentUserRole
        })
      }

      setSuccessMsg('Profil & nomor WhatsApp berhasil disimpan! Tombol kontak WhatsApp kini otomatis terhubung ke nomor Anda.')
      if (wasIncomplete || searchParams.get('required') === '1') {
        const dest = location.state?.from?.pathname && location.state.from.pathname !== '/profile'
          ? location.state.from.pathname
          : '/dashboard'
        setTimeout(() => navigate(dest, { replace: true }), 900)
      } else {
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch (err) {
      setErrorMsg('Gagal menyimpan profil: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner Wajib Lengkapi Profil & Nomor WhatsApp */}
      {isForcedOnboarding && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3 animate-fade-in shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-bold text-amber-950">
              📋 Wajib Lengkapi Profil &amp; Nomor WhatsApp Aktif Sebelum Melanjutkan
            </strong>
            <p className="leading-relaxed text-amber-900/90">
              Mohon lengkapi <strong>Nama Lengkap PIC</strong>, <strong>Nama Organisasi / Kepanitiaan</strong>, dan <strong>Nomor WhatsApp Aktif</strong> terlebih dahulu. Nomor WhatsApp Anda akan digunakan agar panitia lain, pemilik barang, atau Admin dapat menghubungi Anda langsung melalui tombol <em>Kontak WhatsApp</em>.
            </p>
          </div>
        </div>
      )}
      {/* Header Profile */}
      <div className="bg-gradient-to-br from-emerald-50/95 via-green-50/75 to-teal-50/80 border border-emerald-200/70 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-emerald-600/20">
              {(fullName || 'P').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/80 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200/60 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Akun Terverifikasi SSO Kampus</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {fullName || 'Mahasiswa Prasetiya Mulya'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                {orgName ? `${orgName} · ` : ''}{prodi || 'Universitas Prasetiya Mulya'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 text-xs">
            <span className="badge-sage !py-1 !px-3 font-semibold">
              Role: {currentUserRole === 'admin' ? 'Administrator' : 'Ormawa / Mahasiswa'}
            </span>
            <span className="text-slate-500 text-[11px]">
              ID NIM: <strong>{nim || '-'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Ormawa Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium">Event Diselenggarakan</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{eventsCount} Kegiatan</div>
            <div className="text-[11px] text-emerald-700">Dikelola via EventLoop</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 border border-green-100">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium">Penghematan Anggaran Kas</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">Rp{estimatedSaved.toLocaleString('id-ID')}</div>
            <div className="text-[11px] text-green-700">Hindari belanja beli baru</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100">
            <Recycle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium">Sampah Acara Dicegah</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{estimatedWasteAvoided} kg</div>
            <div className="text-[11px] text-teal-700">Zero-Waste Campus Target</div>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Settings Grid */}
      <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-6">
        {/* Kolom 1: Identitas & Kontak */}
        <div className="card p-6 space-y-4">
          <div className="border-b border-emerald-100/80 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Identitas PIC & Organisasi
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Data penanggung jawab peminjaman dan pengelolaan inventaris ormawa.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap PIC *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Organisasi / Kepanitiaan *
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Contoh: BEM Prasmul / HIMA DBT / Panitia Inisiasi"
              className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                NIM (11 Digit)
              </label>
              <input
                type="text"
                maxLength={11}
                value={nim}
                onChange={(e) => setNim(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Program Studi
              </label>
              <input
                type="text"
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                placeholder="Contoh: Renewable Energy"
                className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email SSO Outlook Kampus
            </label>
            <input
              type="email"
              disabled
              value={userEmail}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Terkunci sesuai akun login resmi</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp PIC *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full pl-10 pr-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Kolom 2: Rekening Pencairan Dana Kas (Escrow) */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-emerald-100/80 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Rekening Pencairan Dana Kas
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilihan Bank {hasAnyBankInput ? '*' : '(Opsional)'}
              </label>
              <select
                required={hasAnyBankInput}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
              >
                <option value="">-- Belum Diatur / Pilih Bank --</option>
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="Bank Mandiri">Bank Mandiri</option>
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="Bank Permata">Bank Permata</option>
                <option value="Bank Jago">Bank Jago</option>
                <option value="Bank Syariah Indonesia">BSI (Bank Syariah Indonesia)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor Rekening Bank {hasAnyBankInput ? '*' : '(Opsional)'}
              </label>
              <input
                type="text"
                required={hasAnyBankInput}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 8012345678"
                className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Pemilik Rekening (a.n) {hasAnyBankInput ? '*' : '(Opsional)'}
              </label>
              <input
                type="text"
                required={hasAnyBankInput}
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Contoh: BEM Prasmul / Bendahara Acara"
                className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-100/80">
            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Profil & Rekening'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
