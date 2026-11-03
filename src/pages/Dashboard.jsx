import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
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
  Clock, 
  PackagePlus, 
  CheckCircle2,
  MapPin,
  ClipboardList
} from 'lucide-react'

export default function Dashboard() {
  const { 
    activeReservation, 
    cartItems = [], 
    userPaymentStatus, 
    transactions, 
    currentUserName, 
    equipments, 
    loadingDb, 
    campusImpact 
  } = useApp()
  
  const hasActiveEvent = Boolean(activeReservation?.eventName)
  const displayItems = (cartItems && cartItems.length > 0) ? cartItems : (activeReservation?.items || [])
  const hasItems = displayItems.length > 0
  const latestTxn = transactions && transactions.length > 0 ? transactions[0] : null

  // Sapaan waktu dinamis
  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam'

  // Menentukan tahap alur saat ini
  const currentStep = !hasActiveEvent 
    ? 1 
    : !hasItems 
    ? 2 
    : userPaymentStatus === 'idle' 
    ? 3 
    : 4

  // Live impact calculations dari Supabase
  const totalItemsReused = campusImpact?.itemsReused ?? 0
  const totalWasteAvoidedKg = campusImpact?.wasteAvoidedKg ?? 0
  const totalCostAvoided = campusImpact?.costAvoided ?? 0
  const avgCircularScore = campusImpact?.circularScore ?? 0

  // 3 Sumber Inventory dihitung live dari data Supabase
  const campusReady = equipments?.filter(e => {
    const o = (e.owner || '').toLowerCase()
    return o.includes('pengelola') || o.includes('kampus') || o.includes('campus') || o.includes('universitas') || o.includes('rektorat')
  }).reduce((sum, e) => sum + (e.available || 0), 0) ?? 0

  const orgReady = equipments?.filter(e => {
    const o = (e.owner || '').toLowerCase()
    return !o.includes('pengelola') && !o.includes('kampus') && !o.includes('campus') && !o.includes('universitas') && !o.includes('rektorat') && !o.includes('partner') && !o.includes('vendor')
  }).reduce((sum, e) => sum + (e.available || 0), 0) ?? 0

  const partnerReady = equipments?.filter(e => {
    const o = (e.owner || '').toLowerCase()
    return o.includes('partner') || o.includes('vendor')
  }).reduce((sum, e) => sum + (e.available || 0), 0) ?? 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner Utama */}
      <div className="bg-gradient-to-r from-green-800 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-green-950/10">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold text-green-200 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Dashboard Mahasiswa & Kepanitiaan
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {greeting}, {currentUserName || 'Prasmulyan'} 👋
            </h2>
            <p className="text-green-100/90 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Kelola kebutuhan perlengkapan event kampus Anda secara sirkular, transparan, dan hemat anggaran bersama EventLoop.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!hasActiveEvent ? (
              <Link 
                to="/create-event" 
                className="bg-white text-green-800 font-bold px-5 py-3 rounded-xl hover:bg-green-50 transition-all text-sm flex items-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-green-600" />
                <span>Mulai Buat Event</span>
              </Link>
            ) : userPaymentStatus === 'idle' ? (
              <Link 
                to={hasItems ? "/reservation" : "/marketplace"} 
                className="bg-white text-green-800 font-bold px-5 py-3 rounded-xl hover:bg-green-50 transition-all text-sm flex items-center gap-2 shadow-sm"
              >
                <ClipboardList className="w-4 h-4 text-green-600" />
                <span>{hasItems ? `Checkout Reservasi (${displayItems.length} Item)` : 'Pilih Barang Event'}</span>
              </Link>
            ) : (
              <Link 
                to="/reservation" 
                className="bg-white text-green-800 font-bold px-5 py-3 rounded-xl hover:bg-green-50 transition-all text-sm flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Lihat Tiket Reservasi</span>
              </Link>
            )}
            <Link 
              to="/marketplace" 
              className="bg-green-700/60 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl border border-green-400/30 transition-all text-sm flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>Katalog Equipment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* PANDUAN ALUR INTERAKTIF (STEPPER) */}
      <div className="card p-5 sm:p-6 bg-white border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
              Alur Peminjaman Event (1 Akun = 1 Event Aktif)
            </h3>
            <p className="text-xs text-gray-500">
              Ikuti 4 langkah mudah berikut untuk meminjam dan mengembalikan perlengkapan acara
            </p>
          </div>
          {hasActiveEvent && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              🎪 Event: {activeReservation.eventName} ({activeReservation.durationDays || 1} Hari)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link 
            to="/create-event"
            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
              currentStep === 1 
                ? 'border-green-500 bg-green-50/70 ring-2 ring-green-500/20' 
                : hasActiveEvent 
                ? 'border-emerald-200 bg-emerald-50/30' 
                : 'border-gray-200 bg-gray-50/60'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
              hasActiveEvent ? 'bg-emerald-600 text-white' : currentStep === 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {hasActiveEvent ? '✓' : '1'}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">1. Buat Event</div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {hasActiveEvent ? `${activeReservation.eventName} (${activeReservation.durationDays || 1} hari)` : 'Tentukan nama & durasi hari acara'}
              </p>
            </div>
          </Link>

          <Link 
            to="/marketplace"
            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
              currentStep === 2 
                ? 'border-green-500 bg-green-50/70 ring-2 ring-green-500/20' 
                : hasItems 
                ? 'border-emerald-200 bg-emerald-50/30' 
                : 'border-gray-200 bg-gray-50/60'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
              hasItems ? 'bg-emerald-600 text-white' : currentStep === 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {hasItems ? '✓' : '2'}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">2. Pilih Perlengkapan</div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {hasItems ? `${displayItems.length} jenis barang dipilih` : 'Cari & masukkan ke reservasi'}
              </p>
            </div>
          </Link>

          <Link 
            to="/reservation"
            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
              currentStep === 3 
                ? 'border-green-500 bg-green-50/70 ring-2 ring-green-500/20' 
                : userPaymentStatus !== 'idle' 
                ? 'border-emerald-200 bg-emerald-50/30' 
                : 'border-gray-200 bg-gray-50/60'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
              userPaymentStatus !== 'idle' ? 'bg-emerald-600 text-white' : currentStep === 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {userPaymentStatus !== 'idle' ? '✓' : '3'}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">3. Bayar & Upload Bukti</div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {userPaymentStatus === 'approved_success' ? 'Pembayaran Lunas (Di-ACC)' : userPaymentStatus === 'pending_admin_approval' ? 'Menunggu verifikasi Admin' : 'Bayar QRIS & lampirkan SS'}
              </p>
            </div>
          </Link>

          <Link 
            to="/return"
            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
              userPaymentStatus === 'approved_success'
                ? 'border-green-500 bg-green-50/70 ring-2 ring-green-500/20' 
                : 'border-gray-200 bg-gray-50/60'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
              userPaymentStatus === 'approved_success' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              4
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">4. Ambil & Kembalikan</div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Kembalikan ke lokasi asal setelah selesai
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Grid: Status Peminjaman & Aksi Cepat */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Status Event & Pinjaman Barang</h3>
                  <p className="text-xs text-gray-500">Pantau jadwal, lokasi pengambilan, dan pengembalian barang</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                userPaymentStatus === 'approved_success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : userPaymentStatus === 'pending_admin_approval'
                  ? 'bg-amber-100 text-amber-800'
                  : hasActiveEvent
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {userPaymentStatus === 'approved_success'
                  ? '✓ Lunas & Sedang Dipinjam'
                  : userPaymentStatus === 'pending_admin_approval'
                  ? '⏳ Menunggu Verifikasi Admin'
                  : hasActiveEvent
                  ? '📝 Draft Event Aktif'
                  : 'Tidak Ada Event Aktif'}
              </span>
            </div>

            {hasActiveEvent || hasItems ? (
              <div className="bg-gradient-to-r from-gray-50 to-green-50/40 border border-gray-200/80 rounded-2xl p-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-green-700 bg-green-100 px-2.5 py-0.5 rounded">
                      🎪 {activeReservation?.eventName || 'Draft Pemesanan Event'}
                    </span>
                    <h4 className="text-xl font-black text-gray-900 mt-2">
                      {userPaymentStatus === 'idle' ? 'Keranjang Perlengkapan Event' : 'Daftar Barang Direservasi'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-2">
                      <span className="flex items-center gap-1 font-semibold text-gray-800">
                        📅 Jadwal: {activeReservation?.startDate || activeReservation?.eventDate || 'Segera'} ({activeReservation?.durationDays || 1} Hari)
                      </span>
                      <span>📍 Lokasi Acara: {activeReservation?.location || 'Kampus Prasmul'}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl border sm:border-0 border-gray-200">
                    <div className="text-xs text-gray-500">Total Jenis Barang</div>
                    <div className="text-3xl font-black text-green-700">{displayItems.length} Item</div>
                    <div className="text-xs text-green-600 font-semibold mt-0.5 flex items-center sm:justify-end gap-1">
                      <Clock className="w-3.5 h-3.5" /> Durasi {activeReservation?.durationDays || 1} Hari
                    </div>
                  </div>
                </div>

                {displayItems.length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-gray-200/60">
                    <div className="text-xs font-bold text-gray-700 mb-2">Rincian Barang & Lokasi Pengambilan/Pengembalian:</div>
                    <div className="space-y-2">
                      {displayItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                          <div className="font-bold text-gray-900">
                            {item.qty}x {item.name}
                            <span className="ml-2 text-[10px] font-semibold text-gray-500">
                              ({item.listingType === 'sale' ? 'Beli Permanen' : 'Sewa Harian'})
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Asal: {item.lastLocation || item.initialLocation || 'Warehouse Kampus Gedung C'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-200/60 text-xs text-gray-500">
                    Anda telah membuat event, namun belum memilih perlengkapan di Marketplace.
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  {!hasItems ? (
                    <Link to="/marketplace" className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-1.5">
                      <Package className="w-4 h-4" /> Pilih Perlengkapan di Marketplace
                    </Link>
                  ) : userPaymentStatus === 'idle' ? (
                    <Link to="/reservation" className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4" /> Lanjut Checkout & Bayar QRIS
                    </Link>
                  ) : (
                    <>
                      <Link to="/reservation" className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5 bg-white">
                        <ClipboardList className="w-4 h-4 text-emerald-600" /> Lihat Detail Tiket Reservasi
                      </Link>
                      {userPaymentStatus === 'approved_success' && (
                        <Link to="/return" className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4" /> Kembalikan Barang (Return)
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">Belum Ada Event atau Pinjaman Aktif</h4>
                <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                  Mulai dengan membuat event organisasi Anda untuk menentukan tanggal dan durasi peminjaman peralatan.
                </p>
                <Link to="/create-event" className="btn-primary text-xs !py-2.5 !px-5 inline-flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Buat Event & Pinjam Barang</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Aksi Cepat & Status Inventory */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 text-base mb-4">Menu Pintasan</h3>
            <div className="space-y-2.5">
              <Link 
                to="/upload-equipment" 
                className="flex items-center justify-between p-3 rounded-xl bg-green-50/80 hover:bg-green-100/80 border border-green-200 transition-all text-xs font-bold text-green-900 group"
              >
                <span className="flex items-center gap-2.5">
                  <PackagePlus className="w-4 h-4 text-green-700" />
                  + Sewakan / Jual Barang Organisasi
                </span>
                <ArrowRight className="w-4 h-4 text-green-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link 
                to="/my-equipment" 
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 transition-all text-xs font-semibold text-gray-700 group"
              >
                <span className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Cek Barang Saya & Bukti Payout Admin
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </Link>
              <Link 
                to="/reservation" 
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 transition-all text-xs font-semibold text-gray-700 group"
              >
                <span className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Lihat Reservasi & Bukti Bayar
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </Link>
              <Link 
                to="/return" 
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 transition-all text-xs font-semibold text-gray-700 group"
              >
                <span className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-teal-600" />
                  Pengembalian Barang (Return)
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
              </Link>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-white to-gray-50">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Status Ketersediaan Inventory</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="flex items-center gap-2 text-gray-600">
                  <span>🏫</span> Campus Inventory
                </span>
                <span className="font-bold text-gray-900">
                  {loadingDb ? '...' : `${campusReady} unit tersedia`}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="flex items-center gap-2 text-gray-600">
                  <span>🎓</span> Org Inventory (Sharing)
                </span>
                <span className="font-bold text-green-700">
                  {loadingDb ? '...' : `${orgReady} unit aktif`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-600">
                  <span>🤝</span> Partner Vendor
                </span>
                <span className="font-bold text-blue-700">
                  {loadingDb ? '...' : `${partnerReady} unit siap`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Circular Impact (Live Supabase) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Dampak Sirkular Kampus</h3>
            <p className="text-xs text-gray-500">
              Akumulasi metrik keberlanjutan live dari pemakaian bersama
            </p>
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
              {loadingDb ? '...' : totalItemsReused.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-green-700 font-medium mt-1">
              Total sirkulasi penggunaan berulang
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Cost Avoided</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">
              {loadingDb ? '...' : (totalCostAvoided >= 1000000 ? `Rp${(totalCostAvoided / 1000000).toFixed(1)}M` : `Rp${totalCostAvoided.toLocaleString('id-ID')}`)}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <span>💰 Hemat</span> dibanding beli unit baru
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-teal-500">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Material Waste Avoided</span>
              <Leaf className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-3xl font-black text-gray-900">
              {loadingDb ? '...' : `${totalWasteAvoidedKg} kg`}
            </div>
            <div className="text-xs text-teal-700 font-medium mt-1">
              Estimasi sampah material dicegah
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-green-600 bg-gradient-to-br from-green-50/50 to-white">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Circularity Score</span>
              <span className="text-xs bg-green-200 text-green-800 font-bold px-1.5 py-0.5 rounded">
                {avgCircularScore >= 80 ? 'Tier 1' : 'Tier 2'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-green-700">
                {loadingDb ? '...' : avgCircularScore}
              </span>
              <span className="text-sm font-bold text-gray-400">/ 100</span>
            </div>
            <div className="text-xs text-green-800 font-semibold mt-1">
              🌿 Rata-rata Skor Sirkularitas
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
