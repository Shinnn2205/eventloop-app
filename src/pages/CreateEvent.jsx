import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  Package
} from 'lucide-react'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { setActiveReservation } = useApp()
  
  const [eventName, setEventName] = useState('INNOFAIR 2026')
  const [eventDate, setEventDate] = useState('2026-09-18')
  const [location, setLocation] = useState('Hall Auditorium Kampus Utama')
  const [participants, setParticipants] = useState('450')
  const [eventType, setEventType] = useState('Expo / Bazaar')

  const handleSaveAndProceedToMarketplace = (e) => {
    e.preventDefault()

    // 1. Simpan detail event ke state global
    setActiveReservation({
      eventName,
      eventDate,
      location,
      participants,
      eventType,
      items: [] 
    })

    // 2. Arahkan user ke marketplace
    navigate('/marketplace')
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in-up">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
          <Calendar className="w-3.5 h-3.5" /> Wizard Event Kampus
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Buat Event Baru
        </h2>
        <p className="text-sm text-gray-500">
          Masukkan detail kegiatan organisasi Anda. Setelah ini, Anda dapat langsung memilih dan menambahkan perlengkapan dari Marketplace.
        </p>
      </div>

      <div className="card p-6 md:p-8 space-y-6">
        <form onSubmit={handleSaveAndProceedToMarketplace} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nama Kegiatan / Event
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="cth. Seminar Nasional CTI 2026"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tanggal Pelaksanaan
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 font-medium cursor-pointer"
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
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-gray-900"
              >
                <option>Expo / Bazaar</option>
                <option>Seminar / Workshop</option>
                <option>Lomba / Kompetisi</option>
                <option>Music / Panggung Hiburan</option>
                <option>Rapat Kerja / Dies Natalis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Lokasi Kegiatan Kampus
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Auditorium / Lapangan / Kelas"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 font-medium"
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
                  required
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="200"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Catatan Kebutuhan Khusus
            </label>
            <textarea
              rows={2}
              placeholder="cth. Butuh perlengkapan panggung dan booth pameran..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900"
            />
          </div>

          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              className="btn-primary text-sm !py-3 !px-6 flex items-center gap-2 shadow-green-600/20 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Simpan Event & Pilih Barang di Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}