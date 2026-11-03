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
  Image as ImageIcon
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
    activeReservation 
  } = useApp()

  const [showQrisModal, setShowQrisModal] = useState(false)
  const [paymentProofPhoto, setPaymentProofPhoto] = useState(null)
  const [proofTime, setProofTime] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Durasi peminjaman dari event aktif (default 1 hari)
  const durationDays = Math.max(1, parseInt(activeReservation?.durationDays) || 1)

  // Perhitungan Subtotal: Barang sewa dikalikan jumlah hari event
  const getItemPrice = (item) => (item.listingType === 'sale' ? (item.salePrice || item.price) : item.price)
  const getItemSubtotal = (item) => {
    const basePrice = getItemPrice(item)
    if (item.listingType === 'sale') {
      return basePrice * item.qty
    }
    return basePrice * item.qty * durationDays
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0)
  const totalCost = cartItems.length > 0 ? cartTotal : (activeReservation?.totalAmount || 0)
  
  const estimatedAvoidedCost = totalCost * 4.8 
  const totalQtyCount = cartItems.length > 0 
    ? cartItems.reduce((sum, item) => sum + item.qty, 0)
    : (activeReservation?.items?.reduce((sum, item) => sum + item.qty, 0) || 0)
  const estimatedWasteAvoided = (totalQtyCount * 1.8).toFixed(1)

  // Booking detail
  const hasBooking = Boolean(
    activeReservation?.eventName || 
    activeReservation?.eventDate || 
    cartItems.length > 0 || 
    userPaymentStatus !== 'idle'
  )

  const eventTitle = activeReservation?.eventName || (cartItems.length > 0 ? 'Pemesanan Perlengkapan Event' : null)
  const eventDateFormatted = activeReservation?.eventDate 
    ? new Date(activeReservation.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const pickupLocation = activeReservation?.location 
    ? `Gedung C Kampus (Area ${activeReservation.location})` 
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
            <ClipboardList className="w-3.5 h-3.5" /> Reservasi & Checkout Event
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Event Equipment Reservation
          </h2>
          {hasBooking ? (
            <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Kepanitiaan: <strong className="text-gray-900">{eventTitle || 'Event Kampus'}</strong> ({currentUserName || 'Prasmulyan'})</span>
              {eventDateFormatted && <span>• Tanggal: {eventDateFormatted}</span>}
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-xs">
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Reservation Items Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Daftar Peralatan Dipesan</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold border border-blue-200">
                  Perhitungan: {durationDays} Hari Sewa
                </span>
                <span className="text-xs text-gray-500 font-semibold">{cartItems.length} jenis item</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4">Equipment & Biaya Harian</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Subtotal ({durationDays} Hari)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cartItems.map((item) => {
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
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-[11px]">
                            {item.circularScore || 85}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center border border-gray-200 rounded-lg bg-white">
                            <button 
                              disabled={userPaymentStatus !== 'idle'}
                              onClick={() => updateCartQty(item.id, -1)}
                              className="px-2 py-1 hover:bg-gray-100 rounded-l-lg font-bold text-gray-600 disabled:opacity-40"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 font-bold text-gray-900">{item.qty}</span>
                            <button 
                              disabled={userPaymentStatus !== 'idle'}
                              onClick={() => updateCartQty(item.id, 1)}
                              className="px-2 py-1 hover:bg-gray-100 rounded-r-lg font-bold text-gray-600 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-black text-gray-900 text-sm">
                            Rp{subtotal.toLocaleString('id-ID')}
                          </div>
                          {isRental && durationDays > 1 && (
                            <div className="text-[10px] text-gray-400">
                              (x{durationDays} hari)
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {userPaymentStatus === 'idle' && (
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {cartItems.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-xs space-y-3">
                {userPaymentStatus !== 'idle' ? (
                  <p>Pesanan Anda sedang diproses. Rincian status tersimpan di ringkasan pembayaran di sebelah kanan.</p>
                ) : (
                  <>
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-gray-500 font-semibold">Belum ada perlengkapan yang dimasukkan ke reservasi</p>
                    <p className="text-gray-400">Silakan buat event atau pilih perlengkapan yang tersedia di Marketplace.</p>
                    <div className="pt-2 flex justify-center gap-3">
                      <Link to="/create-event" className="btn-secondary text-xs !py-2 !px-4">
                        + Buat Event
                      </Link>
                      <Link to="/marketplace" className="btn-primary text-xs !py-2 !px-4">
                        + Buka Marketplace
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Jadwal & Lokasi Pengambilan */}
          {hasBooking && (cartItems.length > 0 || userPaymentStatus !== 'idle') && (
            <div className="card p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-blue-200/60 animate-fade-in-up">
              <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                Jadwal & Lokasi Pengambilan (Pick-up)
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Barang dapat diambil di <strong>{pickupLocation}</strong>
                {eventDateFormatted ? (
                  <> pada <strong>H-1 ({eventDateFormatted}, 09:00 - 16:00 WIB)</strong></>
                ) : (
                  <> pada <strong>jam operasional kampus (09:00 - 16:00 WIB)</strong></>
                )} dengan menunjukkan bukti transaksi QRIS / verifikasi kepada pengelola.
              </p>
            </div>
          )}
        </div>

        {/* Right Summary Card */}
        <div className="space-y-6">
          <div className="card p-6 space-y-6">
            <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Ringkasan Reservasi</span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">
                {durationDays} Hari Event
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total Items Dipesan</span>
                <span className="font-bold text-gray-900">{totalQtyCount} unit</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Durasi Peminjaman</span>
                <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{durationDays} Hari</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Terakumulasi</span>
                <span className="font-bold text-gray-900">Rp{totalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Maintenance Pool (10%)</span>
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
                  <span>Biaya Beli Dihindari:</span>
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
              {cartItems.length > 0 ? (
                <button
                  onClick={() => setShowQrisModal(true)}
                  className="w-full btn-primary text-sm !py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
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
                    MENUNGGU VERIFIKASI PEMBAYARAN DARI ADMIN ⏳
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bukti transfer Anda sebesar <strong>Rp{totalCost.toLocaleString('id-ID')}</strong> telah masuk ke antrean admin. Status akan otomatis berubah menjadi <strong>LUNAS</strong> setelah Admin memverifikasi bukti transfer Anda.
                  </p>
                  
                  {/* Tombol Lihat Bukti Transfer Mahasiswa Sendiri */}
                  {activeReservation?.paymentProofPhoto && (
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Bukti Transfer Saya</span>
                    </button>
                  )}

                  <div className="text-[10px] bg-white p-2.5 rounded-xl border border-amber-200 text-left font-mono space-y-0.5">
                    <div>Status: <strong className="text-amber-700">Pending Admin Verification</strong></div>
                    <div>Rekening Tujuan: <strong>BCA 0829102830 a.n EventLoop Escrow</strong></div>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/admin"
                      className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>👉 Buka Admin Panel untuk ACC (Simulasi Pengujian)</span>
                    </Link>
                  </div>
                </div>
              ) : userPaymentStatus === 'approved_success' ? (
                <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 text-center space-y-3 animate-fade-in-up">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="font-extrabold text-emerald-950 text-sm">
                    PEMBAYARAN QRIS TELAH DI-ACC & LUNAS! ✓ 💳
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Admin Keuangan Kampus telah mengkonfirmasi penerimaan dana sebesar <strong>Rp{totalCost.toLocaleString('id-ID')}</strong> ({durationDays} hari sewa). Booking Anda telah disetujui dan perlengkapan siap diambil di warehouse!
                  </p>
                  <div className="text-[10px] bg-white p-2.5 rounded-xl border border-emerald-200 text-left font-mono space-y-0.5">
                    <div>Ref Transaksi: <strong>{activeReservation?.txnId || '#TXN-QRIS-2026'}</strong></div>
                    <div>Verifikasi: <strong className="text-green-700">Approved by Admin EventLoop ✓</strong></div>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      to="/return"
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-green-800 bg-white px-4 py-2.5 rounded-xl border border-green-300 hover:bg-green-50 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Form Pengembalian (Untuk Barang Sewa)</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-400 cursor-not-allowed font-bold rounded-xl text-sm !py-3.5 flex items-center justify-center gap-2 shadow-lg"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Bayar via QRIS (Rp0)</span>
                </button>
              )}

              <Link
                to="/dashboard"
                className="w-full btn-secondary text-xs !py-2.5 flex items-center justify-center gap-2"
              >
                <span>Kembali ke Dashboard</span>
              </Link>
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
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Pembayaran Nasional</span>
              </div>
              <button 
                onClick={() => setShowQrisModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-xs text-gray-500">Total Pembayaran ({durationDays} Hari Sewa)</div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">
                Rp{totalCost.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-green-700 font-semibold mt-1">
                Event: {eventTitle || 'Event Kampus'}
              </div>
            </div>

            {/* QR Code Canvas */}
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 inline-block mx-auto">
              <div className="w-44 h-44 bg-white border border-gray-300 rounded-xl flex flex-col items-center justify-center p-3 relative shadow-inner">
                <QrCode className="w-32 h-32 text-gray-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 bg-white rounded-lg shadow-md border flex items-center justify-center">
                    <Recycle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                NMID: ID10202688921098
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Scan via BCA Mobile, GoPay, OVO, ShopeePay, atau m-Banking Anda.
            </p>

            {/* FORM UPLOAD BUKTI TRANSFER (SS) */}
            <div className="p-3.5 bg-green-50/70 border border-green-200 rounded-2xl text-left space-y-2">
              <label className="block text-xs font-bold text-green-950 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-green-700" />
                  Upload Screenshot Bukti Transfer *
                </span>
                <span className="text-[10px] text-red-500 font-semibold">Wajib Diisi</span>
              </label>

              <input
                type="file"
                accept="image/*"
                required
                onChange={handleProofChange}
                className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-green-700 file:text-white hover:file:bg-green-800 cursor-pointer"
              />

              {paymentProofPhoto && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-green-300 max-h-40 bg-black/5 flex items-center justify-center">
                  <img src={paymentProofPhoto} alt="Bukti Transfer" className="w-full h-auto object-contain max-h-40" />
                  <span className="absolute bottom-1 right-1 bg-green-700 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    ✓ Terupload {proofTime}
                  </span>
                </div>
              )}
              <p className="text-[10px] text-gray-400">
                Admin akan memvalidasi bukti screenshot ini sebelum meng-ACC pesanan Anda.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                disabled={!paymentProofPhoto}
                onClick={() => {
                  setShowQrisModal(false)
                  submitUserQrisPayment({
                    buyerOrg: currentUserName || 'Prasmulyan Organization',
                    itemNames: cartItems.map(c => `${c.qty}x ${c.name}`).join(', '),
                    totalAmount: totalCost,
                    durationDays,
                    paymentProofPhoto,
                    eventName: eventTitle,
                    eventDate: activeReservation?.eventDate,
                    location: activeReservation?.location
                  })
                }}
                className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{paymentProofPhoto ? 'Kirim Bukti Pembayaran ke Admin' : 'Upload Bukti Transfer Terlebih Dahulu'}</span>
              </button>
              <button
                onClick={() => setShowQrisModal(false)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW BUKTI TRANSFER USER */}
      {showPreviewModal && activeReservation?.paymentProofPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Bukti Transfer Pembayaran QRIS Anda
              </h4>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center max-h-72">
              <img src={activeReservation.paymentProofPhoto} alt="Bukti Transfer Anda" className="w-full h-auto object-contain max-h-72" />
            </div>
            <p className="text-[11px] text-gray-500 text-center">
              Foto ini telah diterima oleh Admin EventLoop untuk diverifikasi.
            </p>
            <button
              onClick={() => setShowPreviewModal(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
