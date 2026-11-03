import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  ClipboardCheck, 
  Trash2, 
  QrCode, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Upload, 
  Eye, 
  RotateCcw,
  Package,
  X
} from 'lucide-react'

// Fungsi Kompresi Foto Bukti Transfer QRIS
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
    cartItems, 
    updateCartQty, 
    removeFromCart, 
    activeReservation, 
    updateActiveEventDetails,
    userPaymentStatus, 
    submitUserQrisPayment,
    transactions
  } = useApp()

  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentProofPhoto, setPaymentProofPhoto] = useState(null)
  const [proofPreviewModal, setProofPreviewModal] = useState(null)

  const durationDays = Math.max(1, Number(activeReservation?.durationDays) || 1)
  const displayItems = cartItems.length > 0 ? cartItems : (activeReservation?.items || [])

  const totalCost = displayItems.reduce((sum, item) => {
    const unitPrice = item.listingType === 'sale' ? (item.salePrice || item.price * 5) : item.price
    const dayMultiplier = item.listingType === 'sale' ? 1 : durationDays
    return sum + unitPrice * item.qty * dayMultiplier
  }, 0)

  const adminFee = Math.round(totalCost * 0.05)
  const grandTotal = totalCost + adminFee

  const handlePayQris = () => {
    if (!paymentProofPhoto) return
    submitUserQrisPayment(grandTotal, paymentProofPhoto)
    setPaymentModal(false)
  }

  const latestUserTxn = transactions?.[0]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <span className="badge-sage mb-2">
          <ClipboardCheck className="w-3.5 h-3.5" /> Tahap 2 · Reservasi & Pembayaran
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Detail Reservasi & Pembayaran QRIS
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Biaya sewa dihitung berdasarkan durasi hari kegiatan Anda. Lampirkan bukti transfer QRIS saat melakukan pembayaran.
        </p>
      </div>

      {/* Banner Status Pembayaran */}
      {userPaymentStatus === 'pending_admin_approval' && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="badge-warm mb-1">Menunggu Verifikasi Admin</span>
              <h3 className="text-sm font-bold text-slate-900">
                Pembayaran & Bukti Transfer Sedang Diperiksa
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Bukti pembayaran QRIS Anda telah diterima. Setelah Admin menyetujui pembayaran, Anda dapat mengambil perlengkapan sesuai lokasi asalnya.
              </p>
            </div>
          </div>
          {(latestUserTxn?.paymentProofPhoto || paymentProofPhoto) && (
            <button
              type="button"
              onClick={() => setProofPreviewModal(latestUserTxn?.paymentProofPhoto || paymentProofPhoto)}
              className="btn-secondary text-xs !py-2 !px-3.5 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Bukti Bayar</span>
            </button>
          )}
        </div>
      )}

      {userPaymentStatus === 'approved' && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="badge-sage mb-1">Pembayaran Lunas & Terverifikasi</span>
              <h3 className="text-sm font-bold text-emerald-950">
                Tiket Pengambilan Barang Aktif
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Silakan ambil perlengkapan di lokasi masing-masing barang dan kembalikan ke lokasi yang sama setelah acara selesai.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(latestUserTxn?.paymentProofPhoto || paymentProofPhoto) && (
              <button
                type="button"
                onClick={() => setProofPreviewModal(latestUserTxn?.paymentProofPhoto || paymentProofPhoto)}
                className="btn-secondary text-xs !py-2 !px-3.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Bukti Bayar</span>
              </button>
            )}
            <Link
              to="/return"
              className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pengembalian Barang</span>
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Event Details & Item List */}
        <div className="lg:col-span-2 space-y-5">
          {/* Card Info Event */}
          <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Kegiatan Terdaftar
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeReservation?.eventName || 'Belum Membuat Kegiatan'}
                </h4>
                <span className="text-xs text-slate-500">
                  {activeReservation?.org} · {activeReservation?.eventDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50/60 px-3.5 py-2 rounded-xl border border-emerald-100">
              <Clock className="w-4 h-4 text-emerald-600" />
              <div className="text-xs">
                <span className="text-slate-500 block text-[10px]">Durasi Sewa</span>
                {userPaymentStatus === 'idle' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={durationDays}
                      onChange={(e) => {
                        const d = Math.max(1, parseInt(e.target.value) || 1)
                        updateActiveEventDetails({ durationDays: d })
                      }}
                      className="w-12 px-1.5 py-0.5 bg-white border border-emerald-200 rounded text-center font-bold text-emerald-800 text-xs"
                    />
                    <span className="font-semibold text-emerald-800">Hari</span>
                  </div>
                ) : (
                  <strong className="text-emerald-800">{durationDays} Hari</strong>
                )}
              </div>
            </div>
          </div>

          {/* Item Table */}
          {displayItems.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-emerald-100/80 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Perlengkapan ({displayItems.length} Jenis)
                </h3>
                <span className="badge-sage">
                  Dikali {durationDays} Hari Sewa
                </span>
              </div>

              <div className="divide-y divide-emerald-100/60">
                {displayItems.map((item) => {
                  const unitPrice = item.listingType === 'sale' ? (item.salePrice || item.price * 5) : item.price
                  const dayMultiplier = item.listingType === 'sale' ? 1 : durationDays
                  const subtotal = unitPrice * item.qty * dayMultiplier
                  const originLocation = item.lastLocation || item.initialLocation || 'Warehouse Kampus Gedung C'

                  return (
                    <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            item.image || '📦'
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                          <div className="text-xs text-slate-500">
                            Pemilik: {item.owner} · Rp{unitPrice.toLocaleString('id-ID')} {item.listingType === 'sale' ? '(Beli)' : '/ hari'}
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                            <MapPin className="w-3 h-3" />
                            <span>Lokasi Asal & Return: <strong>{originLocation}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {userPaymentStatus === 'idle' ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateCartQty(item.id, item.qty - 1)}
                              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-emerald-50 text-xs font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-semibold text-xs">{item.qty}</span>
                            <button 
                              onClick={() => updateCartQty(item.id, item.qty + 1)}
                              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-emerald-50 text-xs font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="badge-stone">{item.qty} unit</span>
                        )}

                        <div className="text-right min-w-[95px]">
                          <div className="font-bold text-emerald-700 text-sm">
                            Rp{subtotal.toLocaleString('id-ID')}
                          </div>
                          {item.listingType !== 'sale' && (
                            <div className="text-[10px] text-slate-400">
                              {item.qty} unit × {durationDays} hari
                            </div>
                          )}
                        </div>

                        {userPaymentStatus === 'idle' && (
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center space-y-3">
              <Package className="w-9 h-9 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Belum Ada Perlengkapan Dipilih</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan pilih perlengkapan yang Anda butuhkan melalui katalog Marketplace.
              </p>
              <Link to="/marketplace" className="btn-primary text-xs inline-flex items-center gap-2">
                <span>Buka Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Col: Payment Summary */}
        <div className="space-y-5">
          <div className="card p-6 space-y-5">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-emerald-100/80 flex items-center justify-between">
              <span>Ringkasan Biaya</span>
              <span className="badge-sage">{durationDays} Hari</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({displayItems.reduce((a, b) => a + b.qty, 0)} unit × {durationDays} hari)</span>
                <span className="font-semibold text-slate-800">Rp{totalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Biaya Layanan Platform (5%)</span>
                <span className="font-semibold text-slate-800">Rp{adminFee.toLocaleString('id-ID')}</span>
              </div>

              <div className="pt-3 border-t border-emerald-100 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Total Pembayaran</span>
                <span className="text-xl font-bold text-emerald-700">
                  Rp{grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Rekening Bersama (Escrow)
              </div>
              <p className="leading-relaxed">
                Dana disimpan di rekening pengelola EventLoop dan diteruskan ke pemilik barang beserta bukti transfer setelah diverifikasi.
              </p>
            </div>

            {userPaymentStatus === 'idle' ? (
              <button
                disabled={displayItems.length === 0}
                onClick={() => setPaymentModal(true)}
                className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Bayar via QRIS & Upload Bukti</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-center text-xs font-semibold border border-emerald-200">
                {userPaymentStatus === 'approved'
                  ? '✓ Pembayaran Telah Disetujui Admin'
                  : '⏳ Menunggu Verifikasi Admin'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal QRIS & Upload Bukti Transfer */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-emerald-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Pembayaran QRIS EventLoop</h4>
                <p className="text-[11px] text-slate-500">Durasi Sewa: {durationDays} Hari</p>
              </div>
              <button onClick={() => setPaymentModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QRIS Box */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center space-y-2">
              <div className="text-xs font-bold text-slate-800">EVENTLOOP ESCROW OFFICIAL</div>
              <div className="text-[11px] text-slate-500">NMID: ID1026099281920</div>

              <div className="w-36 h-36 mx-auto bg-white border border-emerald-200 rounded-xl p-2.5 grid grid-cols-5 grid-rows-5 gap-1">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-xs ${
                      [0,1,2,4,5,6,10,12,14,18,20,21,22,24].includes(i) 
                        ? 'bg-emerald-950' 
                        : 'bg-transparent'
                    }`} 
                  />
                ))}
              </div>

              <div className="pt-1">
                <span className="text-[11px] text-slate-500 block">Nominal Transfer</span>
                <span className="text-xl font-bold text-emerald-700">
                  Rp{grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Upload Screenshot Bukti Transfer */}
            <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Upload Screenshot Bukti Transfer
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">Wajib</span>
              </label>

              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    compressImage(f, (b64) => setPaymentProofPhoto(b64))
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />

              {paymentProofPhoto && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-emerald-200 max-h-36 bg-white flex items-center justify-center">
                  <img src={paymentProofPhoto} alt="Bukti Transfer" className="w-full h-auto object-contain max-h-36" />
                  <span className="absolute bottom-1.5 right-1.5 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                    Siap Dikirim
                  </span>
                </div>
              )}
            </div>

            <button
              disabled={!paymentProofPhoto}
              onClick={handlePayQris}
              className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{paymentProofPhoto ? 'Kirim Bukti Pembayaran' : 'Lampirkan Screenshot Terlebih Dahulu'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Preview Bukti Bayar */}
      {proofPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-emerald-100">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <h4 className="font-bold text-slate-900 text-sm">Bukti Pembayaran QRIS</h4>
              <button onClick={() => setProofPreviewModal(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-emerald-100 max-h-96 bg-emerald-50/30 flex items-center justify-center">
              <img src={proofPreviewModal} alt="Bukti QRIS" className="w-full h-auto object-contain max-h-96" />
            </div>
            <button
              onClick={() => setProofPreviewModal(null)}
              className="w-full btn-primary text-xs !py-2.5 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
