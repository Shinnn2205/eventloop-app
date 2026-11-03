import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Building,
  Image as ImageIcon,
  History,
  Lock,
  User,
  Calendar
} from 'lucide-react'

export default function EquipmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { equipments, cartItems, addToCart, removeFromCart, userPaymentStatus, currentUserRole, getEquipmentBorrowings } = useApp()

  const item = equipments.find(eq => eq.id.toString() === id)
  const isLockedByActivePayment = currentUserRole === 'user' && userPaymentStatus !== 'idle'
  
  if (!item) {
    return (
      <div className="text-center p-12 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Barang Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">Barang mungkin telah dihapus dari katalog.</p>
        <button onClick={() => navigate('/marketplace')} className="btn-primary text-xs">Kembali ke Marketplace</button>
      </div>
    )
  }

  const isReserved = cartItems.some(cartItem => cartItem.id === item.id)
  const activeBorrowings = getEquipmentBorrowings ? getEquipmentBorrowings(item.id, item.name) : []

  const toggleReserve = () => {
    if (isLockedByActivePayment) return
    if (isReserved) {
      removeFromCart(item.id)
    } else {
      addToCart(item, 1)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* KOLOM KIRI */}
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 aspect-square rounded-2xl flex items-center justify-center border border-emerald-100 overflow-hidden relative shadow-xs">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl opacity-85">{item.image}</span>
            )}
            <div className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-semibold text-emerald-800 border border-emerald-100">
              {item.category}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-emerald-100/80 pb-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Lokasi Pengambilan & Pengembalian Asal
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Lokasi Simpan</span>
                <span className="text-xs font-bold text-emerald-900 block truncate mt-0.5" title={item.lastLocation}>
                  {item.lastLocation || 'Warehouse Kampus Gedung C'}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Kondisi Fisik</span>
                <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                  {item.condition || 'Good / Siap Pakai'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              Barang ini diambil dan wajib dikembalikan ke <strong className="text-emerald-800">{item.lastLocation || 'Warehouse Kampus Gedung C'}</strong> setelah kegiatan selesai.
            </p>

            <div>
              <span className="text-[11px] text-slate-400 font-medium block mb-2">Foto Lokasi Penyimpanan Terakhir</span>
              {item.lastStoragePhoto ? (
                <div className="h-36 rounded-xl overflow-hidden border border-emerald-100 relative">
                  <img src={item.lastStoragePhoto} alt="Rak Terakhir" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-24 rounded-xl border border-dashed border-emerald-200 flex flex-col items-center justify-center text-slate-400 bg-emerald-50/20">
                  <ImageIcon className="w-5 h-5 mb-1 opacity-60 text-emerald-500" />
                  <span className="text-[11px]">Foto lokasi rak belum dilampirkan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="space-y-5">
          <div className="card p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={item.listingType === 'sale' ? 'badge-warm' : 'badge-sage'}>
                  {item.listingType === 'sale' ? 'Beli Preloved' : 'Sewa Harian'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Tersedia {item.available} dari {item.total} unit
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {item.name}
              </h1>
              
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-700">
                  Rp{(item.listingType === 'sale' ? (item.salePrice || item.price * 5) : item.price).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-slate-500">
                  {item.listingType === 'sale' ? '/ unit (beli lepas)' : '/ unit / hari'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-emerald-600" />
                  Circular Score: {item.circularScore}/100
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Indikator pemakaian berulang & ramah lingkungan.</div>
              </div>
              <div className="text-center border-l border-emerald-200 pl-4">
                <div className="text-[10px] text-emerald-700">Daya Tahan</div>
                <div className="font-bold text-emerald-950 text-sm">{item.maxReuse}x pakai</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-xs">Deskripsi Perlengkapan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description || 'Peralatan kegiatan kampus yang siap digunakan dan terverifikasi oleh pengelola EventLoop.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
              <div>
                <span className="text-slate-400 text-[10px] block">Dimensi / Ukuran</span>
                <strong className="text-slate-800">{item.size || 'Standar'}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Material Utama</span>
                <strong className="text-slate-800">{item.material || 'Aluminium / Campuran'}</strong>
              </div>
              <div className="col-span-2 pt-2.5 border-t border-emerald-100/80">
                <span className="text-slate-400 text-[10px] block">Pemilik Inventaris</span>
                <strong className="text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  {item.owner}
                </strong>
              </div>
            </div>

            {/* Info Peminjam Aktif pada Barang Ini */}
            {activeBorrowings.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <span className="text-xs font-bold text-emerald-900 block">
                  📍 Status Unit yang Sedang Dipinjam Saat Ini:
                </span>
                {activeBorrowings.map((b, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-emerald-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        {b.borrowerName} ({b.org})
                      </span>
                      <span className="badge-sage !py-0.5 !px-2 !text-[10px]">{b.qty} unit</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Event: <strong>{b.eventName}</strong> · Lokasi: {b.location}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Periode: <strong>{b.startDate}</strong> s/d <strong>{b.endDate}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentUserRole === 'user' && (
              <div className="pt-2">
                {isLockedByActivePayment ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Reservasi Terkunci (Event Aktif Sedang Berjalan)</span>
                    </button>
                    <Link to="/reservation" className="block text-center text-xs font-semibold text-emerald-700 hover:underline">
                      Lihat Reservasi Aktif Saya →
                    </Link>
                  </div>
                ) : (
                  <>
                    <button
                      disabled={item.available <= 0 && !isReserved}
                      onClick={toggleReserve}
                      className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isReserved
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : item.available <= 0 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      {isReserved ? '✓ Di Keranjang (Klik untuk Batal)' : item.available <= 0 ? 'Stok Habis' : '+ Tambah ke Reservasi'}
                    </button>
                    {isReserved && (
                      <Link to="/reservation" className="block text-center mt-2.5 text-xs font-semibold text-emerald-700 hover:underline">
                        Lanjut ke Halaman Reservasi →
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-emerald-600" />
              Riwayat Pemakaian Sirkular
            </h3>
            <div className="border border-emerald-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/40 border-b border-emerald-100 text-slate-500 text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">Tanggal</th>
                    <th className="px-3.5 py-2.5 font-semibold">Kegiatan</th>
                    <th className="px-3.5 py-2.5 font-semibold">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/60">
                  {item.history && item.history.length > 0 ? (
                    item.history.map((hist, idx) => (
                      <tr key={idx}>
                        <td className="px-3.5 py-2.5 text-slate-500 text-[11px] whitespace-nowrap">
                          {hist.date}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                          {hist.event}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {hist.org}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="badge-sage">
                            {hist.condition || 'Baik'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-5 text-center text-slate-400 text-xs">
                        Belum ada riwayat pemakaian tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
