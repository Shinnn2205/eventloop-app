import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Plus, 
  Recycle,
  Layers,
  HelpCircle
} from 'lucide-react'

export default function CreateEvent() {
  const navigate = useNavigate()
  const [eventName, setEventName] = useState('INNOFAIR 2026')
  const [eventDate, setEventDate] = useState('2026-09-18')
  const [location, setLocation] = useState('Hall Auditorium Kampus Utama')
  const [participants, setParticipants] = useState('450')
  const [eventType, setEventType] = useState('Expo / Bazaar')
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recommendedList, setRecommendedList] = useState([])

  const getDynamicRecommendations = (type, partCount) => {
    const count = parseInt(partCount) || 200
    const cupSets = Math.max(1, Math.ceil(count / 50))

    if (type === 'Music / Panggung Hiburan') {
      return [
        { name: 'Modular Stage Platform (4x3m)', qty: 1, price: 100000, score: 94, note: 'Platform panggung utama musisi & MC' },
        { name: 'Sound System Portable 200W (Mic + Speaker)', qty: 1, price: 75000, score: 75, note: 'Audio panggung & wireless mic' },
        { name: 'LED Lighting Kit (Stage Lights)', qty: 2, price: 35000, score: 78, note: 'Pencahayaan panggung malam' },
        { name: 'Extension Cable Set (10m+5m)', qty: 3, price: 10000, score: 90, note: 'Distribusi daya audio & lighting' },
        { name: 'Backdrop Frame System (3x2.5m)', qty: 1, price: 45000, score: 90, note: 'Backdrop panggung belakang' },
      ]
    } else if (type === 'Seminar / Workshop') {
      return [
        { name: 'Standing Banner Frame', qty: 2, price: 15000, score: 95, note: 'Petunjuk arah & welcoming banner' },
        { name: 'Registration Desk Professional', qty: 1, price: 25000, score: 86, note: 'Meja registrasi & absensi peserta' },
        { name: 'Sound System Portable', qty: 1, price: 75000, score: 75, note: 'Speaker & mic narasumber' },
        { name: 'Extension Cable Set', qty: 2, price: 10000, score: 90, note: 'Colokan laptop narasumber & panitia' },
        { name: 'Reusable Cup Set (50pcs)', qty: cupSets, price: 30000, score: 85, note: `Coffee break zero waste (${cupSets * 50} gelas)` },
      ]
    } else if (type === 'Lomba / Kompetisi') {
      return [
        { name: 'Folding Table Set (Meja Juri & Peserta)', qty: 4, price: 20000, score: 88, note: 'Meja juri & briefing' },
        { name: 'Standing Banner Frame', qty: 2, price: 15000, score: 95, note: 'Bracket bagan lomba & jadwal' },
        { name: 'Sound System Portable', qty: 1, price: 75000, score: 75, note: 'Pengumuman pemenang & MC' },
        { name: 'Backdrop Frame System', qty: 1, price: 45000, score: 90, note: 'Podium penyerahan piala' },
      ]
    } else if (type === 'Rapat Kerja / Dies Natalis') {
      return [
        { name: 'Backdrop Frame System', qty: 1, price: 45000, score: 90, note: 'Latar sidang & foto bersama' },
        { name: 'Folding Table Set', qty: 6, price: 20000, score: 88, note: 'Meja bundar/U-shape rapat pleno' },
        { name: 'Registration Desk', qty: 1, price: 25000, score: 86, note: 'Meja presensi sidang' },
        { name: 'Reusable Cup Set (50pcs)', qty: cupSets, price: 30000, score: 85, note: 'Minum rapat ramah lingkungan' },
      ]
    } else {
      // Default: Expo / Bazaar
      return [
        { name: 'Modular Exhibition Booth', qty: 3, price: 50000, score: 92, note: 'Booth tenant pameran & bazaar' },
        { name: 'Standing Banner Frame', qty: 3, price: 15000, score: 95, note: 'Signage denah booth & rundown' },
        { name: 'Folding Table Set', qty: 4, price: 20000, score: 88, note: 'Meja kasir & display produk' },
        { name: 'Extension Cable Set', qty: 3, price: 10000, score: 90, note: 'Daya listrik tiap stan bazaar' },
        { name: 'Reusable Cup Set (50pcs)', qty: cupSets, price: 30000, score: 85, note: `Minum bazaar zero plastic (${cupSets * 50} gelas)` },
      ]
    }
  }

  const handleGenerate = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const recs = getDynamicRecommendations(eventType, participants)
      setRecommendedList(recs)
      setLoading(false)
      setGenerated(true)
    }, 600)
  }

  const handleSaveAndProceed = () => {
    navigate('/reservation')
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
          <Calendar className="w-3.5 h-3.5" /> Wizard Event Kampus
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Buat Event Baru & Susun Kebutuhan
        </h2>
        <p className="text-sm text-gray-500">
          Masukkan detail kegiatan, sistem EventLoop akan merekomendasikan perlengkapan ramah lingkungan dan menyusun daftar reservasi otomatis.
        </p>
      </div>

      <div className="card p-6 md:p-8 space-y-6">
        <form onSubmit={handleGenerate} className="space-y-5">
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
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
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
                  required
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="200"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
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
              placeholder="cth. Butuh 2 booth modular pameran, standing banner registrasi, sound system, dan gelas reusable untuk coffee break..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm !py-3 !px-6 flex items-center justify-center gap-2 shadow-green-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Menghitung Rekomendasi Sirkular...' : 'Generate Equipment List Otomatis'}</span>
            </button>
          </div>
        </form>

        {/* Generated Equipment List Section */}
        {generated && (
          <div className="mt-8 pt-8 border-t border-gray-200 space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                  Rekomendasi Cerdas Sistem
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  Paket Perlengkapan Sirkular untuk {eventName}
                </h3>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Recycle className="w-3.5 h-3.5" /> High Circular Match
              </span>
            </div>

            <div className="space-y-3">
              {recommendedList.map((eq, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs hover:bg-green-50/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div>
                      <h5 className="font-bold text-sm text-gray-900">{eq.name}</h5>
                      <span className="text-gray-500">{eq.note} • <strong className="text-gray-800">Qty: {eq.qty} unit</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-sm">
                      Rp{(eq.price * eq.qty).toLocaleString('id-ID')}
                    </div>
                    <span className="text-green-700 font-semibold text-[11px]">Score: {eq.score}/100</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 p-4 rounded-2xl border border-green-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs text-green-800 font-semibold">Estimasi Total Biaya Sewa Mikro:</div>
                <div className="text-2xl font-black text-green-900">
                  Rp{recommendedList.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-green-700 mt-0.5">
                  ✨ Anda menghemat ~Rp{(recommendedList.reduce((sum, item) => sum + (item.price * item.qty), 0) * 4.5).toLocaleString('id-ID')} dibanding pembelian baru sekali pakai!
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAndProceed}
                className="btn-primary text-xs !py-3 !px-6 flex items-center gap-2 whitespace-nowrap"
              >
                <span>Lanjut ke Formulir Reservasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
