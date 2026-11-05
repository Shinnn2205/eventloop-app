import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp, formatIdDate } from '../context/AppContext'
import { 
  CalendarPlus, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Clock, 
  Lock, 
  ClipboardList, 
  RotateCcw,
  Trash2,
  CheckCircle2,
  Package,
  AlertCircle
} from 'lucide-react'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { 
    equipments = [], 
    addToCart, 
    activeReservation, 
    updateActiveEventDetails,
    clearActiveEvent,
    userPaymentStatus,
    currentUserRole,
    currentUserName
  } = useApp()

  // Sesi terkunci hanya jika pembayaran sudah dikirim atau disetujui
  const isPaidEvent = currentUserRole === 'user' && Boolean(
    activeReservation?.eventName && (userPaymentStatus === 'approved' || userPaymentStatus === 'pending_admin_approval')
  )
  const isDraftEvent = currentUserRole === 'user' && Boolean(
    activeReservation?.eventName && userPaymentStatus === 'idle'
  )

  const [eventName, setEventName] = useState(() => activeReservation?.eventName || '')
  const [orgName, setOrgName] = useState(() => activeReservation?.org || localStorage.getItem('eventloop_user_org') || (currentUserName !== 'Prasmulyan' ? currentUserName : '') || '')
  const [eventType, setEventType] = useState(() => activeReservation?.type || 'Seminar')
  const [startDate, setStartDate] = useState(() => activeReservation?.startDate || '2026-11-25')
  const [endDate, setEndDate] = useState(() => activeReservation?.endDate || '2026-11-27')
  const [durationDays, setDurationDays] = useState(() => activeReservation?.durationDays || 2)
  const [location, setLocation] = useState(() => activeReservation?.location || 'Auditorium Kampus BSD')
  const [attendees, setAttendees] = useState('250')
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [infoAlert, setInfoAlert] = useState('')

  // Sinkronkan form saat activeReservation berubah
  useEffect(() => {
    if (activeReservation?.eventName) {
      if (activeReservation.eventName) setEventName(activeReservation.eventName)
      if (activeReservation.org) setOrgName(activeReservation.org)
      if (activeReservation.type) setEventType(activeReservation.type)
      if (activeReservation.startDate) setStartDate(activeReservation.startDate)
      if (activeReservation.endDate) setEndDate(activeReservation.endDate)
      if (activeReservation.durationDays) setDurationDays(activeReservation.durationDays)
      if (activeReservation.location) setLocation(activeReservation.location)
    }
  }, [activeReservation])

  // Hitung selisih hari saat tanggal mulai / selesai berubah
  const handleStartDateChange = (val) => {
    setStartDate(val)
    if (val && endDate) {
      const s = new Date(val)
      const e = new Date(endDate)
      if (e >= s) {
        const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) || 1)
        setDurationDays(diff)
      } else {
        setEndDate(val)
        setDurationDays(1)
      }
    }
  }

  const handleEndDateChange = (val) => {
    setEndDate(val)
    if (startDate && val) {
      const s = new Date(startDate)
      const e = new Date(val)
      if (e >= s) {
        const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) || 1)
        setDurationDays(diff)
      }
    }
  }

  const handleDurationChange = (daysVal) => {
    const d = Math.max(1, parseInt(daysVal, 10) || 1)
    setDurationDays(d)
    if (startDate) {
      const s = new Date(startDate)
      if (!isNaN(s.getTime())) {
        const e = new Date(s)
        e.setDate(s.getDate() + d)
        setEndDate(e.toISOString().split('T')[0])
      }
    }
  }

  const startDateLabel = formatIdDate(startDate) || startDate
  const endDateLabel = formatIdDate(endDate) || endDate

  // AMBIL REKOMENDASI BARANG LANGSUNG DARI PERLENGKAPAN YANG ADA DI MARKETPLACE (BUKAN KARANGAN SENDIRI)
  const dynamicRecommendations = useMemo(() => {
    if (!equipments || equipments.length === 0) return []

    const typeLower = (eventType || '').toLowerCase()
    const targetKeywords = {
      seminar: ['banner', 'signage', 'sound', 'audio', 'led', 'light', 'booth', 'proyektor', 'mic'],
      bazaar: ['booth', 'table', 'meja', 'banner', 'signage', 'cup', 'container', 'stand'],
      competition: ['banner', 'signage', 'rope', 'post', 'table', 'meja', 'sound', 'audio', 'led']
    }[typeLower] || ['banner', 'signage', 'sound', 'booth', 'led']

    // Filter dan urutkan item nyata dari database berdasarkan kesesuaian kategori & ketersediaan
    const scored = equipments.map(eq => {
      const text = `${eq.name} ${eq.category} ${eq.description || ''}`.toLowerCase()
      let score = 0
      targetKeywords.forEach(kw => {
        if (text.includes(kw)) score += 3
      })
      if (eq.available > 0) score += 2
      if (eq.listingType !== 'sale') score += 1
      return { eq, score }
    })

    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, 4).map(({ eq }) => {
      const cat = (eq.category || '').toLowerCase()
      const name = (eq.name || '').toLowerCase()
      let reason = 'Tersedia di katalog Marketplace'
      if (cat.includes('signage') || name.includes('banner')) {
        reason = 'Penunjuk arah & backdrop resmi acara'
      } else if (cat.includes('electronics') || name.includes('sound') || name.includes('led') || name.includes('light')) {
        reason = 'Pencahayaan & tata suara panggung'
      } else if (cat.includes('booth') || name.includes('booth')) {
        reason = 'Meja registrasi & display ormawa'
      } else if (cat.includes('furniture') || name.includes('table') || name.includes('meja')) {
        reason = 'Fasilitas meja panitia & peserta'
      }

      return {
        equipment: eq,
        qty: Math.min(eq.available > 0 ? eq.available : 1, 2),
        reason
      }
    })
  }, [equipments, eventType])

  const handleGenerate = (e) => {
    e.preventDefault()
    if (isPaidEvent) return

    updateActiveEventDetails({
      eventName: eventName.trim() || `${eventType} Kampus Prasmul`,
      org: orgName.trim(),
      borrowerName: currentUserName || 'Prasmulyan',
      startDate,
      endDate,
      startDateLabel,
      endDateLabel,
      eventDate: `${startDateLabel} – ${endDateLabel}`,
      durationDays: Math.max(1, Number(durationDays) || 1),
      type: eventType,
      location: location.trim()
    })
    setShowRecommendation(true)
    setInfoAlert('Kegiatan berhasil disimpan! Silakan cek rekomendasi perlengkapan di samping.')
    setTimeout(() => setInfoAlert(''), 4000)
  }

  const handleApplyPackage = () => {
    if (dynamicRecommendations.length === 0) {
      navigate('/marketplace')
      return
    }
    dynamicRecommendations.forEach((rec) => {
      addToCart(rec.equipment, rec.qty)
    })
    navigate('/reservation')
  }

  // FUNGSI BATALKAN EVENT (DIPAKAI SEBELUM BAYAR ATAU SELAMA DRAFT)
  const handleCancelEvent = () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan event ini? Semua perlengkapan yang ada di keranjang juga akan direset.')) {
      clearActiveEvent()
      setEventName('')
      setShowRecommendation(false)
      setInfoAlert('Event berhasil dibatalkan. Anda dapat merancang kegiatan baru kapan saja.')
      setTimeout(() => setInfoAlert(''), 4000)
    }
  }

  // JIKA EVENT SUDAH DIBAYAR / SUDAH DIVERIFIKASI (SEDANG BERJALAN)
  if (isPaidEvent) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="card p-7 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200/70">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="badge-sage mb-2">1 Akun · 1 Event Aktif</span>
              <h2 className="text-xl font-bold text-slate-900">
                Kegiatan Anda Sedang Berjalan
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pembayaran untuk kegiatan <strong>"{activeReservation.eventName}"</strong> telah dikirimkan / disetujui. Selesaikan pengembalian perlengkapan kegiatan ini terlebih dahulu sebelum membuat event baru.
              </p>
            </div>
          </div>

          <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-emerald-100/70">
              <span className="text-slate-500">Nama Kegiatan</span>
              <strong className="text-slate-900">{activeReservation.eventName}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-emerald-100/70">
              <span className="text-slate-500">Penyelenggara</span>
              <strong className="text-slate-800">{activeReservation.org}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-emerald-100/70">
              <span className="text-slate-500">Periode Peminjaman</span>
              <strong className="text-emerald-700">
                {activeReservation.startDateLabel ? `${activeReservation.startDateLabel} s/d ${activeReservation.endDateLabel}` : activeReservation.eventDate} ({activeReservation.durationDays || 1} Hari)
              </strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status Saat Ini</span>
              <span className={
                userPaymentStatus === 'approved'
                  ? 'badge-sage'
                  : 'badge-warm'
              }>
                {userPaymentStatus === 'approved'
                  ? 'Lunas / Sedang Dipinjam'
                  : 'Menunggu Verifikasi Admin'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap gap-2.5">
              <Link to="/reservation" className="btn-primary text-xs flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span>Lihat Tiket Reservasi</span>
              </Link>
              <Link to="/return" className="btn-secondary text-xs flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Halaman Pengembalian</span>
              </Link>
            </div>

            {userPaymentStatus === 'pending_admin_approval' && (
              <button
                type="button"
                onClick={handleCancelEvent}
                className="text-xs text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
              >
                Batalkan Pengajuan
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <span className="badge-sage mb-2">
          <CalendarPlus className="w-3.5 h-3.5" /> Tahap 1 · Perencanaan Kegiatan
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isDraftEvent ? 'Ubah Rincian Kegiatan' : 'Buat Kegiatan Baru'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Tentukan tanggal mulai, durasi, dan nama acara Anda. Sebelum pembayaran, Anda dapat bebas mengubah data atau membatalkan event kapan saja.
        </p>
      </div>

      {/* ALERT NOTIFIKASI */}
      {infoAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{infoAlert}</span>
        </div>
      )}

      {/* BANNER DRAFT & OPSI BATALKAN SEBELUM BAYAR */}
      {isDraftEvent && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="font-bold text-emerald-900 block mb-0.5">
              ✏️ Mode Perencanaan / Draft Event Aktif:
            </span>
            Anda sedang merancang event <strong>"{activeReservation.eventName}"</strong>. Anda bebas mengganti nama, tanggal, atau membatalkannya sebelum pembayaran diselesaikan.
          </div>
          <button
            type="button"
            onClick={handleCancelEvent}
            className="btn-secondary !bg-white hover:!bg-rose-50 hover:!text-rose-700 hover:!border-rose-300 text-slate-700 !py-1.5 !px-3 text-xs font-bold whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            Batalkan Event Ini
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form Buat / Ubah Event */}
        <div className="lg:col-span-3 card p-6 sm:p-7 space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Kegiatan / Acara Kampus *
              </label>
              <input 
                type="text" 
                required
                value={eventName} 
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Contoh: Prasmul Olympic 2026 / Inisiasi Kampus / Seminar Green Tech"
                className="cozy-input"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Organisasi Penyelenggara *
                </label>
                <input 
                  type="text" 
                  required
                  value={orgName} 
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Contoh: BEM Prasmul / HIMA DBT"
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipe Kegiatan
                </label>
                <select 
                  value={eventType} 
                  onChange={(e) => setEventType(e.target.value)}
                  className="cozy-input cursor-pointer"
                >
                  <option value="Seminar">Seminar & Konferensi</option>
                  <option value="Bazaar">Bazaar & Festival F&B</option>
                  <option value="Competition">Kompetisi & Perlombaan</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dari Tanggal (Mulai) *
                </label>
                <input 
                  type="date" 
                  required
                  value={startDate} 
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sampai Tanggal (Selesai) *
                </label>
                <input 
                  type="date" 
                  required
                  min={startDate}
                  value={endDate} 
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Total Durasi (Hari)
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="30"
                  required
                  value={durationDays} 
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="cozy-input font-semibold text-emerald-800 border-emerald-300 bg-emerald-50/50"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lokasi Pelaksanaan di Kampus *
                </label>
                <input 
                  type="text" 
                  required
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Auditorium Kampus BSD / Atrium Gedung C"
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estimasi Peserta
                </label>
                <input 
                  type="number" 
                  value={attendees} 
                  onChange={(e) => setAttendees(e.target.value)}
                  className="cozy-input"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                <Sparkles className="w-4 h-4" />
                <span>{isDraftEvent ? 'Perbarui Data Event & Lihat Rekomendasi' : 'Simpan Kegiatan & Lihat Rekomendasi Alat'}</span>
              </button>

              {isDraftEvent && (
                <button
                  type="button"
                  onClick={handleCancelEvent}
                  className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Batalkan Kegiatan Ini</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Rekomendasi Alat Otomatis Berdasarkan Marketplace */}
        <div className="lg:col-span-2">
          {showRecommendation || isDraftEvent ? (
            <div className="card p-6 space-y-5 border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center justify-between">
                <span className="badge-sage">Rekomendasi Marketplace</span>
                <span className="text-xs font-semibold text-emerald-700">{startDateLabel} – {endDateLabel}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rekomendasi Alat untuk {eventType}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Disesuaikan langsung dengan katalog barang yang aktif di Marketplace ({durationDays} hari):
                </p>
              </div>

              {/* LIST REKOMENDASI BARANG NYATA DARI MARKETPLACE */}
              <div className="space-y-2.5">
                {dynamicRecommendations.length > 0 ? (
                  dynamicRecommendations.map((rec, idx) => (
                    <div 
                      key={rec.equipment.id || idx} 
                      className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden text-base">
                          {rec.equipment.imageUrl ? (
                            <img src={rec.equipment.imageUrl} alt={rec.equipment.name} className="w-full h-full object-cover" />
                          ) : (
                            rec.equipment.image || '📦'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate" title={rec.equipment.name}>
                            {rec.equipment.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{rec.reason}</div>
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Stok: {rec.equipment.available} unit · Rp{(rec.equipment.price || 0).toLocaleString('id-ID')}/hari
                          </div>
                        </div>
                      </div>
                      <span className="badge-sage flex-shrink-0">
                        {rec.qty} unit
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-emerald-100 text-center text-xs text-slate-500 space-y-1">
                    <Package className="w-5 h-5 text-emerald-600 mx-auto" />
                    <p>Belum ada perlengkapan yang tersedia di Marketplace saat ini.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <button 
                  onClick={handleApplyPackage}
                  disabled={dynamicRecommendations.length === 0}
                  className="btn-primary w-full text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>Terapkan Rekomendasi & Lanjut Reservasi</span>
                </button>
                <button 
                  onClick={() => navigate('/marketplace')}
                  className="btn-secondary w-full text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Pilih Sendiri di Marketplace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-8 h-full flex flex-col items-center justify-center text-center space-y-3 bg-emerald-50/20 border-dashed border-emerald-200">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Rekomendasi Perlengkapan Otomatis
              </h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Simpan formulir di samping untuk melihat rekomendasi perlengkapan yang tersedia langsung dari katalog Marketplace.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
