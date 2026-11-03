import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  Sparkles,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2
} from 'lucide-react'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { activeReservation, setActiveReservation, clearActiveEvent, userPaymentStatus, currentUserName } = useApp()
  
  // Deteksi apakah akun ini sudah punya 1 event aktif
  const hasActiveEvent = Boolean(activeReservation && activeReservation.eventName)

  const [eventName, setEventName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [durationDays, setDurationDays] = useState(1)
  const [location, setLocation] = useState('')
  const [participants, setParticipants] = useState('')
  const [eventType, setEventType] = useState('Expo / Bazaar')
  const [notes, setNotes] = useState('')

  // Hitung durasi hari secara otomatis saat tanggal dipilih
  const handleStartDateChange = (val) => {
    setStartDate(val)
    if (endDate && val) {
      const s = new Date(val)
      const e = new Date(endDate)
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1
      setDurationDays(diff > 0 ? diff : 1)
    } else if (!endDate) {
      setEndDate(val)
      setDurationDays(1)
    }
  }

  const handleEndDateChange = (val) => {
    setEndDate(val)
    if (startDate && val) {
      const s = new Date(startDate)
      const e = new Date(val)
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1
      setDurationDays(diff > 0 ? diff : 1)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Simpan event dengan sistem peminjaman per hari
    setActiveReservation({
      eventName: eventName.trim() || 'Event Kampus',
      startDate,
      endDate: endDate || startDate,
      eventDate: startDate,
      durationDays: Math.max(1, parseInt(durationDays) || 1),
      location: location.trim() || 'Kampus',
      participants: participants || '100',
      eventType,
      notes: notes.trim(),
      items: []
    })

    // Langsung arahkan ke Marketplace untuk memilih perlengkapan
    navigate('/marketplace')
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
          <Calendar className="w-3.5 h-3.5" /> Manajemen Event Kampus
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {hasActiveEvent ? 'Status Event Aktif Anda' : 'Buat Event Baru'}
        </h2>
        <p className="text-sm text-gray-500">
          {hasActiveEvent 
            ? 'Setiap akun dibatasi hanya dapat menyelenggarakan 1 event aktif dalam satu waktu.' 
            : 'Isi detail event organisasi Anda. Biaya sewa peralatan akan dihitung otomatis sesuai jumlah hari pelaksanaan.'
          }
        </p>
      </div>

      {/* KONDISI 1: JIKA AKUN SUDAH MEMILIKI 1 EVENT AKTIF -> BLOKIR BUAT LAGI */}
      {hasActiveEvent ? (
        <div className="card p-6 md:p-8 border-2 border-amber-300 bg-amber-50/40 space-y-6 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                Batasan Akun: 1 Akun = 1 Event
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-1">
                Akun Anda Sudah Memiliki 1 Event Aktif
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Untuk menjaga ketersediaan perlengkapan bagi seluruh organisasi di Prasetiya Mulya, Anda tidak dapat membuat event baru sebelum event aktif saat ini diselesaikan atau dibatalkan.
              </p>
            </div>
          </div>

          {/* Rincian Event yang Sedang Berjalan */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-500">Kepanitiaan / Penyelenggara:</span>
              <strong className="text-gray-900">{currentUserName || 'Mahasiswa Prasmul'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Nama Kegiatan Event:</span>
              <strong className="text-base font-extrabold text-emerald-800">{activeReservation.eventName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Jadwal & Durasi Peminjaman:</span>
              <span className="font-semibold text-gray-800">
                {activeReservation.startDate || activeReservation.eventDate} s.d {activeReservation.endDate || activeReservation.eventDate} 
                <span className="ml-1.5 bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {activeReservation.durationDays || 1} Hari
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Lokasi Acara:</span>
              <strong className="text-gray-800">{activeReservation.location || 'Kampus BSD'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status Pembayaran Reservasi:</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                userPaymentStatus === 'approved_success' 
                  ? 'bg-green-100 text-green-800' 
                  : userPaymentStatus === 'pending_admin_approval'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {userPaymentStatus === 'approved_success' ? '✓ Lunas (Di-ACC Admin)' : userPaymentStatus === 'pending_admin_approval' ? '⏳ Menunggu ACC Admin' : 'Draft / Pemilihan Barang'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link 
              to="/reservation"
              className="w-full sm:w-auto btn-primary text-xs !py-3 !px-6 flex items-center justify-center gap-2 shadow-md shadow-green-700/20"
            >
              <span>Buka Halaman Reservasi Event Ini</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin membatalkan event aktif ini? Semua daftar perlengkapan yang telah dipilih akan di-reset.')) {
                  clearActiveEvent()
                }
              }}
              className="w-full sm:w-auto text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Batalkan / Reset Event Ini</span>
            </button>
          </div>
        </div>
      ) : (
        /* KONDISI 2: FORM PEMBUATAN EVENT JIKA BELUM ADA EVENT AKTIF */
        <div className="card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nama Kegiatan / Event *
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="cth. Seminar Nasional CTI 2026"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
              />
            </div>

            {/* SISTEM PEMINJAMAN PER HARI: TANGGAL MULAI, SELESAI, & DURASI */}
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-green-50/60 border border-green-200/80 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-green-950 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-green-700" />
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-green-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-green-950 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-green-700" />
                  Tanggal Selesai *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-green-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-green-950 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-green-700" />
                  Durasi Peminjaman *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-white border border-green-300 rounded-xl text-xs font-bold text-center text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-700 pointer-events-none">
                    Hari
                  </span>
                </div>
                <span className="text-[10px] text-green-800 block mt-1">
                  💡 Biaya sewa dikalikan {durationDays} hari
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tipe Event
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-gray-800"
                >
                  <option>Expo / Bazaar</option>
                  <option>Seminar / Workshop</option>
                  <option>Lomba / Kompetisi</option>
                  <option>Music / Panggung Hiburan</option>
                  <option>Rapat Kerja / Dies Natalis</option>
                  <option>Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Lokasi Kegiatan Kampus *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Auditorium / Lapangan / Selasar"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Estimasi Peserta (Orang)
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="cth. 250"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Catatan Kebutuhan Acara (Opsional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan khusus atau perlengkapan yang direncanakan untuk event ini..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                * 1 Akun hanya diperbolehkan mengelola 1 event aktif dalam satu waktu.
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto btn-primary text-sm !py-3 !px-6 flex items-center justify-center gap-2 shadow-green-600/20"
              >
                <span>Lanjut Pilih Perlengkapan di Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
