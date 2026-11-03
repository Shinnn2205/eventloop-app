import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  CalendarPlus, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Clock, 
  Lock,
  ClipboardList,
  RotateCcw
} from 'lucide-react'

const recommendedPackages = {
  Seminar: [
    { id: 1, name: 'Modular Event Booth Frame', qty: 1, reason: 'Meja registrasi & info desk peserta' },
    { id: 2, name: 'Standing Banner Frame Aluminium', qty: 3, reason: 'Penunjuk arah & welcome sign' },
    { id: 3, name: 'Portable PA Sound System', qty: 1, reason: 'Audio ruang diskusi pararel' },
    { id: 4, name: 'LED Floodlight Warm White 50W', qty: 2, reason: 'Pencahayaan panggung utama' },
  ],
  Bazaar: [
    { id: 1, name: 'Modular Event Booth Frame', qty: 4, reason: 'Stand tenant F&B dan produk mahasiswa' },
    { id: 5, name: 'Folding Table Multiplex 120x60cm', qty: 4, reason: 'Meja display produk tenant' },
    { id: 2, name: 'Standing Banner Frame Aluminium', qty: 2, reason: 'Daftar tenant & denah bazaar' },
    { id: 8, name: 'Reusable Cup Container Box', qty: 2, reason: 'Tempat pengumpulan gelas pakai ulang' },
  ],
  Competition: [
    { id: 2, name: 'Standing Banner Frame Aluminium', qty: 4, reason: 'Bracket jadwal & ruang tanding' },
    { id: 5, name: 'Folding Table Multiplex 120x60cm', qty: 3, reason: 'Meja dewan juri & timekeeper' },
    { id: 6, name: 'Velvet Crowd Control Rope Post', qty: 6, reason: 'Pembatas jalur peserta & penonton' },
  ],
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const { 
    equipments, 
    addToCart, 
    activeReservation, 
    updateActiveEventDetails,
    userPaymentStatus,
    currentUserRole,
    currentUserName
  } = useApp()

  const hasActiveEvent = currentUserRole === 'user' && Boolean(activeReservation?.eventName)

  const [eventName, setEventName] = useState('')
  const [orgName, setOrgName] = useState(currentUserName || 'BEM Universitas Prasetiya Mulya')
  const [eventType, setEventType] = useState('Seminar')
  const [eventDate, setEventDate] = useState('25 Nov 2026')
  const [durationDays, setDurationDays] = useState(1)
  const [location, setLocation] = useState('Auditorium Kampus BSD')
  const [attendees, setAttendees] = useState('250')
  const [showRecommendation, setShowRecommendation] = useState(false)

  const handleGenerate = (e) => {
    e.preventDefault()
    if (hasActiveEvent) return
    updateActiveEventDetails({
      eventName: eventName || `${eventType} Kampus Prasmul`,
      org: orgName,
      eventDate: `${eventDate} (${durationDays} Hari)`,
      durationDays: Math.max(1, Number(durationDays) || 1),
      type: eventType,
      location
    })
    setShowRecommendation(true)
  }

  const handleApplyPackage = () => {
    if (hasActiveEvent && userPaymentStatus !== 'idle') return
    const list = recommendedPackages[eventType] || recommendedPackages.Seminar
    list.forEach((rec) => {
      const eq = equipments.find((e) => e.id === rec.id)
      if (eq) addToCart(eq, rec.qty)
    })
    navigate('/reservation')
  }

  // JIKA SUDAH ADA EVENT AKTIF: TAMPILKAN KARTU INFORMASI YANG NYAMAN
  if (hasActiveEvent && !showRecommendation) {
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
                Kegiatan Anda Sedang Berlangsung
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Setiap akun hanya dapat menjalankan satu siklus kegiatan dalam satu waktu. Selesaikan pengembalian perlengkapan kegiatan ini terlebih dahulu sebelum membuat event baru.
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
              <span className="text-slate-500">Jadwal & Durasi Sewa</span>
              <strong className="text-emerald-700">{activeReservation.eventDate} ({activeReservation.durationDays || 1} Hari)</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status Saat Ini</span>
              <span className={
                userPaymentStatus === 'approved'
                  ? 'badge-sage'
                  : userPaymentStatus === 'pending_admin_approval'
                  ? 'badge-warm'
                  : 'badge-stone'
              }>
                {userPaymentStatus === 'approved'
                  ? 'Lunas / Sedang Dipinjam'
                  : userPaymentStatus === 'pending_admin_approval'
                  ? 'Menunggu Verifikasi Admin'
                  : 'Memilih Barang / Belum Bayar'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            {userPaymentStatus === 'idle' ? (
              <>
                <Link to="/marketplace" className="btn-primary text-xs flex items-center gap-2">
                  <span>Pilih Perlengkapan di Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/reservation" className="btn-secondary text-xs flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span>Lihat Keranjang Reservasi</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/reservation" className="btn-primary text-xs flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span>Lihat Tiket Reservasi</span>
                </Link>
                <Link to="/return" className="btn-secondary text-xs flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Halaman Pengembalian</span>
                </Link>
              </>
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
          Buat Kegiatan Baru
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Isi rincian acara dan lama hari peminjaman. Biaya sewa perlengkapan akan dihitung otomatis sesuai jumlah hari kegiatan.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form Buat Event */}
        <div className="lg:col-span-3 card p-6 sm:p-7">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Kegiatan / Event
              </label>
              <input 
                type="text" 
                required
                placeholder="Contoh: Prasmul Sustainability Week 2026"
                value={eventName} 
                onChange={(e) => setEventName(e.target.value)}
                className="cozy-input"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Organisasi Penyelenggara
                </label>
                <input 
                  type="text" 
                  required
                  value={orgName} 
                  onChange={(e) => setOrgName(e.target.value)}
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kategori Kegiatan
                </label>
                <select 
                  value={eventType}
                  onChange={(e) => {
                    setEventType(e.target.value)
                    setShowRecommendation(false)
                  }}
                  className="cozy-input"
                >
                  <option value="Seminar">Seminar / Talkshow / Workshop</option>
                  <option value="Bazaar">Bazaar / Festival / Expo</option>
                  <option value="Competition">Lomba / Kompetisi Mahasiswa</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Mulai
                </label>
                <input 
                  type="text" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)}
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Durasi Sewa (Hari)
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="30"
                  required
                  value={durationDays} 
                  onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="cozy-input font-semibold text-emerald-800 border-emerald-300 bg-emerald-50/50"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lokasi Pelaksanaan di Kampus
              </label>
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="cozy-input"
              />
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-800 leading-relaxed">
              💡 <strong>Perhitungan Harian:</strong> Untuk durasi <strong>{durationDays} hari</strong>, tarif sewa perlengkapan akan dikalikan otomatis dengan {durationDays} hari pada halaman pembayaran.
            </div>

            <div className="pt-2">
              <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4" />
                <span>Simpan Kegiatan & Lihat Rekomendasi Alat</span>
              </button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Rekomendasi Paket Sirkular */}
        <div className="lg:col-span-2">
          {showRecommendation ? (
            <div className="card p-6 space-y-5 border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center justify-between">
                <span className="badge-sage">Kegiatan Tersimpan</span>
                <span className="text-xs font-semibold text-emerald-700">Durasi: {durationDays} Hari</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rekomendasi Paket {eventType}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Untuk kegiatan <strong>{eventName}</strong> ({attendees} peserta):
                </p>
              </div>

              <div className="space-y-2.5">
                {(recommendedPackages[eventType] || recommendedPackages.Seminar).map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 text-xs truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.reason}</div>
                    </div>
                    <span className="badge-sage flex-shrink-0">
                      {item.qty} unit
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <button 
                  onClick={handleApplyPackage}
                  className="btn-primary w-full text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Gunakan Paket Ini & Lanjut Bayar</span>
                </button>
                <button 
                  onClick={() => navigate('/marketplace')}
                  className="btn-secondary w-full text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Pilih Manual di Marketplace</span>
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
                Simpan formulir di samping untuk membuka daftar rekomendasi perlengkapan sirkular atau langsung memilih barang di Marketplace.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
