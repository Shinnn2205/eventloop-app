import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  RefreshCw, 
  Building,
  Image as ImageIcon,
  History,
  ShieldCheck
} from 'lucide-react'

export default function EquipmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { equipments, cartItems, addToCart, removeFromCart } = useApp()

  const item = equipments.find(eq => eq.id.toString() === id)
  
  if (!item) {
    return (
      <div className="text-center p-12 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Barang Tidak Ditemukan</h2>
        <p className="text-gray-500">Barang mungkin telah dihapus secara permanen oleh Admin dari sistem.</p>
        <button onClick={() => navigate('/marketplace')} className="btn-primary">Kembali ke Marketplace</button>
      </div>
    )
  }

  const isReserved = cartItems.some(cartItem => cartItem.id === item.id)

  const toggleReserve = () => {
    if (isReserved) {
      removeFromCart(item.id)
    } else {
      addToCart(item, 1)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Breadcrumb */}
      <button 
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* KOLOM KIRI: Gambar Utama & Box Lokasi Gudang */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-green-50/30 aspect-square rounded-3xl flex items-center justify-center border border-gray-200 overflow-hidden relative shadow-sm">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-9xl opacity-80">{item.image}</span>
            )}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-gray-700 border border-gray-200 shadow-sm">
              {item.category}
            </div>
          </div>

          {/* BOX INFO LOKASI GUDANG & FOTO RAK TERAKHIR */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              Lokasi Gudang & Posisi Rak Terakhir
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Lokasi Rak Terkini</span>
                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 block truncate" title={item.lastLocation}>
                  {item.lastLocation || 'Warehouse Kampus (Default)'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Kondisi Fisik Saat Ini</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 block">
                  {item.condition || 'Good / Siap Pakai'}
                </span>
              </div>
            </div>

            {/* FOTO RAK PENYIMPANAN TERAKHIR (DARI UPLOAD ATAU RETURN) */}
            <div className="pt-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-2">Foto Bukti Rak Terakhir Tersimpan</span>
              {item.lastStoragePhoto ? (
                <div className="h-36 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group">
                  <img src={item.lastStoragePhoto} alt="Rak Terakhir" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      Lokasi Terverifikasi
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                  <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                  <span className="text-[10px] font-semibold">Foto rak belum tersedia di sistem</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Detail & Riwayat */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider ${
                item.listingType === 'sale' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
              }`}>
                {item.listingType === 'sale' ? '🏷️ Beli Permanen (Preloved)' : '🔄 Sewa / Event'}
              </span>
              <span className="text-[11px] text-gray-500 font-bold">
                Tersedia: {item.available} / {item.total} Unit
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {item.name}
            </h1>
            
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-green-700">
                Rp{(item.listingType === 'sale' ? (item.salePrice || item.price * 5) : item.price).toLocaleString('id-ID')}
              </span>
              <span className="text-sm text-gray-500 font-semibold">
                {item.listingType === 'sale' ? 'Sekali Bayar' : '/ Unit'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-2xl border border-green-200/70 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-green-900 flex items-center gap-1.5 mb-0.5">
                <Star className="w-4 h-4 text-green-600" />
                Circular Score: {item.circularScore}/100
              </div>
              <div className="text-[11px] text-green-700">Indikator barang ramah lingkungan & tahan lama.</div>
            </div>
            <div className="text-center border-l border-green-200 pl-4">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Max Reuse</div>
              <div className="font-black text-gray-900 text-lg">{item.maxReuse}x</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-extrabold text-gray-900 text-sm">Deskripsi Barang</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {item.description || "Peralatan organisasi yang siap digunakan. Terverifikasi aman dan dikelola menggunakan sistem keamanan Admin Sarpras EventLoop."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <span className="text-gray-500 text-[10px] font-bold uppercase block mb-0.5">Dimensi / Ukuran</span>
              <strong className="text-gray-900 text-xs">{item.size || 'Standar (Default)'}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] font-bold uppercase block mb-0.5">Material Utama</span>
              <strong className="text-gray-900 text-xs">{item.material || 'Aluminium / Campuran'}</strong>
            </div>
            <div className="col-span-2 pt-3 border-t border-gray-200">
              <span className="text-gray-500 text-[10px] font-bold uppercase block mb-0.5">Pemilik Hak Guna / Organisasi</span>
              <strong className="text-gray-900 text-xs flex items-center gap-1.5 mt-1">
                <Building className="w-4 h-4 text-gray-400" />
                {item.owner}
              </strong>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              Riwayat Sirkular & Penggunaan
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="px-4 py-3">Tanggal / Waktu</th>
                    <th className="px-4 py-3">Event / Kegiatan</th>
                    <th className="px-4 py-3">Kondisi Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {item.history && item.history.length > 0 ? (
                    item.history.map((hist, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-4 py-3 text-gray-500 font-mono text-[10px] whitespace-nowrap">
                          {hist.date}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {hist.event}
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Oleh: {hist.org}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            hist.condition === 'Excellent' ? 'bg-green-100 text-green-700' :
                            hist.condition === 'Good' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {hist.condition || 'Terverifikasi'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white">
                      <td colSpan="3" className="px-4 py-6 text-center text-gray-400 text-xs">
                        Belum ada riwayat tercatat. Jadilah yang pertama menyewa!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              disabled={item.available <= 0 && !isReserved}
              onClick={toggleReserve}
              className={`w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                isReserved
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : item.available <= 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {isReserved ? 'Hapus dari Reservasi' : item.available <= 0 ? 'Stok Habis Saat Ini' : 'Tambahkan ke Reservasi Saya'}
            </button>
            {isReserved && (
              <Link to="/reservation" className="block text-center mt-3 text-xs font-bold text-green-700 hover:underline">
                Buka Halaman Pembayaran & Reservasi →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}