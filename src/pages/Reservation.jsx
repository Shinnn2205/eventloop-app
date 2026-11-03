import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Trash2, 
  Plus, 
  CheckCircle2, 
  QrCode, 
  Clock,
  Calendar,
  Upload,
  Eye,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  MapPin,
  Package
} from 'lucide-react'

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

  const getItemPrice = (item) => (item.listingType === 'sale' ? (item.salePrice || item.price) : item.price)
  const getItemSubtotal = (item) => {
    const basePrice = getItemPrice(item)
    return item.listingType === 'sale' ? basePrice * item.qty : basePrice * item.qty * durationDays
  }

  const displayItems = (cartItems && cartItems.length > 0) 
    ? cartItems 
    : (activeReservation?.items || [])

  const isPaidOrPending = userPaymentStatus !== 'idle'

  const cartTotal = displayItems.reduce((sum, item) => sum + getItemSubtotal(item), 0)
  const totalCost = (activeReservation?.totalAmount && isPaidOrPending) ? activeReservation.totalAmount : cartTotal
  const totalQtyCount = displayItems.reduce((sum, item) => sum + (item.qty || 1), 0)

  const hasBooking = Boolean(
    activeReservation?.eventName || 
    activeReservation?.eventDate || 
    displayItems.length > 0 || 
    userPaymentStatus !== 'idle'
  )

  const eventTitle = activeReservation?.eventName || (displayItems.length > 0 ? 'Event Organisasi Kampus' : null)

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-[#3A6351]">Reservasi & Tiket</span>
          <h2 className="text-2xl font-bold text-[#232925] mt-0.5">
            {isPaidOrPending ? 'Detail Reservasi Event' : 'Checkout Peminjaman'}
          </h2>
          <p className="text-sm text-[#5C645E] mt-0.5">
            {hasBooking 
              ? `${eventTitle || 'Event Kampus'} · Durasi Sewa ${durationDays} Hari`
              : 'Periksa daftar perlengkapan dan selesaikan konfirmasi pembayaran.'}
          </p>
        </div>

        {!isPaidOrPending && (
          <Link to="/marketplace" className="btn-secondary text-xs !py-2 !px-3.5 flex items-center gap-1.5 self-start sm:self-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Barang</span>
          </Link>
        )}
      </div>

      {/* Kartu Status Tiket Reservasi (Lembut & Tenang) */}
      {isPaidOrPending && (
        <div className={`p-5 sm:p-6 rounded-2xl border ${
          userPaymentStatus === 'approved_success'
            ? 'bg-[#EAF0EC] border-[#CFE0D6]'
            : 'bg-[#F7F1E3] border-[#E5D8BD]'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                userPaymentStatus === 'approved_success' ? 'bg-[#3A6351] text-white' : 'bg-[#855D27] text-white'
              }`}>
                {userPaymentStatus === 'approved_success' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#232925]">
                    {userPaymentStatus === 'approved_success' ? 'Tiket Pengambilan Aktif (Lunas)' : 'Menunggu Verifikasi Pembayaran Admin'}
                  </span>
                  <span className="text-xs font-mono text-[#5C645E] bg-white/70 px-2 py-0.5 rounded border border-black/5">
                    {activeReservation?.txnId || '#TXN-QRIS'}
                  </span>
                </div>
                <p className="text-xs text-[#5C645E] mt-1">
                  Event: <strong>{activeReservation?.eventName || 'Event Kampus'}</strong> · {durationDays} Hari · Total Rp{totalCost.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {activeReservation?.paymentProofPhoto && (
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="btn-secondary text-xs !py-2 !px-3.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#3A6351]" />
                  <span>Bukti Transfer Saya</span>
                </button>
              )}
              {userPaymentStatus === 'approved_success' && (
                <Link
                  to="/return"
                  className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Form Pengembalian</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pengaturan Cepat Nama Event & Durasi Hari (Saat masih di keranjang) */}
      {!isPaidOrPending && displayItems.length > 0 && (
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-[#5C645E] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#3A6351]" />
              <span>Nama Event & Durasi Hari Peminjaman</span>
            </label>
            <input
              type="text"
              value={activeReservation?.eventName || ''}
              onChange={(e) => handleUpdateEventName(e.target.value)}
              placeholder="Masukkan nama event Anda..."
              className="cozy-input max-w-md !py-2"
            />
          </div>

          <div className="flex items-center gap-3">
            <div>
              <span className="text-[11px] text-[#7A827C] block mb-1">Durasi Sewa</span>
              <div className="inline-flex items-center bg-[#FAF9F5] border border-[#DFDDD4] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleUpdateDuration(durationDays - 1)}
                  className="px-3 py-1.5 font-semibold text-[#3D4540] hover:bg-[#EFECE6] cursor-pointer"
                >
                  -
                </button>
                <span className="px-3.5 py-1.5 font-semibold text-[#232925] text-xs bg-white border-x border-[#DFDDD4]">
                  {durationDays} Hari
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateDuration(durationDays + 1)}
                  className="px-3 py-1.5 font-semibold text-[#3D4540] hover:bg-[#EFECE6] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tabel Daftar Barang */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFECE6] flex items-center justify-between">
              <h3 className="font-semibold text-[#232925] text-sm">
                Daftar Perlengkapan ({displayItems.length})
              </h3>
              <span className="badge-stone">
                Akumulasi {durationDays} Hari
              </span>
            </div>

            {displayItems.length > 0 ? (
              <div className="divide-y divide-[#EFECE6]">
                {displayItems.map((item) => {
                  const isRental = item.listingType !== 'sale'
                  const unitPrice = getItemPrice(item)
                  const subtotal = getItemSubtotal(item)

                  return (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F5]/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#232925] text-sm">{item.name}</span>
                          <span className="text-[11px] text-[#7A827C] bg-[#F3F1EA] px-2 py-0.5 rounded-md">
                            {isRental ? 'Sewa Harian' : 'Beli Preloved'}
                          </span>
                        </div>
                        <div className="text-xs text-[#7A827C]">
                          Rp{unitPrice.toLocaleString('id-ID')} / {isRental ? 'hari' : 'unit'}
                        </div>
                        <div className="text-xs text-[#5C645E] flex items-center gap-1 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#3A6351] flex-shrink-0" />
                          <span>Lokasi Asal: {item.lastLocation || item.initialLocation || 'Warehouse Kampus Gedung C'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F3F1EA]">
                        {isPaidOrPending ? (
                          <span className="badge-stone">
                            {item.qty} unit
                          </span>
                        ) : (
                          <div className="inline-flex items-center border border-[#DFDDD4] rounded-lg bg-[#FAF9F5]">
                            <button 
                              onClick={() => updateCartQty(item.id, -1)}
                              className="px-2.5 py-1 hover:bg-[#EFECE6] text-xs font-semibold text-[#5C645E] cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 font-semibold text-[#232925] text-xs bg-white border-x border-[#DFDDD4]">{item.qty}</span>
                            <button 
                              onClick={() => updateCartQty(item.id, 1)}
                              className="px-2.5 py-1 hover:bg-[#EFECE6] text-xs font-semibold text-[#5C645E] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <div className="text-right min-w-[90px]">
                          <div className="font-bold text-[#232925] text-sm">
                            Rp{subtotal.toLocaleString('id-ID')}
                          </div>
                          {isRental && (
                            <div className="text-[10px] text-[#8A928C]">
                              {item.qty} unit × {durationDays} hari
                            </div>
                          )}
                        </div>

                        {!isPaidOrPending && (
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#8A928C] hover:text-[#B84A39] p-1.5 transition-colors cursor-pointer"
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
            ) : (
              <div className="p-12 text-center space-y-3">
                <Package className="w-9 h-9 text-[#B8B4A8] mx-auto" />
                <p className="text-[#232925] font-semibold text-sm">Belum ada perlengkapan dipilih</p>
                <p className="text-xs text-[#7A827C] max-w-xs mx-auto">
                  Silakan pilih perlengkapan yang Anda butuhkan di halaman Katalog Barang.
                </p>
                <div className="pt-2">
                  <Link to="/marketplace" className="btn-primary text-xs inline-flex items-center gap-1.5">
                    <span>Buka Katalog Barang</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Pembayaran */}
        <div className="space-y-4">
          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-[#232925] text-base pb-3 border-b border-[#EFECE6]">
              Ringkasan Pembayaran
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#5C645E]">
                <span>Total Unit Barang</span>
                <span className="font-medium text-[#232925]">{totalQtyCount} unit</span>
              </div>
              <div className="flex justify-between text-[#5C645E]">
                <span>Durasi Peminjaman</span>
                <span className="font-medium text-[#232925]">{durationDays} Hari</span>
              </div>
              <div className="flex justify-between text-[#5C645E]">
                <span>Biaya Layanan Escrow</span>
                <span className="text-[#8A928C]">Termasuk</span>
              </div>

              <div className="pt-3 border-t border-[#EFECE6] flex justify-between items-baseline">
                <span className="font-semibold text-[#232925] text-sm">Total Biaya</span>
                <span className="text-xl font-bold text-[#3A6351]">
                  Rp{totalCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {!isPaidOrPending && cartItems.length > 0 ? (
                <button
                  onClick={() => setShowQrisModal(true)}
                  className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Bayar via QRIS</span>
                </button>
              ) : userPaymentStatus === 'pending_admin_approval' ? (
                <div className="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-xs space-y-2 text-[#5C645E]">
                  <div className="font-semibold text-[#232925] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#855D27]" />
                    <span>Menunggu Verifikasi Admin</span>
                  </div>
                  <p className="leading-relaxed">
                    Bukti pembayaran telah dikirim. Tiket pengambilan akan aktif setelah diverifikasi Admin.
                  </p>
                </div>
              ) : userPaymentStatus === 'approved_success' ? (
                <div className="p-4 bg-[#EAF0EC] border border-[#CFE0D6] rounded-xl text-xs space-y-3">
                  <div className="font-semibold text-[#264738] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3A6351]" />
                    <span>Pembayaran Terverifikasi (Lunas)</span>
                  </div>
                  <p className="text-[#3D4540] leading-relaxed">
                    Silakan ambil perlengkapan di lokasi asalnya masing-masing dan kembalikan ke tempat semula setelah acara selesai.
                  </p>
                  <Link
                    to="/return"
                    className="w-full btn-primary text-xs !py-2.5 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Buka Pengembalian</span>
                  </Link>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full btn-primary text-xs !py-3"
                >
                  Pilih Barang Terlebih Dahulu
                </button>
              )}

              {hasBooking && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Batalkan dan reset reservasi event ini?')) {
                      clearActiveEvent()
                    }
                  }}
                  className="w-full text-xs font-medium text-[#9E4738] hover:bg-[#FDF3F2] py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Reservasi Event
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pembayaran QRIS */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-xl border border-[#E8E6DF] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
              <span className="font-bold text-[#232925] text-sm">Pembayaran QRIS</span>
              <button 
                onClick={() => setShowQrisModal(false)}
                className="text-[#8A928C] hover:text-[#232925] text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-xs text-[#7A827C]">Total Pembayaran ({durationDays} Hari Sewa)</div>
              <div className="text-2xl font-bold text-[#232925] mt-0.5">
                Rp{totalCost.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E8E6DF] inline-block mx-auto">
              <div className="w-36 h-36 bg-white rounded-xl flex flex-col items-center justify-center p-2 border border-[#EFECE6]">
                <QrCode className="w-28 h-28 text-[#232925]" />
                <span className="text-[9px] font-mono text-[#8A928C] mt-1">NMID: ID1029384756</span>
              </div>
            </div>

            <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E8E6DF] text-left space-y-2">
              <label className="block text-xs font-semibold text-[#232925] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#3A6351]" />
                <span>Upload Bukti Transfer (Wajib) *</span>
              </label>

              <div className="relative border border-dashed border-[#C8C5B9] rounded-xl p-3 text-center hover:border-[#3A6351] transition-colors bg-white">
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={handleProofChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {paymentProofPhoto ? (
                  <div className="space-y-1.5">
                    <img src={paymentProofPhoto} alt="Bukti Transfer" className="w-full h-28 object-contain rounded-lg mx-auto" />
                    <span className="text-[11px] text-[#3A6351] font-medium block">
                      ✓ Bukti terlampir ({proofTime})
                    </span>
                  </div>
                ) : (
                  <div className="py-3 flex flex-col items-center">
                    <ImageIcon className="w-5 h-5 text-[#8A928C] mb-1" />
                    <span className="text-xs font-medium text-[#3D4540]">Pilih Screenshot Bukti Transfer</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                disabled={!paymentProofPhoto}
                onClick={() => {
                  submitUserQrisPayment({
                    eventName: activeReservation?.eventName || 'Event Organisasi Kampus',
                    totalAmount: totalCost,
                    buyerOrg: currentUserName || 'Mahasiswa Prasmul',
                    itemNames: displayItems.map(i => `${i.name} (${i.qty}x)`).join(', '),
                    durationDays,
                    paymentProofPhoto
                  })
                  setShowQrisModal(false)
                }}
                className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kirim Konfirmasi Pembayaran</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Bukti Transfer */}
      {showPreviewModal && activeReservation?.paymentProofPhoto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E8E6DF]">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <h4 className="font-semibold text-[#232925] text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#3A6351]" />
                Bukti Transfer Saya
              </h4>
              <button onClick={() => setShowPreviewModal(false)} className="text-[#8A928C] hover:text-[#232925] text-xs p-1 cursor-pointer">✕</button>
            </div>
            
            <div className="rounded-xl overflow-hidden border border-[#E8E6DF] bg-[#FAF9F5] max-h-80 flex items-center justify-center">
              <img src={activeReservation.paymentProofPhoto} alt="Bukti Transfer" className="w-full h-auto object-contain max-h-80" />
            </div>

            <button onClick={() => setShowPreviewModal(false)} className="w-full btn-primary !py-2.5 text-xs cursor-pointer">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
