import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Building,
  Image as ImageIcon,
  History,
  ShieldCheck,
  Lock
} from 'lucide-react'

export default function EquipmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { equipments, cartItems, addToCart, removeFromCart, userPaymentStatus, currentUserRole } = useApp()

  const item = equipments.find(eq => eq.id.toString() === id)
  const isLockedByActivePayment = currentUserRole === 'user' && userPaymentStatus !== 'idle'
  
  if (!item) {
    return (
      <div className="text-center p-12 space-y-4">
        <h2 className="text-xl font-bold text-[#2C332E]">Barang Tidak Ditemukan</h2>
        <p className="text-sm text-[#6E7871]">Barang mungkin telah dihapus dari katalog.</p>
        <button onClick={() => navigate('/marketplace')} className="btn-primary text-xs">Kembali ke Marketplace</button>
      </div>
    )
  }

  const isReserved = cartItems.some(cartItem => cartItem.id === item.id)

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
      {/* Header Breadcrumb */}
      <button 
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-2 text-xs font-medium text-[#6E7871] hover:text-[#2C332E] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* KOLOM KIRI: Gambar Utama & Box Lokasi Gudang */}
        <div className="space-y-5">
          <div className="bg-[#F3F1EA] aspect-square rounded-2xl flex items-center justify-center border border-[#E8E6DF] overflow-hidden relative">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl opacity-80">{item.image}</span>
            )}
            <div className="absolute top-3.5 left-3.5 bg-[#FAF9F5]/90 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-medium text-[#5C645E] border border-[#E8E6DF]">
              {item.category}
            </div>
          </div>

          {/* BOX INFO LOKASI GUDANG & FOTO RAK TERAKHIR */}
          <div className="card p-5 space-y-4">
            <h4 className="font-semibold text-[#2C332E] text-sm flex items-center gap-2 border-b border-[#ECEAE3] pb-3">
              <MapPin className="w-4 h-4 text-[#3A6351]" />
              Lokasi Pengambilan & Pengembalian Asal
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF]">
                <span className="text-[10px] text-[#8A938C] block">Lokasi Simpan</span>
                <span className="text-xs font-semibold text-[#2C332E] block truncate mt-0.5" title={item.lastLocation}>
                  {item.lastLocation || 'Warehouse Kampus Gedung C'}
                </span>
              </div>
              <div className="p-3 bg-[#EAF0EC] rounded-xl border border-[#DCE5DF]">
                <span className="text-[10px] text-[#4B6B5C] block">Kondisi Fisik</span>
                <span className="text-xs font-semibold text-[#264738] block mt-0.5">
                  {item.condition || 'Good / Siap Pakai'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#6E7871] bg-[#F6F5F0] p-3 rounded-xl border border-[#E8E6DF] leading-relaxed">
              Barang ini diambil dan wajib dikembalikan ke <strong className="text-[#2C332E]">{item.lastLocation || 'Warehouse Kampus Gedung C'}</strong> setelah kegiatan selesai.
            </p>

            {/* FOTO RAK PENYIMPANAN TERAKHIR */}
            <div>
              <span className="text-[11px] text-[#8A938C] font-medium block mb-2">Foto Lokasi Penyimpanan Terakhir</span>
              {item.lastStoragePhoto ? (
                <div className="h-36 rounded-xl overflow-hidden border border-[#E8E6DF] relative">
                  <img src={item.lastStoragePhoto} alt="Rak Terakhir" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-24 rounded-xl border border-dashed border-[#D5D1C8] flex flex-col items-center justify-center text-[#8A938C] bg-[#F6F5F0]">
                  <ImageIcon className="w-5 h-5 mb-1 opacity-60" />
                  <span className="text-[11px]">Foto lokasi rak belum dilampirkan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Detail & Riwayat */}
        <div className="space-y-5">
          <div className="card p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={item.listingType === 'sale' ? 'badge-warm' : 'badge-sage'}>
                  {item.listingType === 'sale' ? 'Beli Preloved' : 'Sewa Harian'}
                </span>
                <span className="text-xs text-[#6E7871]">
                  Tersedia {item.available} dari {item.total} unit
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-[#2C332E] tracking-tight leading-snug">
                {item.name}
              </h1>
              
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#3A6351]">
                  Rp{(item.listingType === 'sale' ? (item.salePrice || item.price * 5) : item.price).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-[#6E7871]">
                  {item.listingType === 'sale' ? '/ unit (beli lepas)' : '/ unit / hari'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#EAF0EC] rounded-xl border border-[#DCE5DF] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#264738] flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#3A6351]" />
                  Circular Score: {item.circularScore}/100
                </div>
                <div className="text-[11px] text-[#4B6B5C] mt-0.5">Indikator pemakaian berulang & ramah lingkungan.</div>
              </div>
              <div className="text-center border-l border-[#C5D6CD] pl-4">
                <div className="text-[10px] text-[#4B6B5C]">Daya Tahan</div>
                <div className="font-bold text-[#264738] text-sm">{item.maxReuse}x pakai</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#2C332E] text-xs">Deskripsi Perlengkapan</h3>
              <p className="text-xs text-[#5C645E] leading-relaxed">
                {item.description || 'Peralatan kegiatan kampus yang siap digunakan dan terverifikasi oleh pengelola EventLoop.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F6F5F0] p-4 rounded-xl border border-[#E8E6DF]">
              <div>
                <span className="text-[#8A938C] text-[10px] block">Dimensi / Ukuran</span>
                <strong className="text-[#2C332E]">{item.size || 'Standar'}</strong>
              </div>
              <div>
                <span className="text-[#8A938C] text-[10px] block">Material Utama</span>
                <strong className="text-[#2C332E]">{item.material || 'Aluminium / Campuran'}</strong>
              </div>
              <div className="col-span-2 pt-2.5 border-t border-[#ECEAE3]">
                <span className="text-[#8A938C] text-[10px] block">Pemilik Inventaris</span>
                <strong className="text-[#2C332E] flex items-center gap-1.5 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-[#8A938C]" />
                  {item.owner}
                </strong>
              </div>
            </div>

            {currentUserRole === 'user' && (
              <div className="pt-2">
                {isLockedByActivePayment ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 bg-[#EFECE6] text-[#8A938C] cursor-not-allowed border border-[#E8E6DF]"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Reservasi Terkunci (Event Aktif Sedang Berjalan)</span>
                    </button>
                    <Link to="/reservation" className="block text-center text-xs font-medium text-[#3A6351] hover:underline">
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
                          ? 'bg-[#EAF0EC] text-[#264738] border border-[#C5D6CD]'
                          : item.available <= 0 
                          ? 'bg-[#EFECE6] text-[#8A938C] cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      {isReserved ? '✓ Di Keranjang (Klik untuk Batal)' : item.available <= 0 ? 'Stok Habis' : '+ Tambah ke Reservasi'}
                    </button>
                    {isReserved && (
                      <Link to="/reservation" className="block text-center mt-2.5 text-xs font-medium text-[#3A6351] hover:underline">
                        Lanjut ke Halaman Reservasi →
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Riwayat Penggunaan */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-[#2C332E] text-xs flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-[#8A938C]" />
              Riwayat Pemakaian Sirkular
            </h3>
            <div className="border border-[#ECEAE3] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F5F0] border-b border-[#ECEAE3] text-[#8A938C] text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium">Tanggal</th>
                    <th className="px-3.5 py-2.5 font-medium">Kegiatan</th>
                    <th className="px-3.5 py-2.5 font-medium">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEAE3]">
                  {item.history && item.history.length > 0 ? (
                    item.history.map((hist, idx) => (
                      <tr key={idx}>
                        <td className="px-3.5 py-2.5 text-[#6E7871] text-[11px] whitespace-nowrap">
                          {hist.date}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-[#2C332E]">
                          {hist.event}
                          <div className="text-[10px] text-[#8A938C] font-normal">
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
                      <td colSpan="3" className="px-4 py-5 text-center text-[#8A938C] text-xs">
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
