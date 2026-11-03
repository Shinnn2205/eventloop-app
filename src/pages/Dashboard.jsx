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
    currentUserName, 
    equipments, 
    loadingDb, 
    campusImpact 
  } = useApp()
  
  const hasActiveEvent = Boolean(activeReservation?.eventName)
  const displayItems = (cartItems && cartItems.length > 0) ? cartItems : (activeReservation?.items || [])
  const hasItems = displayItems.length > 0

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam'

  const currentStep = !hasActiveEvent ? 1 : !hasItems ? 2 : userPaymentStatus === 'idle' ? 3 : 4

  const totalItemsReused = campusImpact?.itemsReused ?? 0
  const totalWasteAvoidedKg = campusImpact?.wasteAvoidedKg ?? 0
  const totalCostAvoided = campusImpact?.costAvoided ?? 0
  const avgCircularScore = campusImpact?.circularScore ?? 0

  const steps = [
    { num: 1, title: 'Buat Event', desc: hasActiveEvent ? activeReservation.eventName : 'Atur jadwal & durasi hari', path: '/create-event', done: hasActiveEvent },
    { num: 2, title: 'Pilih Barang', desc: hasItems ? `${displayItems.length} barang dipilih` : 'Cari di katalog', path: '/marketplace', done: hasItems },
    { num: 3, title: 'Reservasi & Bayar', desc: userPaymentStatus === 'approved_success' ? 'Pembayaran Lunas' : userPaymentStatus === 'pending_admin_approval' ? 'Menunggu verifikasi' : 'QRIS & bukti transfer', path: '/reservation', done: userPaymentStatus !== 'idle' },
    { num: 4, title: 'Pengembalian', desc: 'Kembalikan ke lokasi asal', path: '/return', done: false }
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Cozy & Tenang */}
      <div className="bg-[#EAEFE9] border border-[#D8E2DC] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[#3A6351] tracking-wide">
            Beranda Kepanitiaan
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#232925]">
            {greeting}, {currentUserName || 'Prasmulyan'}
          </h2>
          <p className="text-[#5C645E] text-sm max-w-xl leading-relaxed">
            Pinjam, gunakan, dan kembalikan perlengkapan acara kampus dengan tenang dan terorganisir.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!hasActiveEvent ? (
            <Link to="/create-event" className="btn-primary text-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>Buat Event Baru</span>
            </Link>
          ) : userPaymentStatus === 'idle' ? (
            <Link to={hasItems ? "/reservation" : "/marketplace"} className="btn-primary text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span>{hasItems ? `Lanjut Reservasi (${displayItems.length})` : 'Pilih Perlengkapan'}</span>
            </Link>
          ) : (
            <Link to="/reservation" className="btn-primary text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Lihat Tiket Reservasi</span>
            </Link>
          )}
          <Link to="/marketplace" className="btn-secondary text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-[#5C645E]" />
            <span>Lihat Katalog</span>
          </Link>
        </div>
      </div>

      {/* Stepper Alur Minimalis */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-[#5C645E]">
            Tahapan Peminjaman Event (1 Akun = 1 Event Aktif)
          </span>
          {hasActiveEvent && (
            <span className="badge-sage">
              {activeReservation.eventName} · {activeReservation.durationDays || 1} Hari
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s) => {
            const isActive = currentStep === s.num
            return (
              <Link
                key={s.num}
                to={s.path}
                className={`p-3.5 rounded-xl border transition-colors flex items-center gap-3 ${
                  isActive
                    ? 'bg-[#F3F7F4] border-[#3A6351]/40'
                    : s.done
                    ? 'bg-[#FAF9F5] border-[#E2E0D8]'
                    : 'bg-[#FAF9F5]/60 border-[#ECEAE2]'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  s.done
                    ? 'bg-[#3A6351] text-white'
                    : isActive
                    ? 'bg-[#D8E5DD] text-[#264738]'
                    : 'bg-[#ECEAE2] text-[#7A827C]'
                }`}>
                  {s.done ? '✓' : s.num}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#232925] truncate">{s.title}</div>
                  <div className="text-[11px] text-[#7A827C] truncate">{s.desc}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Konten Utama: Status Event & Pintasan */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6] mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#EAF0EC] text-[#3A6351] rounded-xl flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#232925] text-base">Event & Pinjaman Aktif</h3>
                    <p className="text-xs text-[#7A827C]">Rincian kegiatan dan lokasi barang yang dipinjam</p>
                  </div>
                </div>
                <span className={
                  userPaymentStatus === 'approved_success' ? 'badge-sage' :
                  userPaymentStatus === 'pending_admin_approval' ? 'badge-warm' :
                  'badge-stone'
                }>
                  {userPaymentStatus === 'approved_success' ? 'Lunas & Aktif' :
                   userPaymentStatus === 'pending_admin_approval' ? 'Menunggu Verifikasi' :
                   hasActiveEvent ? 'Draft Event' : 'Belum Ada Event'}
                </span>
              </div>

              {hasActiveEvent || hasItems ? (
                <div className="space-y-5">
                  <div className="p-5 bg-[#FAF9F5] rounded-2xl border border-[#E8E6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-[#7A827C]">Nama Kegiatan</div>
                      <h4 className="text-lg font-bold text-[#232925] mt-0.5">
                        {activeReservation?.eventName || 'Draft Pemesanan Event'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C645E] mt-2">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#3A6351]" />
                          Durasi: <strong>{activeReservation?.durationDays || 1} Hari</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#3A6351]" />
                          Lokasi Acara: {activeReservation?.location || 'Kampus Prasmul'}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-xs text-[#7A827C]">Perlengkapan</div>
                      <div className="text-2xl font-bold text-[#3A6351]">{displayItems.length} Jenis</div>
                    </div>
                  </div>

                  {displayItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[#5C645E]">Daftar Barang & Lokasi Pengambilan/Pengembalian:</div>
                      <div className="divide-y divide-[#EFECE6] border border-[#E8E6DF] rounded-xl bg-white overflow-hidden">
                        {displayItems.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="font-medium text-[#232925]">
                              {item.qty} unit · {item.name}
                            </div>
                            <div className="text-[#5C645E] flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#3A6351]" />
                              <span>{item.lastLocation || item.initialLocation || 'Warehouse Kampus Gedung C'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#FAF9F5] rounded-2xl border border-dashed border-[#DFDDD4]">
                  <Package className="w-9 h-9 text-[#B8B4A8] mx-auto mb-2.5" />
                  <h4 className="text-sm font-semibold text-[#232925]">Belum ada event aktif</h4>
                  <p className="text-xs text-[#7A827C] mt-1 mb-4 max-w-xs mx-auto">
                    Buat event terlebih dahulu untuk mengatur tanggal kegiatan dan mulai meminjam peralatan.
                  </p>
                  <Link to="/create-event" className="btn-primary text-xs inline-flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Buat Event Sekarang</span>
                  </Link>
                </div>
              )}
            </div>

            {(hasActiveEvent || hasItems) && (
              <div className="pt-5 mt-5 border-t border-[#EFECE6] flex flex-wrap gap-3">
                {!hasItems ? (
                  <Link to="/marketplace" className="btn-primary text-xs flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Pilih Barang di Katalog
                  </Link>
                ) : userPaymentStatus === 'idle' ? (
                  <Link to="/reservation" className="btn-primary text-xs flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Lanjut ke Pembayaran
                  </Link>
                ) : (
                  <>
                    <Link to="/reservation" className="btn-secondary text-xs flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" /> Detail Reservasi
                    </Link>
                    {userPaymentStatus === 'approved_success' && (
                      <Link to="/return" className="btn-primary text-xs flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> Kembalikan Barang
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Menu Pintasan */}
        <div className="card p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-semibold text-[#232925] text-base mb-4">Menu Pintasan</h3>
            <div className="space-y-2.5">
              <Link 
                to="/upload-equipment" 
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F3F7F4] hover:bg-[#E6EFE9] transition-colors text-xs font-medium text-[#264738]"
              >
                <span className="flex items-center gap-2.5">
                  <PackagePlus className="w-4 h-4 text-[#3A6351]" />
                  Pinjamkan / Jual Barang Organisasi
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#3A6351]" />
              </Link>
              <Link 
                to="/my-equipment" 
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EFECE6] border border-[#E8E6DF] transition-colors text-xs font-medium text-[#3D4540]"
              >
                <span className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-[#3A6351]" />
                  Barang Saya & Bukti Payout Admin
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8A928C]" />
              </Link>
              <Link 
                to="/reservation" 
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EFECE6] border border-[#E8E6DF] transition-colors text-xs font-medium text-[#3D4540]"
              >
                <span className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3A6351]" />
                  Tiket Reservasi & Bukti Transfer
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8A928C]" />
              </Link>
              <Link 
                to="/return" 
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EFECE6] border border-[#E8E6DF] transition-colors text-xs font-medium text-[#3D4540]"
              >
                <span className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-[#3A6351]" />
                  Form Pengembalian Barang
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8A928C]" />
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] text-xs space-y-1.5">
            <div className="font-semibold text-[#232925]">Katalog Tersedia</div>
            <p className="text-[#7A827C] leading-relaxed">
              Terdapat <strong>{equipments?.reduce((s, e) => s + (e.available || 0), 0) || 0} unit</strong> peralatan siap pakai di dalam ekosistem kampus.
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Dampak Sirkular (Lembut & Bersih) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#5C645E]">Ringkasan Dampak Sirkular Kampus</h3>
          <Link to="/impact" className="text-xs font-medium text-[#3A6351] hover:underline flex items-center gap-1">
            Lihat detail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="text-xs text-[#7A827C] mb-1">Peralatan Dipakai Ulang</div>
            <div className="text-2xl font-bold text-[#232925]">
              {loadingDb ? '...' : `${totalItemsReused.toLocaleString('id-ID')} unit`}
            </div>
          </div>

          <div className="card p-5">
            <div className="text-xs text-[#7A827C] mb-1">Penghematan Biaya</div>
            <div className="text-2xl font-bold text-[#3A6351]">
              {loadingDb ? '...' : (totalCostAvoided >= 1000000 ? `Rp${(totalCostAvoided / 1000000).toFixed(1)} Jt` : `Rp${totalCostAvoided.toLocaleString('id-ID')}`)}
            </div>
          </div>

          <div className="card p-5">
            <div className="text-xs text-[#7A827C] mb-1">Limbah Dicegah</div>
            <div className="text-2xl font-bold text-[#232925]">
              {loadingDb ? '...' : `${totalWasteAvoidedKg} kg`}
            </div>
          </div>

          <div className="card p-5">
            <div className="text-xs text-[#7A827C] mb-1">Skor Sirkularitas</div>
            <div className="text-2xl font-bold text-[#3A6351]">
              {loadingDb ? '...' : `${avgCircularScore} / 100`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
