import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  Sparkles,
  FileText
} from 'lucide-react'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { setActiveReservation } = useApp()
  
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [participants, setParticipants] = useState('')
  const [eventType, setEventType] = useState('Expo / Bazaar')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Simpan event ke state activeReservation
    setActiveReservation({
      eventName: eventName.trim() || 'Event Kampus',
      eventDate,
      location: location.trim() || 'Kampus',
      participants: participants || '100',
      eventType,
      notes: notes.trim(),
      items: []
    })

    // Langsung arahkan ke Marketplace untuk memilih perlengkapan asli dari database
    navigate('/marketplace')
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
          <Calendar className="w-3.5 h-3.5" /> Formulir Pembuatan Event Kampus
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Buat Event Baru
        </h2>
        <p className="text-sm text-gray-500">
          Isi detail event organisasi Anda. Setelah disimpan, Anda dapat langsung memilih peralatan sirkular yang tersedia di Marketplace.
        </p>
      </div>

      <div className="card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
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
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
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
              * Data event akan tersimpan sebagai target reservasi aktif Anda.
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
    </div>
  )
}
