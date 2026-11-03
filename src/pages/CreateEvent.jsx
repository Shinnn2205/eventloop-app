import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  FileText,
  Clock,
  Trash2,
  CheckCircle2
} from 'lucide-react'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { activeReservation, setActiveReservation, clearActiveEvent, userPaymentStatus, currentUserName } = useApp()
  
  const hasActiveEvent = Boolean(activeReservation && activeReservation.eventName)

  const [eventName, setEventName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [durationDays, setDurationDays] = useState(1)
  const [location, setLocation] = useState('')
  const [participants, setParticipants] = useState('')
  const [eventType, setEventType] = useState('Expo / Bazaar')
  const [notes, setNotes] = useState('')

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
    navigate('/marketplace')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <span className="text-xs font-medium text-[#3A6351]">Manajemen Kegiatan</span>
        <h2 className="text-2xl font-bold text-[#232925] mt-0.5">
          {hasActiveEvent ? 'Event Aktif Anda' : 'Buat Event Baru'}
        </h2>
        <p className="text-sm text-[#5C645E] mt-1">
          {hasActiveEvent 
            ? 'Setiap akun dibatasi untuk mengelola 1 event aktif dalam satu waktu.' 
            : 'Tentukan jadwal pelaksanaan agar biaya sewa dihitung otomatis sesuai jumlah hari.'}
        </p>
      </div>

      {hasActiveEvent ? (
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3.5 pb-5 border-b border-[#EFECE6]">
            <div className="w-10 h-10 rounded-xl bg-[#EAF0EC] text-[#3A6351] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#232925]">
                  {activeReservation.eventName}
                </h3>
                <span className="badge-sage">1 Event Aktif</span>
              </div>
              <p className="text-xs text-[#7A827C] mt-1">
                Selesaikan pengembalian barang atau batalkan event ini jika Anda ingin membuat jadwal event yang baru.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E6DF] text-xs space-y-3">
            <div className="flex justify-between">
              <span className="text-[#7A827C]">Penyelenggara</span>
              <span className="font-medium text-[#232925]">{currentUserName || 'Mahasiswa'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A827C]">Tanggal Pelaksanaan</span>
              <span className="font-medium text-[#232925]">
                {activeReservation.startDate || activeReservation.eventDate || '-'} s/d {activeReservation.endDate || activeReservation.eventDate || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A827C]">Durasi Peminjaman</span>
              <span className="font-semibold text-[#3A6351]">{activeReservation.durationDays || 1} Hari</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A827C]">Lokasi Kegiatan</span>
              <span className="font-medium text-[#232925]">{activeReservation.location || 'Kampus Prasmul'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E8E6DF]">
              <span className="text-[#7A827C]">Status Reservasi</span>
              <span className="font-semibold text-[#232925]">
                {userPaymentStatus === 'approved_success' ? 'Lunas (Disetujui Admin)' : userPaymentStatus === 'pending_admin_approval' ? 'Menunggu Verifikasi Admin' : 'Pemilihan Barang'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link 
              to={userPaymentStatus === 'idle' && (!activeReservation.items || activeReservation.items.length === 0) ? '/marketplace' : '/reservation'}
              className="w-full sm:w-auto btn-primary text-xs flex items-center justify-center gap-2"
            >
              <span>Lanjutkan Event Ini</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Batalkan dan reset event aktif ini?')) {
                  clearActiveEvent()
                }
              }}
              className="w-full sm:w-auto text-xs font-medium text-[#9E4738] hover:bg-[#FDF3F2] px-4 py-2.5 rounded-xl border border-[#ECC8C3] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Event</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#5C645E] mb-1.5">
                Nama Kegiatan / Event *
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Contoh: Seminar Nasional CTI / Prasmul Olympics"
                className="cozy-input"
              />
            </div>

            <div className="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-2xl space-y-3">
              <div className="text-xs font-semibold text-[#232925] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#3A6351]" />
                <span>Jadwal & Durasi Hari Peminjaman</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] text-[#7A827C] mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="cozy-input !py-2 !px-3 !bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#7A827C] mb-1">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="cozy-input !py-2 !px-3 !bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#7A827C] mb-1">Total Durasi (Hari) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={durationDays}
                      onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="cozy-input !py-2 !px-3 !bg-white text-xs font-semibold text-[#3A6351]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7A827C] pointer-events-none">
                      Hari
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C645E] mb-1.5">Kategori Acara</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="cozy-input"
                >
                  <option>Expo / Bazaar</option>
                  <option>Seminar / Workshop</option>
                  <option>Lomba / Kompetisi</option>
                  <option>Pentas / Panggung</option>
                  <option>Rapat / Internal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C645E] mb-1.5">Area / Lokasi *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Auditorium / Selasar"
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C645E] mb-1.5">Estimasi Peserta</label>
                <input
                  type="number"
                  min="1"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="200"
                  className="cozy-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C645E] mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan singkat kebutuhan acara..."
                className="cozy-input"
              />
            </div>

            <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between gap-4">
              <span className="text-xs text-[#8A928C]">
                Biaya sewa barang akan dikalikan {durationDays} hari
              </span>
              <button type="submit" className="btn-primary text-xs flex items-center gap-2 cursor-pointer">
                <span>Simpan & Pilih Barang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
