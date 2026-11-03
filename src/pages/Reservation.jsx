import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  ClipboardList, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  QrCode, 
  Recycle, 
  Clock,
  Calendar,
  AlertCircle,
  Upload,
  Eye,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  MapPin
} from 'lucide-react'

// Fungsi Kompresi Gambar untuk Bukti Transfer
const compressImage = (file, callback) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 600
      const scaleSize = MAX_WIDTH / img.width
      canvas.width = MAX_WIDTH
      canvas.height = img.height * scaleSize
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      callback(canvas.toDataURL('image/jpeg', 0.65))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

export default function Reservation() {
  const { 
    userPaymentStatus, 
    submitUserQrisPayment, 
    cartItems, 
    updateCartQty, 
    removeFromCart, 
    currentUserName,
    activeReservation,
    setActiveReservation,
    clearActiveEvent 
  } = useApp()

  const [showQrisModal, setShowQrisModal] = useState(false)
  const [paymentProofPhoto, setPaymentProofPhoto] = useState(null)
  const [proofTime, setProofTime] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Durasi peminjaman dari event aktif (default 1 hari)
  const durationDays = Math.max(1, parseInt(activeReservation?.durationDays) || 1)

  const handleUpdateDuration = (newDays) => {
    const validDays = Math.max(1, parseInt(newDays) || 1)
    setActiveReservation(prev => ({
      ...(prev || {}),
      eventName: prev?.eventName || 'Event Organisasi Kampus',
      durationDays: validDays
    }))
  }

  const handleUpdateEventName = (newName) => {
    setActiveReservation(prev => ({
      ...(prev || {}),
      eventName: newName,
      durationDays: prev?.durationDays || 1
    }))
  }

  // Perhitungan Subtotal: Barang sewa dikalikan jumlah hari event
  const getItemPrice = (item) => (item.listingType === 'sale' ? (item.salePrice || item.price) : item.price)
  const getItemSubtotal = (item) => {
    const basePrice = getItemPrice(item)
    if (item.listingType === 'sale') {
      return basePrice * item.qty
    }
    return basePrice * item.qty * durationDays
  }

  // DAFTAR ITEM DITAMPILKAN:
  // Jika keranjang masih terisi, tampilkan cartItems.
  // Jika sudah bayar / pending approval, tampilkan activeReservation.items!
  const displayItems = (cartItems && cartItems.length > 0) 
    ? cartItems 
    : (activeReservation?.items || [])

  const isPaidOrPending = userPaymentStatus !== 'idle'

  const cartTotal = displayItems.reduce((sum, item) => sum + getItemSubtotal(item), 0)
  const totalCost = (activeReservation?.totalAmount && isPaidOrPending) ? activeReservation.totalAmount : cartTotal
  
  const totalQtyCount = displayItems.reduce((sum, item) => sum + (item.qty || 1), 0)
  const estimatedAvoidedCost = totalCost * 4.8 
  const estimatedWasteAvoided = (totalQtyCount * 1.8).toFixed(1)

  // Booking detail
  const hasBooking = Boolean(
    activeReservation?.eventName || 
    activeReservation?.eventDate || 
    displayItems.length > 0 || 
    userPaymentStatus !== 'idle'
  )

  const eventTitle = activeReservation?.eventName || (displayItems.length > 0 ? 'Event Organisasi Kampus' : null)
  const eventDateFormatted = activeReservation?.eventDate 
    ? new Date(activeReservation.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const pickupLocation = activeReservation?.location 
    ? `Area Kampus (${activeReservation.location})` 
    : 'Warehouse Kampus Gedung C (Lantai Dasar)'

  const handleProofChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      compressImage(file, (base64) => {
        setPaymentProofPhoto(base64)
        setProofTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB')
      })
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
            <ClipboardList className="w-3.5 h-3.5" /> Reservasi & Tiket Event
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {isPaidOrPending ? 'Tiket & Status Reservasi Event' : 'Checkout Reservasi Perlengkapan'}
          </h2>
          {hasBooking ? (
            <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Kepanitiaan: <strong className="text-gray-900">{eventTitle || 'Event Kampus'}</strong> ({currentUserName || 'Prasmulyan'})</span>
              {eventDateFormatted && <span>• Tanggal: {eventDateFormatted}</span>}
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
                Durasi Sewa: {durationDays} Hari
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Kelola item perlengkapan yang ingin dipinjam atau dibeli untuk kegiatan organisasi Anda.
            </p>
          )}
        </div>

        {userPaymentStatus === 'idle' && (
          <Link to="/marketplace" className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5 self-start sm:self-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Barang Lain</span>
          </Link>
        )}
      </div>

      {/* DIGITAL BOOKING PASS / STATUS BANNER SETELAH PEMBAYARAN */}
      {isPaidOrPending && (
        <div className={`p-6 rounded-3xl border-2 transition-all ${
          userPaymentStatus === 'approved_success'
            ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-emerald-300 shadow-sm'
            : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md ${
                userPaymentStatus === 'approved_success' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'
              }`}>
                {userPaymentStatus === 'approved_success' ? '🎟️' : '⏳'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    userPaymentStatus === 'approved_success'
                      ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-200 text-amber-950 border border-amber-300'
                  }`}>
                    {userPaymentStatus === 'approved_success' ? 'TIKET PENGAMBILAN AKTIF (LUNAS)' : 'PEMBAYARAN TERKIRIM • MENUNGGU VERIFIKASI ADMIN'}
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-600 bg-white/70 px-2 py-0.5 rounded border">
                    ID: {activeReservation?.txnId || '#TXN-QRIS-2026'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900">
                  {activeReservation?.eventName || 'Event Kampus Prasmul'}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Penyelenggara: <strong>{currentUserName || 'Mahasiswa'}</strong> • Durasi: <strong>{durationDays} Hari</strong> • Total: <strong className="text-emerald-700">Rp{totalCost.toLocaleString('id-ID')}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {activeReservation?.paymentProofPhoto && (
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="btn-secondary text-xs !py-2 !px-3.5 flex items-center gap-1.5 bg-white shadow-2xs border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bukti Transfer Saya</span>
                </button>
              )}
              {userPaymentStatus === 'approved_success' && (
                <Link
                  to="/return"
                  className="btn-primary text-xs !py-2 !px-3.5 flex items-center gap-1.5 font-bold shadow-md shadow-emerald-600/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Form Pengembalian Barang</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PENGATURAN CEPAT NAMA EVENT & DURASI HARI SEWA (SAAT MASIH DI KERANJANG) */}
      {!isPaidOrPending && displayItems.length > 0 && (
        <div className="card p-5 bg-gradient-to-r from-green-50/70 via-emerald-50/40 to-white border-green-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-extrabold text-green-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-green-700" />
                Nama Kegiatan & Durasi Peminjaman Event (Sistem Harian)
              </label>
              <input
                type="text"
                value={activeReservation?.eventName || ''}
                onChange={(e) => handleUpdateEventName(e.target.value)}
                placeholder="Ketik nama event Anda (cth. Seminar Nasional / Expo Prasmul)..."
                className="w-full max-w-md px-3.5 py-2 bg-white border border-green-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>

            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Jumlah Hari Sewa:</span>
                <div className="inline-flex items-center bg-white border-2 border-green-500 rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleUpdateDuration(durationDays - 1)}
                    className="px-3 py-1.5 font-black text-green-800 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-black text-gray-900 text-xs bg-green-50/50">
                    {durationDays} Hari
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateDuration(durationDays + 1)}
                    className="px-3 py-1.5 font-black text-green-800 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
              <Link to="/create-event" className="text-[11px] font-bold text-green-700 hover:underline self-end pb-2">
                Detail Lengkap →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Reservation Items Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {isPaidOrPending ? 'Daftar Perlengkapan Direservasi' : 'Daftar Peralatan Dipesan'}
                </h3>
                {isPaidOrPending && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Item tetap tersimpan dan siap diambil serta dikembalikan di lokasi masing-masing.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold border border-blue-200">
                  Akumulasi: {durationDays} Hari
                </span>
                <span className="text-xs text-gray-500 font-semibold">{displayItems.length} jenis item</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4">Equipment & Lokasi Asal</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Subtotal ({durationDays} Hari)</th>
                    <th className="p-4 text-center">Status</th>
                    {!isPaidOrPending && <th className="p-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayItems.map((item) => {
                    const isRental = item.listingType !== 'sale'
                    const unitPrice = getItemPrice(item)
                    const subtotal = getItemSubtotal(item)

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                          <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                              item.listingType === 'sale' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.listingType === 'sale' ? '🏷️ Beli Permanen' : '🔄 Sewa Harian'}
                            </span>
                            <span>Rp{unitPrice.toLocaleString('id-ID')} / {isRental ? 'hari' : 'unit'}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 font-medium">
                            <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>Lokasi Asal: <strong className="text-gray-700">{item.lastLocation || item.initialLocation || 'Warehouse Kampus Gedung C'}</strong></span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-[11px]">
                            {item.circularScore || 85}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {isPaidOrPending ? (
                            <span className="px-3 py-1 font-bold text-gray-900 bg-gray-100 rounded-lg text-xs">
                              {item.qty} Unit
                            </span>
                          ) : (
                            <div className="inline-flex items-center border border-gray-200 rounded-lg bg-white">
                              <button 
                                onClick={() => updateCartQty(item.id, -1)}
                                className="px-2 py-1 hover:bg-gray-100 rounded-l-lg font-bold text-gray-600 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-1 font-bold text-gray-900">{item.qty}</span>
                              <button 
                                onClick={() => updateCartQty(item.id, 1)}
                                className="px-2 py-1 hover:bg-gray-100 rounded-r-lg font-bold text-gray-600 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-black text-gray-900 text-sm">
                            Rp{subtotal.toLocaleString('id-ID')}
                          </div>
                          {isRental && (
                            <div className="text-[10px] text-gray-400">
                              ({item.qty} unit × {durationDays} hari)
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {userPaymentStatus === 'approved_success' ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-green-600" /> Siap Diambil
                            </span>
                          ) : userPaymentStatus === 'pending_admin_approval' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              <Clock className="w-3 h-3 text-amber-600" /> Menunggu ACC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" /> Di Keranjang
                            </span>
                          )}
                        </td>
                        {!isPaidOrPending && (
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {displayItems.length === 0 && (
              <div className="p-12 text-center text-gray-400 text-xs space-y-3">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-gray-700 font-bold text-sm">Belum ada perlengkapan yang dimasukkan ke reservasi</p>
                <p className="text-gray-400 max-w-sm mx-auto">Silakan buat event terlebih dahulu atau pilih perlengkapan yang tersedia di Marketplace.</p>
                <div className="pt-2 flex justify-center gap-3">
                  <Link to="/create-event" className="btn-secondary text-xs !py-2 !px-4">
                    + Buat Event
                  </Link>
                  <Link to="/marketplace" className="btn-primary text-xs !py-2 !px-4">
                    + Buka Marketplace
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Jadwal & Lokasi Pengambilan */}
          {hasBooking && displayItems.length > 0 && (
            <div className="card p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-blue-200/60 animate-fade-in-up">
              <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                Panduan Pengambilan & Pengembalian Barang
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Setiap barang wajib diambil dan dikembalikan di <strong>Lokasi Asal</strong> yang tertera pada tabel di atas
                {eventDateFormatted ? (
                  <> mulai <strong>H-1 ({eventDateFormatted}, 09:00 - 16:00 WIB)</strong></>
                ) : (
                  <> pada <strong>jam operasional kampus (09:00 - 16:00 WIB)</strong></>
                )} dengan menunjukkan tiket reservasi ini.
              </p>
            </div>
          )}
        </div>

        {/* Right Summary Card */}
        <div className="space-y-6">
          <div className="card p-6 space-y-6">
            <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Ringkasan Biaya</span>
              <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-bold border border-green-200">
                {durationDays} Hari Sewa
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total Unit Dipesan</span>
                <span className="font-bold text-gray-900">{totalQtyCount} unit</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Durasi Peminjaman Event</span>
                <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{durationDays} Hari</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Akumulasi Hari</span>
                <span className="font-bold text-gray-900">Rp{totalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Biaya Layanan Escrow (5%)</span>
                <span className="text-gray-500">Termasuk</span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-sm">Total Pembayaran</span>
                <span className="text-2xl font-black text-green-700">
                  Rp{totalCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Circular Impact Badge */}
            {totalQtyCount > 0 && (
              <div className="bg-green-50 p-4 rounded-2xl border border-green-200/70 space-y-2 text-xs">
                <div className="font-bold text-green-900 flex items-center gap-1.5">
                  <Recycle className="w-4 h-4 text-green-600" />
                  Dampak Sirkular Transaksi Ini:
                </div>
                <div className="flex justify-between text-green-800">
                  <span>Biaya Beli Baru Dihindari:</span>
                  <span className="font-bold">~Rp{Math.round(estimatedAvoidedCost).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-green-800">
                  <span>Potensi Limbah Dicegah:</span>
                  <span className="font-bold">~{estimatedWasteAvoided} kg</span>
                </div>
              </div>
            )}

            {/* Action Checkout & QRIS Payment */}
            <div className="space-y-3 pt-2">
              {!isPaidOrPending && cartItems.length > 0 ? (
                <button
                  onClick={() => setShowQrisModal(true)}
                  className="w-full btn-primary text-sm !py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Bayar via QRIS (Rp{totalCost.toLocaleString('id-ID')})</span>
                </button>
              ) : userPaymentStatus === 'pending_admin_approval' ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-center space-y-3 animate-fade-in-up">
                  <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md animate-pulse">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="font-extrabold text-amber-950 text-sm">
                    MENUNGGU VERIFIKASI ADMIN ⏳
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bukti transfer Anda sebesar <strong>Rp{totalCost.toLocaleString('id-ID')}</strong> ({durationDays} hari sewa) telah diterima sistem. Status akan berubah menjadi <strong>LUNAS</strong> segera setelah Admin memverifikasi bukti transfer Anda.
                  </p>
                  
                  {activeReservation?.paymentProofPhoto && (
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3.5 py-2 rounded-xl border border-amber-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Bukti Transfer Saya</span>
                    </button>
                  )}

                  <div className="text-[10px] bg-white p-3 rounded-xl border border-amber-200 text-left font-mono space-y-1">
                    <div>ID: <strong>{activeReservation?.txnId || '#TXN-QRIS-2026'}</strong></div>
                    <div>Status: <strong className="text-amber-700">Pending Admin Verification</strong></div>
                    <div>Escrow: <strong>BCA 0829102830 a.n EventLoop</strong></div>
                  </div>
                </div>
              ) : userPaymentStatus === 'approved_success' ? (
                <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 text-center space-y-3 animate-fade-in-up">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="font-extrabold text-emerald-950 text-sm">
                    PEMBAYARAN DI-ACC & LUNAS! ✓
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Admin telah mengkonfirmasi penerimaan dana sebesar <strong>Rp{totalCost.toLocaleString('id-ID')}</strong> ({durationDays} hari sewa). Silakan ambil barang di lokasi asalnya masing-masing!
                  </p>
                  <div className="text-[10px] bg-white p-3 rounded-xl border border-emerald-200 text-left font-mono space-y-1">
                    <div>Ref Transaksi: <strong>{activeReservation?.txnId || '#TXN-QRIS-2026'}</strong></div>
                    <div>Status: <strong className="text-green-700">Approved by Admin EventLoop ✓</strong></div>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      to="/return"
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-xl shadow-sm transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Buka Form Pengembalian Barang</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-400 cursor-not-allowed font-bold rounded-xl text-sm !py-3.5 flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pilih Barang Terlebih Dahulu</span>
                </button>
              )}

              <Link
                to="/dashboard"
                className="w-full btn-secondary text-xs !py-2.5 flex items-center justify-center gap-2"
              >
                <span>Kembali ke Dashboard</span>
              </Link>

              {/* Reset / Cancel Event Button */}
              {hasBooking && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin membatalkan/reset reservasi event ini?')) {
                      clearActiveEvent()
                    }
                  }}
                  className="w-full text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Batalkan / Reset Reservasi Event Ini
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QRIS PAYMENT MODAL DENGAN UPLOAD BUKTI TRANSFER */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-black text-red-600 tracking-tighter text-base">QRIS</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Pembayaran Standar Nasional</span>
              </div>
              <button 
                onClick={() => setShowQrisModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-xs text-gray-500">Total Akumulasi Pembayaran ({durationDays} Hari Sewa)</div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">
                Rp{totalCost.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Event: <strong className="text-gray-700">{eventTitle || 'Event Kampus'}</strong>
              </div>
            </div>

            {/* Simulated QR Code */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 inline-block mx-auto">
              <div className="w-40 h-40 bg-white rounded-xl flex flex-col items-center justify-center p-2 border border-gray-100 shadow-inner">
                <QrCode className="w-32 h-32 text-gray-900" />
                <span className="text-[9px] font-mono text-gray-400 tracking-widest mt-1">NMID: ID1029384756</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-2 font-medium">
                Scan via BCA Mobile, Livin', GoPay, OVO, atau Dana
              </div>
            </div>

            {/* WAJIB UPLOAD BUKTI TRANSFER */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-left space-y-2">
              <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                <span>Upload Screenshot Bukti Transfer (Wajib) *</span>
              </label>
              <p className="text-[11px] text-gray-500 leading-tight">
                Lampirkan screenshot bukti transfer berhasil agar Admin dapat segera memverifikasi pesanan Anda.
              </p>

              <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-emerald-500 transition-colors bg-white">
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={handleProofChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {paymentProofPhoto ? (
                  <div className="space-y-1.5">
                    <img src={paymentProofPhoto} alt="Bukti Transfer" className="w-full h-32 object-contain rounded-lg mx-auto border" />
                    <span className="text-[10px] text-emerald-700 font-bold block bg-emerald-100/60 py-1 px-2 rounded">
                      ✓ Bukti Terunggah ({proofTime})
                    </span>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center">
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs font-bold text-gray-700">Klik untuk Pilih Screenshot Bukti Bayar</span>
                    <span className="text-[10px] text-gray-400">Mendukung JPG, PNG, Screenshot</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                disabled={!paymentProofPhoto}
                onClick={() => {
                  submitUserQrisPayment({
                    eventName: activeReservation?.eventName || 'Event Organisasi Kampus',
                    totalAmount: totalCost,
                    buyerOrg: currentUserName || 'Prasmul Student Org',
                    itemNames: displayItems.map(i => `${i.name} (${i.qty}x)`).join(', '),
                    durationDays,
                    paymentProofPhoto
                  })
                  setShowQrisModal(false)
                }}
                className={`w-full text-xs !py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  paymentProofPhoto 
                    ? 'btn-primary shadow-lg shadow-green-600/20 cursor-pointer' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kirim Bukti Pembayaran ke Admin</span>
              </button>

              {!paymentProofPhoto && (
                <p className="text-[11px] text-amber-600 font-medium">
                  ⚠️ Silakan upload screenshot bukti transfer sebelum mengirim konfirmasi.
                </p>
              )}

              <button
                type="button"
                onClick={() => setShowQrisModal(false)}
                className="w-full text-xs font-semibold text-gray-500 hover:text-gray-800 py-1.5 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIHAT BUKTI TRANSFER MAHASISWA */}
      {showPreviewModal && activeReservation?.paymentProofPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Screenshot Bukti Transfer Saya
              </h4>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-96 flex items-center justify-center">
              <img 
                src={activeReservation.paymentProofPhoto} 
                alt="Bukti Transfer Mahasiswa" 
                className="w-full h-auto object-contain max-h-96"
              />
            </div>

            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>Nominal: <strong className="text-gray-800">Rp{totalCost.toLocaleString('id-ID')}</strong> ({durationDays} Hari Sewa)</div>
              <div>ID Transaksi: <span className="font-mono">{activeReservation?.txnId || '#TXN-QRIS-2026'}</span></div>
            </div>

            <button
              onClick={() => setShowPreviewModal(false)}
              className="w-full btn-primary !py-2.5 text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
