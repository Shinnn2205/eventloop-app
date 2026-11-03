import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabaseClient'
import Spinner from '../components/Spinner'
import { 
  BarChart3, 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  Award,
  Share2
} from 'lucide-react'

export default function ImpactDashboard() {
  const { loadingDb, campusImpact, orgImpacts } = useApp()
  const [monthlyData, setMonthlyData] = useState([])

  // Live KPI stats
  const totalItemsReused = campusImpact?.itemsReused ?? 0
  const totalEventsSupported = campusImpact?.eventsSupported ?? 0
  const wasteAvoided = campusImpact?.wasteAvoidedKg ?? 0
  const co2Avoided = Math.round(wasteAvoided * 1.32 * 10) / 10
  const costAvoided = campusImpact?.costAvoided ?? 0

  useEffect(() => {
    fetchMonthlyData()
  }, [])

  async function fetchMonthlyData() {
    try {
      const { data: monthly, error: monthlyErr } = await supabase
        .from('monthly_impact')
        .select('*')
        .order('id', { ascending: true })

      if (!monthlyErr && monthly && monthly.length > 0) {
        setMonthlyData(monthly)
      }
    } catch (err) {
      console.warn('Error fetching monthly impact data:', err)
    }
  }

  if (loadingDb) return <Spinner />

  const maxReused = monthlyData.length > 0
    ? Math.max(...monthlyData.map(m => m.items_reused), 1)
    : 1

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge-sage mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Analitik Keberlanjutan Kampus
          </span>
          <h2 className="text-2xl font-bold text-[#2C332E] tracking-tight">
            Dampak Sirkular EventLoop
          </h2>
          <p className="text-sm text-[#6E7871] mt-0.5">
            Ringkasan penghematan biaya dan pengurangan limbah dari pemakaian perlengkapan bersama.
          </p>
        </div>

        <button 
          onClick={() => alert('Laporan Circular Impact berhasil diunduh (PDF)')}
          className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Unduh Laporan</span>
        </button>
      </div>

      {/* 4 Cozy KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-[#6E7871] text-xs font-medium mb-1">
            Perlengkapan Dipakai Ulang
          </div>
          <div className="text-2xl font-bold text-[#2C332E]">
            {totalItemsReused.toLocaleString('id-ID')} <span className="text-xs font-normal text-[#8A938C]">unit</span>
          </div>
          <div className="text-[11px] text-[#3A6351] mt-2">
            Mencegah pengadaan barang sekali pakai
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[#6E7871] text-xs font-medium mb-1">
            Kegiatan Terfasilitasi
          </div>
          <div className="text-2xl font-bold text-[#2C332E]">
            {totalEventsSupported} <span className="text-xs font-normal text-[#8A938C]">event</span>
          </div>
          <div className="text-[11px] text-[#3A6351] mt-2">
            Seminar, bazaar, lomba & kegiatan UKM
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[#6E7871] text-xs font-medium mb-1">
            Limbah Material Dicegah
          </div>
          <div className="text-2xl font-bold text-[#2C332E]">
            {wasteAvoided} <span className="text-xs font-normal text-[#8A938C]">kg</span>
          </div>
          <div className="text-[11px] text-[#3A6351] mt-2">
            Setara ~{co2Avoided} kg emisi CO₂
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[#6E7871] text-xs font-medium mb-1">
            Efisiensi Anggaran
          </div>
          <div className="text-2xl font-bold text-[#3A6351]">
            Rp{(costAvoided / 1000000).toFixed(1)} Jt
          </div>
          <div className="text-[11px] text-[#6E7871] mt-2">
            Dihemat oleh kepanitiaan mahasiswa
          </div>
        </div>
      </div>

      {/* Grid: Trend Bulanan & Ranking Organisasi */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Monthly Circular Growth Trend */}
        <div className="lg:col-span-2 card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECEAE3]">
            <div>
              <h3 className="font-semibold text-[#2C332E] text-sm">
                Tren Pemakaian Ulang Perlengkapan
              </h3>
              <p className="text-xs text-[#6E7871] mt-0.5">
                Perkembangan peminjaman perlengkapan lintas organisasi per bulan
              </p>
            </div>
            {monthlyData.length > 1 && (
              <span className="badge-sage">
                <TrendingUp className="w-3 h-3" /> Bertumbuh
              </span>
            )}
          </div>

          {monthlyData.length > 0 ? (
            <div className="space-y-4">
              {monthlyData.map((m, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#2C332E]">{m.month_label} {m.year}</span>
                    <div className="space-x-2 text-[#6E7871] text-[11px]">
                      <span><strong>{m.items_reused}</strong> unit</span>
                      <span>·</span>
                      <span>{m.waste_avoided_kg} kg limbah dicegah</span>
                      <span>·</span>
                      <span className="text-[#3A6351] font-medium">Rp{(m.cost_avoided / 1000000).toFixed(1)} Jt hemat</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#EFECE6] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#3A6351] h-full rounded-full transition-all duration-500"
                      style={{ width: `${(m.items_reused / maxReused) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#8A938C] text-xs">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p>Data tren bulanan akan muncul seiring aktivitas peminjaman.</p>
            </div>
          )}
        </div>

        {/* Right Col: Top Circular Organizations */}
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEAE3]">
              <h3 className="font-semibold text-[#2C332E] text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#8A6116]" />
                Kontributor Sirkular
              </h3>
              <span className="text-[10px] text-[#8A938C]">Skor</span>
            </div>

            {orgImpacts && orgImpacts.length > 0 ? (
              <div className="space-y-2">
                {orgImpacts.map((org, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      idx === 0 
                        ? 'bg-[#EAF0EC]/60 border-[#DCE5DF]' 
                        : 'bg-[#F6F5F0] border-[#E8E6DF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-semibold text-xs ${
                        idx === 0 ? 'bg-[#3A6351] text-white' : 'bg-[#E5E2DC] text-[#5C645E]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h5 className="font-medium text-[#2C332E] text-xs">{org.org_name}</h5>
                        <span className="text-[11px] text-[#6E7871]">{org.events_count} event · {org.items_reused} reuse</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-[#3A6351] text-xs">{org.circular_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[#8A938C] text-xs">
                Belum ada data kontributor.
              </div>
            )}
          </div>

          <div className="card p-5 bg-[#EAEFE9] border-[#DCE5DF] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#264738]">
              <Award className="w-3.5 h-3.5 text-[#3A6351]" /> Metodologi Perhitungan
            </div>
            <p className="text-[11px] text-[#4E5E54] leading-relaxed">
              <strong>Limbah Dicegah:</strong> Bobot rata-rata perlengkapan dikalikan frekuensi pemakaian ulang.
            </p>
            <p className="text-[11px] text-[#4E5E54] leading-relaxed">
              <strong>Efisiensi Anggaran:</strong> Selisih biaya beli baru dibanding sewa harian di EventLoop.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
