import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabaseClient'
import { 
  Recycle, 
  Calendar, 
  Package, 
  ArrowRight, 
  DollarSign, 
  Leaf, 
  Sparkles, 
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  Clock,
  PackagePlus,
  Tent
} from 'lucide-react'

export default function Dashboard() {
  const { activeReservation, transactions, currentUserName } = useApp()
  
  const hasActiveRentals = activeReservation?.items?.length > 0
  const latestTxn = transactions && transactions.length > 0 ? transactions[0] : null

  // State untuk fetch data Supabase
  const [impactData, setImpactData] = useState({
    itemsReused: 0,
    wasteAvoided: 0,
    eventsSupported: 0,
    costAvoided: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGlobalImpact = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('global_impact')
          .select('*')
          .eq('id', 1)
          .single()
        
        if (!error && data) {
          setImpactData({
            itemsReused: data.total_items_reused,
            wasteAvoided: data.total_waste_avoided,
            eventsSupported: data.total_events,
            costAvoided: data.total_cost_avoided
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGlobalImpact()
  }, [])

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="bg-emerald-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-green-950/10">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold text-green-200 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Dashboard Organisasi
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Good afternoon, {currentUserName || 'Prasmulyan'} 👋
            </h2>
            <p className="text-green-100/90 text-sm sm:text-base mt-2 max-w-xl">
              Organisasi Anda aktif berkontribusi dalam circular economy kampus. Kelola perlengkapan event berikutnya dengan mudah dan hemat!
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/create-event" className="bg-white text-green-800 font-bold px-5 py-3 rounded-xl hover:bg-green-50 transition-all text-sm flex items-center gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4 text-green-600" />
              <span>Create Event Baru</span>
            </Link>
            <Link to="/marketplace" className="bg-emerald-700/60 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl border border-emerald-400/30 transition-all text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Sewa Equipment</span>
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Global Circular Impact</h3>
            <p className="text-xs text-gray-500">Akumulasi penghematan & pengurangan sampah seluruh kampus</p>
          </div>
          <Link to="/impact" className="text-xs font-bold text-green-700 hover:text-green-800 flex items-center gap-1">
            Lihat Analitik Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Items Reused</span>
              <Recycle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">
              {loading ? '...' : impactData.itemsReused.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-green-700 font-medium mt-1 flex items-center gap-1">
              Peralatan digunakan berulang
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Events Supported</span>
              <Tent className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">
              {loading ? '...' : impactData.eventsSupported}
            </div>
            <div className="text-xs text-blue-700 font-medium mt-1 flex items-center gap-1">
              Seminar, Expo, Lomba & UKM
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-teal-500">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Material Waste Avoided</span>
              <Leaf className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">
              {loading ? '...' : `${impactData.wasteAvoided} kg`}
            </div>
            <div className="text-xs text-teal-700 font-medium mt-1">
              Limbah material dicegah
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Cost Avoided</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">
              {loading ? '...' : `Rp${(impactData.costAvoided / 1000000).toFixed(1)}M`}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">
              💰 Hemat anggaran BEM & Kampus
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Status Peminjaman Barang</h3>
                  <p className="text-xs text-gray-500">Kepanitiaan aktif yang sedang berjalan</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${hasActiveRentals ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                {hasActiveRentals ? 'Sedang Berjalan' : 'Tidak Ada Event Aktif'}
              </span>
            </div>

            {hasActiveRentals ? (
              <div className="bg-gradient-to-r from-gray-50 to-green-50/40 border border-gray-200/80 rounded-2xl p-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded">
                      🎪 {activeReservation?.eventName || 'Event Aktif'}
                    </span>
                    <h4 className="text-xl font-black text-gray-900 mt-2">Daftar Pinjaman Saat Ini</h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-2">
                      <span className="flex items-center gap-1 font-semibold text-gray-800">
                        📅 Mulai: {latestTxn?.paidAt || 'Baru saja'}
                      </span>
                      <span>📍 Diambil di Warehouse</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl border sm:border-0 border-gray-200">
                    <div className="text-xs text-gray-500">Total Barang Dipinjam</div>
                    <div className="text-3xl font-black text-green-700">{activeReservation.items.length} Items</div>
                    <div className="text-xs text-green-600 font-semibold mt-0.5 flex items-center sm:justify-end gap-1">
                      <Clock className="w-3.5 h-3.5" /> Sedang Digunakan
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200/60">
                  <div className="text-xs font-bold text-gray-700 mb-2">Rincian Barang:</div>
                  <div className="space-y-2">
                    {activeReservation.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-gray-100">
                        <span className="font-semibold text-gray-800">{item.qty}x {item.name}</span>
                        <span className="text-gray-400">Harus dikembalikan setelah event</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/return" className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5 w-full justify-center">
                    <RotateCcw className="w-4 h-4" /> Upload Bukti Foto Pengembalian
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">Tidak ada pinjaman aktif</h4>
                <p className="text-xs text-gray-500 mb-4">Organisasi Anda belum meminjam barang apapun saat ini.</p>
                <Link to="/create-event" className="btn-secondary text-xs !py-2.5 !px-4">
                  + Buat Event & Pinjam Barang
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 text-base mb-4">Aksi Cepat</h3>
            <div className="space-y-2.5">
              <Link to="/upload-equipment" className="flex items-center justify-between p-3 rounded-xl bg-green-50/80 hover:bg-green-100/80 border border-green-200 transition-all text-xs font-bold text-green-900 group">
                <span className="flex items-center gap-2.5"><PackagePlus className="w-4 h-4 text-green-700" /> + Upload Barang Organisasi</span>
                <ArrowRight className="w-4 h-4 text-green-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/marketplace" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 transition-all text-xs font-semibold text-gray-700 group">
                <span className="flex items-center gap-2.5"><Package className="w-4 h-4 text-green-600" /> Cari Modular Exhibition Booth</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
              </Link>
              <Link to="/reservation" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 transition-all text-xs font-semibold text-gray-700 group">
                <span className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Lihat Keranjang Reservasi</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </Link>
              <Link to="/return" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 transition-all text-xs font-semibold text-gray-700 group">
                <span className="flex items-center gap-2.5"><RotateCcw className="w-4 h-4 text-teal-600" /> Upload Bukti Foto Pengembalian</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}