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
  DollarSign,
  Printer,
  FileText,
  X,
  ShieldCheck,
  Building2,
  CheckCircle2
} from 'lucide-react'

export default function ImpactDashboard() {
  const { loadingDb, campusImpact, orgImpacts, currentUserName } = useApp()
  const [monthlyData, setMonthlyData] = useState([])
  const [showReportModal, setShowReportModal] = useState(false)

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
          onClick={() => setShowReportModal(true)}
          className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Unduh Laporan LPJ Hijau (PDF)</span>
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

      {/* MODAL SERTIFIKAT & LAPORAN LPJ HIJAU (PRINT-READY PDF) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-between pb-4 border-b border-emerald-100 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Dokumen LPJ Hijau Resmi (PDF-Ready)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Document Content */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50/20 via-white to-green-50/20 rounded-2xl border-2 border-emerald-200/80 space-y-6 text-slate-800 font-sans relative overflow-hidden">
              <div className="absolute right-4 bottom-4 w-40 h-40 opacity-5 pointer-events-none">
                <Recycle className="w-full h-full text-emerald-950" />
              </div>

              {/* Header Surat Resmi */}
              <div className="flex items-center justify-between border-b-2 border-emerald-600/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white font-black text-xl shadow-sm">
                    ♻
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 tracking-tight leading-none">
                      UNIVERSITAS PRASETIYA MULYA
                    </h3>
                    <p className="text-xs font-bold text-emerald-700 tracking-wide mt-1">
                      EVENTLOOP · INOVASI GREEN TECH & CIRCULAR CAMPUS PLATFORM
                    </p>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-mono">
                  <div>No. Dok: LPJ-EL/2026/XI/{Date.now().toString().slice(-5)}</div>
                  <div>Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Judul Dokumen */}
              <div className="text-center space-y-1">
                <h4 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight">
                  Laporan Kontribusi Sirkular & Pengurangan Emisi Karbon
                </h4>
                <p className="text-xs text-slate-500">
                  Lampiran Resmi Laporan Pertanggungjawaban (LPJ) Kegiatan Kemahasiswaan Berkelanjutan
                </p>
              </div>

              {/* Data Kepanitiaan */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/70 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Organisasi / Pemohon:</span>
                  <strong className="text-slate-900 font-bold">{currentUserName || 'BEM Universitas Prasetiya Mulya'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Kampus / Lokasi:</span>
                  <strong className="text-slate-900 font-bold">BSD City Campus, Tangerang</strong>
                </div>
              </div>

              {/* Matriks Dampak Utama */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">Unit Dipakai Ulang</span>
                  <strong className="text-base font-black text-emerald-800">{totalItemsReused.toLocaleString('id-ID')} unit</strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">Limbah Dicegah</span>
                  <strong className="text-base font-black text-emerald-800">{wasteAvoided} kg</strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">Reduksi Emisi CO₂</span>
                  <strong className="text-base font-black text-emerald-800">{co2Avoided} kg</strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">Anggaran Dihemat</span>
                  <strong className="text-base font-black text-emerald-800">Rp{costAvoided.toLocaleString('id-ID')}</strong>
                </div>
              </div>

              {/* Pernyataan Verifikasi */}
              <div className="text-xs text-slate-600 leading-relaxed space-y-2 bg-white/80 p-4 rounded-xl border border-emerald-100">
                <p>
                  Dengan ini diterangkan bahwa peminjaman perlengkapan kegiatan telah memenuhi standar sistem <strong>Circular Score (Indeks: {campusImpact?.circularScore || 87}/100)</strong>, dengan mengedepankan prinsip pakai ulang (*reuse*), modularitas komponen (*repairable*), dan peniadaan limbah padat sekali pakai (*zero-waste*).
                </p>
                <p className="text-[11px] text-slate-500">
                  Data ini tervalidasi secara komputasional melalui pelacakan transaksi dan foto serah terima gudang pada platform EventLoop Universitas Prasetiya Mulya.
                </p>
              </div>

              {/* Tanda Tangan Resmi */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-xs text-center border-t border-emerald-200/80">
                <div className="space-y-12">
                  <div className="text-[11px] text-slate-500">Penanggung Jawab Kegiatan:</div>
                  <div>
                    <strong className="block text-slate-900 border-t border-slate-300 pt-1 w-3/4 mx-auto">
                      {currentUserName || 'Ketua Panitia / Ormawa'}
                    </strong>
                    <span className="text-[10px] text-slate-400">Universitas Prasetiya Mulya</span>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="text-[11px] text-slate-500">Pengelola Green Tech & Sarpras:</div>
                  <div>
                    <strong className="block text-emerald-900 border-t border-slate-300 pt-1 w-3/4 mx-auto">
                      Atmin Choirul & Tim EventLoop
                    </strong>
                    <span className="text-[10px] text-emerald-700 font-semibold">Tervalidasi Digital ✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 print:hidden">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Dapat dilampirkan langsung pada berkas LPJ kegiatan kemahasiswaan.
              </span>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="btn-secondary !py-2 !px-4 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
