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
  Share2,
  Recycle,
  Calendar,
  Leaf,
  DollarSign
} from 'lucide-react'

export default function ImpactDashboard() {
  const { loadingDb, campusImpact, orgImpacts } = useApp()
  const [monthlyData, setMonthlyData] = useState([])

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge-sage mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Analitik Keberlanjutan Kampus
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dampak Sirkular EventLoop
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
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

      {/* 4 Soft KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Recycle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium">
              Perlengkapan Dipakai Ulang
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalItemsReused.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">unit</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Mencegah beli baru
            </div>
          </div>
        </div>

        <div className="card p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 border border-green-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium">
              Kegiatan Terfasilitasi
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalEventsSupported} <span className="text-xs font-normal text-slate-400">event</span>
            </div>
            <div className="text-[11px] text-green-700 mt-0.5">
              Seminar, bazaar & UKM
            </div>
          </div>
        </div>

        <div className="card p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium">
              Limbah Material Dicegah
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {wasteAvoided} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <div className="text-[11px] text-teal-700 mt-0.5">
              Setara ~{co2Avoided} kg CO₂
            </div>
          </div>
        </div>

        <div className="card p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium">
              Efisiensi Anggaran
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">
              Rp{(costAvoided / 1000000).toFixed(1)} Jt
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Hemat dana mahasiswa
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Tren Pemakaian Ulang Perlengkapan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
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
                    <span className="font-semibold text-slate-800">{m.month_label} {m.year}</span>
                    <div className="space-x-2 text-slate-500 text-[11px]">
                      <span><strong>{m.items_reused}</strong> unit</span>
                      <span>·</span>
                      <span>{m.waste_avoided_kg} kg limbah dicegah</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">Rp{(m.cost_avoided / 1000000).toFixed(1)} Jt hemat</span>
                    </div>
                  </div>

                  <div className="w-full bg-emerald-100/60 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(m.items_reused / maxReused) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
              <p>Data tren bulanan akan muncul seiring aktivitas peminjaman.</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Kontributor Sirkular
              </h3>
              <span className="text-[10px] text-slate-400">Skor</span>
            </div>

            {orgImpacts && orgImpacts.length > 0 ? (
              <div className="space-y-2">
                {orgImpacts.map((org, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      idx === 0 
                        ? 'bg-emerald-50/70 border-emerald-200' 
                        : 'bg-slate-50/70 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h5 className="font-semibold text-slate-900 text-xs">{org.org_name}</h5>
                        <span className="text-[11px] text-slate-500">{org.events_count} event · {org.items_reused} reuse</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-emerald-700 text-xs">{org.circular_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Belum ada data kontributor.
              </div>
            )}
          </div>

          <div className="card p-5 bg-emerald-50/60 border-emerald-200/70 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Award className="w-3.5 h-3.5 text-emerald-600" /> Metodologi Perhitungan
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              <strong>Limbah Dicegah:</strong> Bobot rata-rata perlengkapan dikalikan frekuensi pemakaian ulang.
            </p>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              <strong>Efisiensi Anggaran:</strong> Selisih biaya beli baru dibanding sewa harian di EventLoop.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
