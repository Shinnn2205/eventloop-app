import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Package, 
  Star, 
  RefreshCw, 
  CheckCircle, 
  Upload, 
  ArrowRight,
  Building,
  Camera,
  MapPin,
  X
} from 'lucide-react'

// Fungsi Kompresi Foto
const compressImage = (file, callback) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 400 
      const scaleSize = MAX_WIDTH / img.width
      canvas.width = MAX_WIDTH
      canvas.height = img.height * scaleSize
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      callback(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

export default function UploadEquipment() {
  const navigate = useNavigate()
  
  const appContext = useApp() || {}
  const uploadEquipmentByUser = appContext.uploadEquipmentByUser || (() => `APV-${Math.floor(Math.random() * 9999)}`)
  
  // Form State
  const [name, setName] = useState('Standing Banner Frame Aluminium')
  const [category, setCategory] = useState('Signage')
  const [qty, setQty] = useState('3')
  const [size, setSize] = useState('60 × 160 cm')
  const [material, setMaterial] = useState('Aluminium')
  const [maxReuse, setMaxReuse] = useState('50')
  const [pricingType, setPricingType] = useState('rental') // rental | sale | free
  const [price, setPrice] = useState('15000')
  const [salePrice, setSalePrice] = useState('120000')
  const [bankAccount, setBankAccount] = useState('BCA 8012345678 a.n BEM Prasmul')
  const [condition, setCondition] = useState('Excellent')
  const [description, setDescription] = useState('Frame banner milik BEM Prasmul yang sedang tidak terpakai semester ini. Cocok untuk display pintu masuk seminar / workshop.')
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFileName, setImageFileName] = useState('')
  
  // State Lokasi & Foto Tempat (Rak)
  const [initialLocation, setInitialLocation] = useState('Warehouse Kampus Gedung C (Rak A-01)')
  const [storagePhotoPreview, setStoragePhotoPreview] = useState(null)
  const [storageFileName, setStorageFileName] = useState('')

  const [submitted, setSubmitted] = useState(false)
  const [submittedUnitId, setSubmittedUnitId] = useState('')

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFileName(file.name)
      compressImage(file, (compressedBase64) => setImagePreview(compressedBase64))
    }
  }

  const handleStoragePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setStorageFileName(file.name)
      compressImage(file, (compressedBase64) => setStoragePhotoPreview(compressedBase64))
    }
  }

  const calculateCircularScore = () => {
    let score = 50 
    if (material.includes('Aluminium') || material.includes('Metal') || material.includes('Steel')) score += 20
    else if (material.includes('Fabric') || material.includes('Kain')) score += 18
    else if (material.includes('Wood') || material.includes('Kayu')) score += 14
    else if (material.includes('Plastic') || material.includes('PVC')) score += 5
    else score += 10

    const reuseNum = parseInt(maxReuse) || 20
    if (reuseNum >= 50) score += 20
    else if (reuseNum >= 30) score += 15
    else if (reuseNum >= 15) score += 10
    else score += 5

    if (condition === 'Excellent') score += 10
    else if (condition === 'Good') score += 7
    else score += 4

    return Math.min(score, 98)
  }

  const circularScore = calculateCircularScore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newId = await uploadEquipmentByUser({
      name, category, qty, size, material, maxReuse, pricingType,
      price: pricingType === 'sale' ? parseInt(salePrice || 0) : parseInt(price || 0),
      salePrice: parseInt(salePrice || 0), bankAccount, condition, description, 
      imagePreview, circularScore,
      initialLocation, initialStoragePhoto: storagePhotoPreview,
      ownerOrg: 'Prasmulyan Organization',
      status: 'pending_approval'
    })
    setSubmittedUnitId(newId)
    setSubmitted(true)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
            <Package className="w-3.5 h-3.5" /> Organization Inventory Sharing
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Upload Perlengkapan Organisasi
          </h2>
          <p className="text-sm text-gray-500 max-w-3xl mt-1">
            Daftarkan perlengkapan beserta detail lokasi penempatannya. <strong>Barang akan diverifikasi oleh Admin.</strong> Sistem menggunakan pembayaran terpusat (QRIS Admin) untuk keamanan.
          </p>
        </div>

        <Link to="/marketplace" className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
          <span>Lihat Katalog Marketplace</span>
        </Link>
      </div>

      {!submitted ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 card p-6 md:p-8 space-y-6 shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Perlengkapan / Equipment
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth. Standing Banner Frame, Sound Portable, Meja Lipat..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Foto Fisik Perlengkapan (Utama)
                </label>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-green-500 rounded-2xl p-6 bg-gray-50/60 hover:bg-green-50/30 transition-all cursor-pointer group">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-green-600 transition-all mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 group-hover:text-green-700">Upload Foto Barang</span>
                    <span className="text-[11px] text-gray-400 mt-1">Mendukung format PNG, JPG, JPEG</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2 flex items-center gap-4">
                    <img src={imagePreview} alt="Item" className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-green-700"><CheckCircle className="w-4 h-4" /> Foto Terpilih</div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{imageFileName}</p>
                    </div>
                    <button type="button" onClick={() => setImagePreview(null)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg bg-white"><X className="w-5 h-5" /></button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-green-500/20">
                    <option value="Booth">🏗️ Booth & Display</option>
                    <option value="Signage">🪧 Signage & Banner Frame</option>
                    <option value="Furniture">🪑 Furniture & Meja/Kursi</option>
                    <option value="Electronics">💡 Electronics, Audio & Lighting</option>
                    <option value="Decoration">🌿 Decoration & Tanaman</option>
                    <option value="Others">☕ Others / Reusable Cup / Alat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kondisi Fisik Saat Ini</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-green-500/20">
                    <option value="Excellent">Sangat Bagus / Seperti Baru</option>
                    <option value="Good">Bagus & Berfungsi Normal</option>
                    <option value="Fair">Layak Pakai (Ada baret wajar)</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Jumlah Unit (Qty)</label>
                  <input type="number" min="1" required value={qty} onChange={(e) => setQty(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Dimensi / Ukuran</label>
                  <input type="text" required value={size} onChange={(e) => setSize(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20" />
                </div>
              </div>

              <div className="p-4 bg-green-50/50 rounded-2xl border border-green-200/60 space-y-4 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-green-900">
                  <Star className="w-4 h-4 text-green-600" />
                  <span>Karakteristik Sirkular (Menentukan Circular Score)</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Material Utama</label>
                    <select value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium">
                      <option value="Aluminium">Aluminium (Mudah Daur Ulang)</option>
                      <option value="Steel Frame">Steel Frame (Sangat Kuat)</option>
                      <option value="Fabric / Polyester">Kain / Fabric Reusable</option>
                      <option value="Wood / Plywood">Kayu / Multiplex</option>
                      <option value="Plastic BPA-Free">Plastik Ramah Lingkungan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Estimasi Daya Tahan</label>
                    <select value={maxReuse} onChange={(e) => setMaxReuse(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium">
                      <option value="100">100+ Kali Penggunaan</option>
                      <option value="50">50+ Kali Penggunaan</option>
                      <option value="30">30+ Kali Penggunaan</option>
                      <option value="15">15+ Kali Penggunaan</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200/60 space-y-4 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Informasi Lokasi & Penyimpanan Awal Gudang</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Lokasi Penempatan Saat Ini (Gudang/Rak)</label>
                    <input 
                      type="text" 
                      required 
                      value={initialLocation} 
                      onChange={(e) => setInitialLocation(e.target.value)} 
                      placeholder="cth. Warehouse Kampus Gedung C (Rak A-01)"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Upload Foto Tempat/Rak Barang Ditaruh</label>
                    {!storagePhotoPreview ? (
                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-4 bg-white cursor-pointer group transition-all">
                        <MapPin className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        <span className="text-xs font-bold text-gray-600 group-hover:text-blue-700">Pilih Foto Rak Terkini</span>
                        <input type="file" accept="image/*" onChange={handleStoragePhotoChange} className="hidden" />
                      </label>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-2 flex items-center gap-3">
                        <img src={storagePhotoPreview} alt="Rak" className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-blue-700">✓ Foto Rak Tersimpan</p>
                          <p className="text-[10px] text-gray-500 truncate">{storageFileName}</p>
                        </div>
                        <button type="button" onClick={() => setStoragePhotoPreview(null)} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Skema Transaksi</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <button type="button" onClick={() => setPricingType('rental')} className={`p-3.5 rounded-xl border text-left transition-all ${pricingType === 'rental' ? 'border-green-500 bg-green-50/70 text-green-900 shadow-sm ring-1 ring-green-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>🔄 Disewakan</span>
                      {pricingType === 'rental' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                  </button>
                  <button type="button" onClick={() => setPricingType('sale')} className={`p-3.5 rounded-xl border text-left transition-all ${pricingType === 'sale' ? 'border-green-500 bg-green-50/70 text-green-900 shadow-sm ring-1 ring-green-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>🏷️ Dijual</span>
                      {pricingType === 'sale' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                  </button>
                  <button type="button" onClick={() => setPricingType('free')} className={`p-3.5 rounded-xl border text-left transition-all ${pricingType === 'free' ? 'border-green-500 bg-green-50/70 text-green-900 shadow-sm ring-1 ring-green-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>🤝 Pinjam Gratis</span>
                      {pricingType === 'free' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                  </button>
                </div>

                {pricingType === 'rental' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <label className="block text-[11px] font-bold text-gray-700">Tarif Sewa / Event (Rupiah)</label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900" />
                    </div>
                  </div>
                )}
                {pricingType === 'sale' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <label className="block text-[11px] font-bold text-gray-700">Harga Jual Preloved (Rupiah)</label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                      <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900" />
                    </div>
                  </div>
                )}

                {(pricingType === 'rental' || pricingType === 'sale') && (
                  <div className="mt-4 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <Building className="w-4 h-4 text-emerald-700" />
                      <span>Rekening Payout (Sistem Terpusat Admin)</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-900 uppercase mb-1">Rekening / E-Wallet Tujuan Payout</label>
                      <input type="text" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-gray-900" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Deskripsi & Catatan</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-green-500/20" />
              </div>

              <button type="submit" className="w-full btn-primary text-sm !py-3.5 flex items-center justify-center gap-2 shadow-md">
                <Upload className="w-5 h-5" />
                <span className="font-bold">Kirim Pengajuan ke Admin</span>
              </button>
            </form>
          </div>

          {/* Right Preview Card */}
          <div className="space-y-6 hidden lg:block">
            <div className="card p-6 space-y-4 sticky top-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-200/50">Marketplace</span>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl border border-gray-200 text-center relative overflow-hidden group">
                {imagePreview ? (
                  <div className="relative h-52 w-full bg-gray-900/5">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="p-8 h-52 flex items-center justify-center">
                    <span className="text-7xl inline-block drop-shadow-sm opacity-80">📦</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-green-100/95 backdrop-blur text-green-800 border border-green-300 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 text-green-600" />
                  <span>{circularScore}</span>
                  <span className="text-[10px] font-normal opacity-70">/100</span>
                </div>
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 border border-gray-200 shadow-sm">
                  Prasmulyan Inventory
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-green-700 uppercase tracking-wider">{category} • {qty} unit</div>
                <h4 className="font-extrabold text-gray-900 text-base mt-1 leading-snug">{name}</h4>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">
                    {pricingType === 'rental' ? 'Tarif Sewa / Event' : pricingType === 'sale' ? 'Harga Jual Permanen' : 'Status Transaksi'}
                  </span>
                  <span className="text-lg font-black text-gray-900 tracking-tight">
                    {pricingType === 'rental' ? `Rp${parseInt(price || 0).toLocaleString('id-ID')}` : pricingType === 'sale' ? `Rp${parseInt(salePrice || 0).toLocaleString('id-ID')}` : 'Gratis'}
                  </span>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 shadow-sm">
                  {pricingType === 'sale' ? '🏷️ Preloved' : `♻️ Reusable ${maxReuse}x`}
                </span>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-200/70 text-xs text-green-800 space-y-1.5 shadow-inner">
                <div className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-green-900">
                  <RefreshCw className="w-3.5 h-3.5" /> Circular Score: {circularScore}/100
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Success State */
        <div className="card p-8 md:p-12 text-center max-w-2xl mx-auto space-y-5 animate-fade-in-up border border-gray-100 shadow-lg">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-amber-100">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-gray-900">Pengajuan Berhasil Dikirim! ⏳</h3>
            <p className="text-sm text-gray-500 font-medium">Menunggu Verifikasi & Persetujuan Admin</p>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            Barang <strong>{name}</strong> telah masuk antrean. Admin Sarpras akan memeriksa kesesuaian foto & fisik sebelum menampilkannya di Marketplace.
          </p>

          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-left max-w-md mx-auto space-y-3 shadow-inner">
            <div className="font-mono space-y-2 text-[11px] text-gray-700">
              <div className="flex justify-between"><span>📦 ID Pengajuan:</span> <strong className="text-gray-900">#{submittedUnitId || 'APV-PRASMUL-991'}</strong></div>
              <div className="flex justify-between">
                <span>🏷️ Skema & Tarif:</span> 
                <strong className="text-gray-900">{pricingType === 'rental' ? `Sewa (Rp${parseInt(price).toLocaleString('id-ID')})` : pricingType === 'sale' ? `Jual (Rp${parseInt(salePrice).toLocaleString('id-ID')})` : 'Gratis'}</strong>
              </div>
              {pricingType !== 'free' && <div className="flex justify-between"><span>🏦 Rekening Payout:</span> <strong className="text-gray-900">{bankAccount}</strong></div>}
              <div className="flex justify-between items-center pt-1">
                <span>⏳ Status Saat Ini:</span> 
                <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md font-bold text-[10px] border border-amber-200 shadow-sm">PENDING APPROVAL</span>
              </div>
            </div>
          </div>

          <div className="pt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/marketplace" className="btn-primary text-xs !py-3.5 !px-6 flex items-center justify-center gap-2 shadow-md">
              <span>Buka Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={() => setSubmitted(false)} className="btn-secondary text-xs !py-3.5 !px-6">
              Upload Barang Lain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}