import { impactData } from '../data/mockData'
import { 
  BarChart3, 
  Recycle, 
  DollarSign, 
  Leaf, 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  Award,
  Calendar,
  Share2
} from 'lucide-react'

export default function ImpactDashboard() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Komponen 3 — Circular Impact Dashboard
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            EventLoop Campus Impact Analytics
          </h2>
          <p className="text-sm text-gray-500">
            Platform pengukur dampak sirkularitas kegiatan kampus secara transparan dan terverifikasi.
          </p>
        </div>

        <button 
          onClick={() => alert('Laporan Circular Impact berhasil diunduh (PDF)')}
          className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-2 self-start md:self-auto"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Export Laporan Keberlanjutan</span>
        </button>
      </div>

      {/* 4 Big KPI Cards (Sesuai Konsep Green Tech) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50/20">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Items Reused</span>
            <span className="text-xl">♻️</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-gray-900">
            {impactData.totalItemsReused.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-green-700 font-semibold mt-2">
            Peralatan event dipakai berulang
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Mencegah pembelian {impactData.totalItemsReused} barang baru
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Events Supported</span>
            <span className="text-xl">🎪</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-gray-900">
            {impactData.totalEventsSupported}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-2">
            Kegiatan organisasi terlaksana
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Seminar, bazaar, lomba, expo & UKM
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-teal-500 bg-gradient-to-br from-white to-teal-50/20">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Material Waste Avoided</span>
            <span className="text-xl">🌱</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-gray-900">
            {impactData.wasteAvoided} kg
          </div>
          <div className="text-xs text-teal-700 font-semibold mt-2">
            Limbah dicegah masuk TPA
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Setara ~{impactData.co2Avoided} kg CO₂ emisi dicegah
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/20">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Purchasing Cost Avoided</span>
            <span className="text-xl">💰</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-gray-900">
            Rp{(impactData.costAvoided / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-blue-700 font-semibold mt-2">
            Total dana kampus dihemat
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Rata-rata hemat 78% per kepanitiaan
          </div>
        </div>
      </div>

      {/* Grid: Trend Bulanan & Ranking Organisasi */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Monthly Circular Growth Trend */}
        <div className="lg:col-span-2 card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Tren Pengurangan Limbah & Peminjaman (6 Bulan Terakhir)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Peningkatan adopsi circular equipment di kalangan mahasiswa
              </p>
            </div>
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +164% Semester ini
            </span>
          </div>

          {/* Monthly Bars Visualization */}
          <div className="space-y-4 pt-2">
            {impactData.monthlyData.map((m, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-700">{m.month} 2026</span>
                  <div className="space-x-3 text-gray-500">
                    <span><strong>{m.reused}</strong> items reused</span>
                    <span>•</span>
                    <span className="text-teal-700 font-semibold">🌱 {m.waste} kg waste avoided</span>
                    <span>•</span>
                    <span className="text-green-700 font-bold">Rp{(m.cost / 1000000).toFixed(1)}M saved</span>
                  </div>
                </div>

                {/* Dual bar representation */}
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-green-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(m.reused / 350) * 100}%` }}
                    title={`${m.reused} items reused`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <span>Volume Perlengkapan Sirkular Tersewa</span>
            </div>
            <div className="font-semibold text-gray-900">
              Target Target Semester Depan: 2,000 items reused / semester
            </div>
          </div>
        </div>

        {/* Right Col: Top Circular Organizations (Leaderboard) */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Top Circular Organizations
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Score Ranking</span>
            </div>

            <p className="text-xs text-gray-500">
              Organisasi dengan skor circularity tertinggi mendapatkan prioritas alokasi barang & subsidi sewa.
            </p>

            <div className="space-y-2.5">
              {impactData.topOrganizations.map((org, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    idx === 0 
                      ? 'bg-amber-50/50 border-amber-200' 
                      : 'bg-gray-50/50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-gray-900 text-xs">{org.name}</h5>
                      <span className="text-[11px] text-gray-500">{org.events} events • {org.reused} reuse</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-green-700 text-sm">{org.score}</span>
                    <span className="text-[10px] text-gray-400 block">/ 100</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <span className="text-xs text-green-700 font-semibold">
                Organisasimu (SISO) berada di peringkat #2! 🥈
              </span>
            </div>
          </div>

          {/* Calculation Methodology Note for Presentation */}
          <div className="card p-5 bg-gradient-to-br from-green-900 to-emerald-950 text-white space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-green-300 uppercase tracking-wider">
              <Award className="w-4 h-4" /> Metodologi Kalkulasi Dampak
            </div>
            <p className="text-[11px] text-green-100/90 leading-relaxed">
              <strong>Waste Avoided:</strong> Berdasarkan bobot rata-rata material sekali pakai (banner PVC 0.8kg, booth kayu 12kg, spanduk 0.5kg) dikali frekuensi pemakaian ulang.
            </p>
            <p className="text-[11px] text-green-100/90 leading-relaxed">
              <strong>Cost Avoided:</strong> Selisih harga pengadaan unit baru vs micro-rental fee EventLoop.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
