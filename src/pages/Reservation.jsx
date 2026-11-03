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
  AlertCircle
} from 'lucide-react'

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

  const cartTotal = cartItems.reduce((sum, item) => sum + ((item.listingType === 'sale' ? (item.salePrice || item.price) : item.price) * item.qty), 0)
  const totalCost = cartItems.length > 0 ? cartTotal : (activeReservation?.totalAmount || 0)
  
  const estimatedAvoidedCost = totalCost * 4.8 
  const totalQtyCount = cartItems.length > 0 
    ? cartItems.reduce((sum, item) => sum + item.qty, 0)
    : (activeReservation?.items?.reduce((sum, item) => sum + item.qty, 0) || 0)
  const estimatedWasteAvoided = (totalQtyCount * 1.8).toFixed(1)

  // Booking detail (Hanya ada jika user sudah membuat event atau memilih barang)
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
    ? `Warehouse Kampus Gedung C (Area ${activeReservation.location})` 
    : 'Warehouse Kampus Gedung C (Lantai Dasar)'

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
            <ClipboardList className="w-3.5 h-3.5" /> Reservasi & Checkout
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Event Equipment Reservation
          </h2>
          {hasBooking ? (
            <p className="text-sm text-gray-500">
              Kepanitiaan: <strong>{eventTitle || 'Event Kampus'}</strong> ({currentUserName || 'Prasmulyan'})
              {eventDateFormatted && ` • Tanggal: ${eventDateFormatted}`}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Kelola item perlengkapan yang ingin dipinjam atau dibeli untuk kegiatan organisasi Anda.
            </p>
          )}
        </div>

        <Link to="/marketplace" className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Barang Lain</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Reservation Items Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Daftar Peralatan Dipesan</h3>
              <span className="text-xs text-gray-500 font-semibold">{cartItems.length} jenis item</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4">Equipment</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Subtotal</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                            item.listingType === 'sale' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.listingType === 'sale' ? '🏷️ Beli Permanen' : '🔄 Sewa Event'}
                          </span>
                          <span>Rp{(item.listingType === 'sale' ? (item.salePrice || item.price) : item.price).toLocaleString('id-ID')} / unit</span>
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
                            onClick={() => updateCartQty(item.id, -1)}
                            className="px-2 py-1 hover:bg-gray-100 rounded-l-lg font-bold text-gray-600"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-1 font-bold text-gray-900">{item.qty}</span>
                          <button 
                            onClick={() => updateCartQty(item.id, 1)}
                            className="px-2 py-1 hover:bg-gray-100 rounded-r-lg font-bold text-gray-600"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right font-bold text-gray-900 text-sm">
                        Rp{((item.listingType === 'sale' ? (item.salePrice || item.price) : item.price) * item.qty).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
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

          {/* Jadwal & Lokasi Pengambilan: HANYA TAMPIL JIKA ADA BOOKING AKTIF / BARANG DI-BOOKING */}
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
                  <> pada <strong>jam operasional Sarpras (09:00 - 16:00 WIB)</strong></>
                )} dengan menunjukkan bukti transaksi QRIS / verifikasi kepada petugas Sarpras.
              </p>
            </div>
          )}
        </div>

        {/* Right Summary Card */}
        <div className="space-y-6">
          <div className="card p-6 space-y-6">
            <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-gray-100">
              Ringkasan Reservasi
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total Items Dipesan</span>
                <span className="font-bold text-gray-900">{totalQtyCount} unit</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Biaya</span>
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

            {/* Circular Impact Badge (Jika ada item) */}
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
                    MENUNGGU ACC PEMBAYARAN DARI ADMIN KAMPUS ⏳
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bukti scan QRIS Anda sebesar <strong>Rp{totalCost.toLocaleString('id-ID')}</strong> telah masuk ke antrean verifikasi Bank Admin EventLoop. Status ini akan otomatis berubah menjadi <strong>BERHASIL</strong> begitu Admin mengklik ACC di Admin Panel.
                  </p>
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
                    Admin Keuangan Kampus telah mengkonfirmasi penerimaan dana sebesar <strong>Rp{totalCost.toLocaleString('id-ID')}</strong>. Booking Anda telah disetujui dan perlengkapan siap diambil di warehouse!
                  </p>
                  <div className="text-[10px] bg-white p-2.5 rounded-xl border border-emerald-200 text-left font-mono space-y-0.5">
                    <div>Ref Transaksi: <strong>{activeReservation?.txnId || '#TXN-QRIS-2026'}</strong></div>
                    <div>Verifikasi: <strong className="text-green-700">Approved by Admin Sarpras ✓</strong></div>
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

      {/* QRIS PAYMENT MODAL */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100 animate-fade-in-up">
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
              <div className="text-xs text-gray-500">Total Pembayaran Rental / Beli</div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">
                Rp{totalCost.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-green-700 font-semibold mt-1">
                Event: {eventTitle || 'Event Kampus'}
              </div>
            </div>

            {/* Simulated QR Code Canvas */}
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 inline-block mx-auto">
              <div className="w-48 h-48 bg-white border border-gray-300 rounded-xl flex flex-col items-center justify-center p-3 relative shadow-inner">
                <QrCode className="w-36 h-36 text-gray-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-md border flex items-center justify-center">
                    <Recycle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 mt-2 font-mono">
                NMID: ID10202688921098
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed px-2">
              Scan menggunakan BCA Mobile, GoPay, OVO, ShopeePay, atau aplikasi m-Banking Anda.
            </p>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowQrisModal(false)
                  submitUserQrisPayment({
                    buyerOrg: currentUserName || 'Prasmulyan Organization',
                    itemNames: cartItems.map(c => `${c.qty}x ${c.name}`).join(', '),
                    totalAmount: totalCost,
                    eventName: eventTitle,
                    eventDate: activeReservation?.eventDate,
                    location: activeReservation?.location
                  })
                }}
                className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Saya Sudah Membayar (Simulasi Sukses)</span>
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
    </div>
  )
}
