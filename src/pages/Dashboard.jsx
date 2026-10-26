import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  PlusCircle, 
  ShoppingBag, 
  ShoppingCart, 
  RotateCcw, 
  TrendingUp, 
  Calendar, 
  Package, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export default function Dashboard() {
  const { currentUserName, equipments, activeReservation, userPaymentStatus, reservations } = useApp()

  // Hitung statistik global sirkular economy secara dinamis
  const totalItemsReused = equipments.reduce((acc, curr) => acc + (curr.reusedCount || 0), 12)
  const totalEventsSupported = Math.max(1, (reservations?.length || 0) + 12)
  const materialWasteAvoided = (totalItemsReused * 1.8).toFixed(1)
  const costAvoided = (totalItemsReused * 45000 / 1000000).toFixed(1)

  // Ambil daftar barang aktif dari activeReservation
  const activeItems = activeReservation?.items || []
  const hasActiveBorrow = activeReservation && activeItems.length > 0

  // Ambil nama event yang diinput user dengan fallback yang tepat
  const eventName = activeReservation?.eventName || activeReservation?.title || sessionStorage.getItem('eventloop_event_name') || 'INNOFAIR 2026 (SISO BEM)'
  const eventDate = activeReservation?.eventDate || sessionStorage.getItem('eventloop_event_date') || '18 September 2026'

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-950 text-white p-6 sm:p-10 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <Package className="w-80 h-80" />
        </div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-600/50 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-200 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>Circular Campus Hub • Prasetiya Mulya</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Selamat Datang, {currentUserName}! 👋
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            Organisasi Anda aktif berkontribusi dalam circular economy kampus. Kelola perlengkapan event berikutnya dengan mudah, transparan, dan hemat anggaran!
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Link to="/create-event" className="bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all">
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>Create Event Baru</span>
          </Link>
          <Link to="/marketplace" className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all border border-emerald-600">
            <ShoppingBag className="w-4 h-4" />
            <span>Sewa Equipment</span>
          </Link>
        </div>
      </div>

      {/* Global Circular Impact Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Global Circular Impact</h2>
          <Link to="/impact" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
            <span>Lihat Analitik Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Items Reused</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">{totalItemsReused}</div>
            <p className="text-[11px] text-gray-500 font-medium">Peralatan digunakan berulang</p>
          </div>

          <div className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Events Supported</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">{totalEventsSupported}</div>
            <p className="text-[11px] text-gray-500 font-medium">Seminar, Expo, Lomba & UKM</p>
          </div>

          <div className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Material Waste Avoided</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">{materialWasteAvoided} kg</div>
            <p className="text-[11px] text-gray-500 font-medium">Limbah material dicegah</p>
          </div>

          <div className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Cost Avoided</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">IDR</span>
            </div>
            <div className="text-3xl font-black text-gray-900">Rp{costAvoided}M</div>
            <p className="text-[11px] text-gray-500 font-medium">Hemat anggaran BEM & Kampus</p>
          </div>
        </div>
      </div>

      {/* Status Peminjaman Barang & Aksi Cepat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Kolom Kiri & Tengah: Status Peminjaman Barang */}
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Peminjaman Barang</div>
              <h3 className="text-xl font-black text-gray-900 mt-0.5">Kepanitiaan Aktif & Barang Dipinjam</h3>
            </div>
            <div>
              {hasActiveBorrow ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Sedang Dipinjam & Berjalan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  Tidak Ada Peminjaman Aktif
                </span>
              )}
            </div>
          </div>

          {hasActiveBorrow ? (
            <div className="space-y-6">
              {/* Info Detail Event & Tenggat Waktu */}
              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Event Organisasi Kampus
                    </span>
                    <h4 className="text-lg font-black text-emerald-950 mt-1">
                      {eventName}
                    </h4>
                  </div>
                  <div className="text-right sm:text-right">
                    <span className="text-[11px] text-gray-500 block font-medium">Batas Pengembalian (Deadline):</span>
                    <span className="text-sm font-extrabold text-emerald-900">
                      H+1 ({eventDate})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-200/50 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Total Jenis Item:</span>
                    <strong className="text-gray-900">{activeItems.length} Jenis Barang</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Lokasi Pengambilan:</span>
                    <strong className="text-gray-900">Warehouse Kampus Gedung C</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Status Verifikasi:</span>
                    <strong className="text-emerald-700">
                      {userPaymentStatus === 'approved_success' ? '✓ Disetujui Admin (Lunas)' : '⏳ Pending Verifikasi'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Daftar Barang yang Dipinjam (Diberi max-height & scroll agar tidak kepanjangan) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                    Rincian Barang Dipinjam ({activeItems.reduce((acc, i) => acc + (i.qty || 1), 0)} Unit Total)
                  </h5>
                  <span className="text-[11px] text-gray-400">Harus dikembalikan utuh</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-200/80 rounded-2xl bg-white pr-1">
                  {activeItems.map((item, index) => (
                    <div key={item.id || index} className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {item.qty || 1}x
                        </div>
                        <div>
                          <h6 className="font-extrabold text-gray-900 text-xs sm:text-sm">{item.name}</h6>
                          <p className="text-[11px] text-gray-500 mt-0.5">Kondisi: Baik (Circular Score: {item.circularScore || 88})</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        Dipinjam
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol ke halaman Return */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link to="/return" className="btn-primary flex-1 text-center py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Upload Bukti Pengembalian Barang</span>
                </Link>
                <Link to="/reservation" className="btn-secondary text-center py-3.5 text-xs sm:text-sm">
                  Lihat Detail Reservasi
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4 border-2 border-dashed border-gray-200 rounded-3xl p-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-base">Belum Ada Peminjaman Barang Aktif</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Organisasi Anda belum memiliki jadwal peminjaman alat untuk event terdekat. Mari sewa peralatan sirkular sekarang!
                </p>
              </div>
              <div className="pt-2">
                <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2 text-xs">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Jelajahi Marketplace Kampus</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Aksi Cepat */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-lg font-black text-gray-900">Aksi Cepat</h3>

            <div className="space-y-3">
              <Link to="/upload" className="w-full p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    +
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">Upload Barang Organisasi</div>
                    <div className="text-[11px] text-gray-500">Tambahkan aset ke circular pool</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link to="/marketplace" className="w-full p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    🔍
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">Cari Modular Booth & Alat</div>
                    <div className="text-[11px] text-gray-500">Temukan perlengkapan event</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link to="/reservation" className="w-full p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    🛒
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">Lihat Keranjang Reservasi</div>
                    <div className="text-[11px] text-gray-500">Status QRIS & tagihan aktif</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link to="/return" className="w-full p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    📸
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">Upload Bukti Pengembalian</div>
                    <div className="text-[11px] text-gray-500">Kirim foto timestamp rak gudang</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}