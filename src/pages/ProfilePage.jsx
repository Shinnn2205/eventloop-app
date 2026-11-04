import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
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
  const { 
    currentUserName, 
    setCurrentUserName,
    currentUserStudyProgram, 
    setCurrentUserStudyProgram,
    currentUserRole, 
    sessionUser,
    activeReservation,
    transactions = []
  } = useApp()

  // Form states
  const [fullName, setFullName] = useState(currentUserName || '')
  const [orgName, setOrgName] = useState(() => localStorage.getItem('eventloop_user_org') || 'BEM Universitas Prasetiya Mulya')
  const [prodi, setProdi] = useState(currentUserStudyProgram || '')
  const [nim, setNim] = useState(() => localStorage.getItem('eventloop_user_nim') || '')
  const [phone, setPhone] = useState(() => localStorage.getItem('eventloop_user_phone') || '081298765432')
  
  // Payout bank account
  const [bankName, setBankName] = useState(() => localStorage.getItem('eventloop_payout_bank') || 'BCA')
  const [accountNumber, setAccountNumber] = useState(() => localStorage.getItem('eventloop_payout_acc_number') || '8012345678')
  const [accountHolder, setAccountHolder] = useState(() => localStorage.getItem('eventloop_payout_acc_holder') || (currentUserName || 'Bendahara Organisasi'))

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Load existing profile from Supabase if possible
  useEffect(() => {
    async function loadDbProfile() {
      if (sessionUser?.id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .single()

          if (data) {
            if (data.full_name) setFullName(data.full_name)
            if (data.nim) setNim(data.nim)
            if (data.prodi) setProdi(data.prodi)
            if (data.phone) setPhone(data.phone)
            if (data.bank_name) setBankName(data.bank_name)
            if (data.bank_account) setAccountNumber(data.bank_account)
            if (data.bank_holder) setAccountHolder(data.bank_holder)
          }
        } catch (e) {
          console.warn('Load profile notice:', e)
        }
      }
    }
    loadDbProfile()
  }, [sessionUser])

  const userEmail = sessionUser?.email || `${nim ? nim + '@student.prasetiyamulya.ac.id' : 'mahasiswa@student.prasetiyamulya.ac.id'}`

  // Calculate personal org impact
  const userTxns = transactions.filter(t => 
    (t.borrowerName && t.borrowerName.toLowerCase().includes((fullName || '').toLowerCase())) ||
    (t.buyerOrg && t.buyerOrg.toLowerCase().includes((orgName || '').toLowerCase()))
  )

  const eventsCount = userTxns.length + (activeReservation?.eventName ? 1 : 0)
  const estimatedSaved = Math.max(eventsCount * 450000, 750000)
  const estimatedWasteAvoided = Math.max(eventsCount * 6.5, 12.5)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      setCurrentUserName(fullName.trim())
      if (setCurrentUserStudyProgram && prodi) {
        setCurrentUserStudyProgram(prodi.trim())
      }

      sessionStorage.setItem('eventloop_user_name', fullName.trim())
      localStorage.setItem('eventloop_user_name', fullName.trim())
      localStorage.setItem('eventloop_user_org', orgName.trim())
      localStorage.setItem('eventloop_user_nim', nim.trim())
      localStorage.setItem('eventloop_user_phone', phone.trim())
      localStorage.setItem('eventloop_payout_bank', bankName.trim())
      localStorage.setItem('eventloop_payout_acc_number', accountNumber.trim())
      localStorage.setItem('eventloop_payout_acc_holder', accountHolder.trim())

      if (sessionUser?.id) {
        await supabase.from('profiles').upsert({
          id: sessionUser.id,
          full_name: fullName.trim(),
          nim: nim.trim(),
          prodi: prodi.trim(),
          phone: phone.trim(),
          bank_name: bankName.trim(),
          bank_account: accountNumber.trim(),
          bank_holder: accountHolder.trim(),
          updated_at: new Date().toISOString()
        })
      }

      setSuccessMsg('Profil dan data rekening berhasil disimpan!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorMsg('Gagal menyimpan profil: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
                {orgName} · {prodi || 'Universitas Prasetiya Mulya'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 text-xs">
            <span className="badge-sage !py-1 !px-3 font-semibold">
              Role: {currentUserRole === 'admin' ? 'Administrator' : 'Ormawa / Mahasiswa'}
            </span>
            <span className="text-slate-500 text-[11px]">
              ID NIM: <strong>{nim || '23302410001'}</strong>
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
              Nomor WhatsApp PIC (Untuk Serah Terima) *
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
            <span className="text-[10px] text-slate-400 mt-1 block">
              Digunakan peminjam/pemilik lain untuk koordinasi serah terima via WhatsApp.
            </span>
          </div>
        </div>

        {/* Kolom 2: Rekening Pencairan Dana Kas (Escrow) */}
        <div className="card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-emerald-100/80 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Rekening Pencairan Dana Kas (Bagi Hasil 95%)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Rekening bank organisasi untuk menerima transfer bagi hasil sewa barang Anda.
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl text-[11px] text-emerald-950 leading-relaxed">
              <span className="font-bold text-emerald-900 block mb-0.5">🛡️ Rekening Escrow Terjamin:</span>
              Setiap kali barang inventaris organisasi Anda disewa oleh kepanitiaan lain, pengelola EventLoop akan mencairkan <strong>95% dana sewa</strong> ke nomor rekening ini setelah verifikasi.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilihan Bank *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
              >
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
                Nomor Rekening Bank *
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 8012345678"
                className="w-full px-3.5 py-2.5 bg-emerald-50/25 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Pemilik Rekening (a.n) *
              </label>
              <input
                type="text"
                required
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
