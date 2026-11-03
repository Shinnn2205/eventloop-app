import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Recycle, 
  Calendar, 
  Package, 
  ArrowRight, 
  DollarSign, 
  Leaf, 
  RotateCcw, 
  PlusCircle, 
  PackagePlus, 
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Award
} from 'lucide-react'

export default function Dashboard() {
  const { 
    activeReservation, 
    cartItems = [], 
    userPaymentStatus, 
    currentUserName, 
    equipments, 
    loadingDb, 
    campusImpact 
  } = useApp()
  
  const hasActiveEvent = Boolean(activeReservation?.eventName)
  const displayItems = (cartItems && cartItems.length > 0) ? cartItems : (activeReservation?.items || [])
  const hasItems = displayItems.length > 0

  // Sapaan waktu
  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam'

  // Tahap alur saat ini
  const currentStep = !hasActiveEvent 
    ? 1 
    : !hasItems 
    ? 2 
    : userPaymentStatus === 'idle' 
    ? 3 
    : 4

  // Live impact calculations
  const totalItemsReused = campusImpact?.itemsReused ?? 0
  const totalWasteAvoidedKg = campusImpact?.wasteAvoidedKg ?? 0
  const totalCostAvoided = campusImpact?.costAvoided ?? 0
  const avgCircularScore = campusImpact?.circularScore ?? 0

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

  const steps = [
    { num: 1, title: 'Buat Event', desc: 'Tentukan jadwal & durasi', link: '/create-event' },
    { num: 2, title: 'Pilih Equipment', desc: 'Cari di Marketplace', link: '/marketplace' },
    { num: 3, title: 'Reservasi & QRIS', desc: 'Upload bukti bayar', link: '/reservation' },
    { num: 4, title: 'Kembalikan', desc: 'Pulangkan ke lokasi asal', link: '/return' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Soft, Low-Contrast Renewable Green Hero Card + Integrated Stepper */}
      <div className="bg-gradient-to-br from-emerald-50/95 via-green-50/75 to-teal-50/80 border border-emerald-200/70 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-72 h-72 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-white/80 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Circular Campus Dashboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight pt-1">
              {greeting}, <span className="text-emerald-800">{currentUserName || 'Prasmulyan'}</span> 🌿
            </h2>
            <p className="text-slate-600 text-sm max-w-xl leading-relaxed">
              Kelola peminjaman perlengkapan acara kampus secara sirkular, hemat anggaran, dan ramah lingkungan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!hasActiveEvent ? (
              <Link 
                to="/create-event" 
                className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Mulai Buat Event</span>
              </Link>
            ) : userPaymentStatus === 'idle' ? (
              <Link 
                to={hasItems ? "/reservation" : "/marketplace"} 
                className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                <span>{hasItems ? `Lanjut Pembayaran (${displayItems.length})` : 'Pilih Equipment'}</span>
              </Link>
            ) : (
              <Link 
                to="/reservation" 
                className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lihat Detail Reservasi</span>
              </Link>
            )}
            <Link 
              to="/marketplace" 
              className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Buka Katalog</span>
            </Link>
          </div>
        </div>

        {/* Integrated Soft Stepper */}
        <div className="relative z-10 mt-6 pt-5 border-t border-emerald-200/60">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {steps.map((s) => {
              const isDone = currentStep > s.num || (s.num === 4 && userPaymentStatus === 'approved' && !hasItems)
              const isCurrent = currentStep === s.num
              return (
                <Link
                  key={s.num}
                  to={s.link}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-white border-emerald-300 text-slate-900 shadow-2xs'
                      : isDone
                      ? 'bg-white/70 border-emerald-200/70 text-slate-700 hover:bg-white'
                      : 'bg-white/45 border-emerald-100/80 text-slate-500 hover:bg-white/80'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isCurrent
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100/60 text-emerald-700/70'
                  }`}>
                    {isDone ? '✓' : s.num}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{s.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{s.desc}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4 Soft Sustainability Metric Cards (No Harsh Left Borders) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Recycle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium block">Barang Dipakai Ulang</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              {loadingDb ? '...' : totalItemsReused.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-emerald-700 block mt-0.5">Sirkulasi aktif</span>
          </div>
        </div>

        <div className="card p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 border border-green-100">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium block">Penghematan Biaya</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              {loadingDb ? '...' : (totalCostAvoided >= 1000000 ? `Rp${(totalCostAvoided / 1000000).toFixed(1)} Jt` : `Rp${totalCostAvoided.toLocaleString('id-ID')}`)}
            </div>
            <span className="text-[11px] text-green-700 block mt-0.5">Efisiensi anggaran</span>
          </div>
        </div>

        <div className="card p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium block">Limbah Dicegah</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              {loadingDb ? '...' : `${totalWasteAvoidedKg} kg`}
            </div>
            <span className="text-[11px] text-teal-700 block mt-0.5">Bebas sekali pakai</span>
          </div>
        </div>

        <div className="card p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium block">Skor Sirkularitas</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">
              {loadingDb ? '...' : avgCircularScore}<span className="text-xs font-normal text-slate-400"> / 100</span>
            </div>
            <span className="text-[11px] text-emerald-700 block mt-0.5">Indeks keberlanjutan</span>
          </div>
        </div>
      </div>

      {/* Main Two Columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Event Status */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-emerald-100/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Kegiatan & Peminjaman Aktif
                  </h3>
                  <p className="text-[11px] text-slate-400">Status event dan perlengkapan yang sedang Anda pinjam</p>
                </div>
              </div>
              {hasActiveEvent && (
                <span className={
                  userPaymentStatus === 'approved' 
                    ? 'badge-sage' 
                    : userPaymentStatus === 'pending_admin_approval'
                    ? 'badge-warm'
                    : 'badge-stone'
                }>
                  {userPaymentStatus === 'approved' 
                    ? 'Pembayaran Terverifikasi' 
                    : userPaymentStatus === 'pending_admin_approval'
                    ? 'Menunggu Verifikasi Admin'
                    : 'Belum Dibayar'}
                </span>
              )}
            </div>

            {hasActiveEvent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/45 border border-emerald-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-emerald-700 font-medium">
                      {activeReservation.org} · {activeReservation.type || 'Kegiatan Kampus'}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {activeReservation.eventName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1.5">
                      <span>📅 {activeReservation.eventDate}</span>
                      <span>·</span>
                      <span className="font-semibold text-emerald-700">⏱️ Durasi {activeReservation.durationDays || 1} Hari</span>
                      {activeReservation.location && (
                        <>
                          <span>·</span>
                          <span>📍 {activeReservation.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {hasItems ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600">
                      Perlengkapan Dipesan ({displayItems.length} jenis)
                    </div>
                    <div className="divide-y divide-emerald-100/60 border border-emerald-100 rounded-2xl bg-white overflow-hidden">
                      {displayItems.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-emerald-50/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-lg">{item.image || '📦'}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 truncate">{item.name}</div>
                              <div className="text-[11px] text-slate-500 truncate">
                                Lokasi asal: {item.lastLocation || item.initialLocation || 'Warehouse Kampus'}
                              </div>
                            </div>
                          </div>
                          <span className="badge-sage flex-shrink-0">
                            {item.qty} unit
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-emerald-50/25 border border-dashed border-emerald-200 text-center space-y-2.5">
                    <p className="text-xs text-slate-600">
                      Belum ada perlengkapan yang dipilih untuk kegiatan ini.
                    </p>
                    <Link to="/marketplace" className="btn-primary text-xs !py-2 !px-4 inline-flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Pilih Barang di Marketplace</span>
                    </Link>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <Link to="/reservation" className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>{userPaymentStatus === 'idle' ? 'Lanjutkan Pembayaran' : 'Lihat Detail Reservasi'}</span>
                  </Link>
                  {userPaymentStatus === 'approved' && (
                    <Link to="/return" className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan Barang</span>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-emerald-50/25 rounded-2xl border border-dashed border-emerald-200/80 space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Belum Ada Kegiatan Aktif</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Daftarkan kegiatan Anda terlebih dahulu untuk menentukan durasi hari peminjaman perlengkapan.
                  </p>
                </div>
                <Link to="/create-event" className="btn-primary text-xs !py-2.5 !px-5 inline-flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Event Baru</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Links & Inventory Summary */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Akses Cepat</h3>
            <div className="space-y-2">
              <Link 
                to="/upload-equipment" 
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-100 transition-colors text-xs font-semibold text-emerald-900"
              >
                <span className="flex items-center gap-2.5">
                  <PackagePlus className="w-4 h-4 text-emerald-600" />
                  Upload Barang Organisasi
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              </Link>
              <Link 
                to="/my-equipment" 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-emerald-50/40 border border-slate-100 transition-colors text-xs font-medium text-slate-700"
              >
                <span className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Cek Payout & Bukti Transfer
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link 
                to="/return" 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-emerald-50/40 border border-slate-100 transition-colors text-xs font-medium text-slate-700"
              >
                <span className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-emerald-600" />
                  Pengembalian ke Lokasi Asal
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Ketersediaan Inventaris</h3>
              <Link to="/impact" className="text-[11px] font-semibold text-emerald-700 hover:underline">
                Detail →
              </Link>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-emerald-50">
                <span className="text-slate-500">Inventaris Kampus</span>
                <span className="font-semibold text-slate-800">{loadingDb ? '...' : `${campusReady} unit`}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-emerald-50">
                <span className="text-slate-500">Sharing Organisasi</span>
                <span className="font-semibold text-emerald-700">{loadingDb ? '...' : `${orgReady} unit`}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Mitra Eksternal</span>
                <span className="font-semibold text-slate-800">{loadingDb ? '...' : `${partnerReady} unit`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
