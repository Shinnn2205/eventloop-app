import { useState } from 'react'
import { Link } from 'react-router-dom'
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const newId = uploadEquipmentByUser({
      name, category, qty, size, material, maxReuse, pricingType,
      price: pricingType === 'sale' ? parseInt(salePrice || 0) : parseInt(price || 0),
      salePrice: parseInt(salePrice || 0), bankInfo: bankAccount, condition, description, 
      imagePreview, circularScore,
      initialLocation, initialStoragePhoto: storagePhotoPreview,
      ownerOrg: 'Prasmulyan Organization',
      status: 'pending_approval'
    })
    setSubmittedUnitId(newId)
    setSubmitted(true)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="badge-sage mb-2">
            <Package className="w-3.5 h-3.5" /> Berbagi Inventaris Kampus
          </span>
          <h2 className="text-2xl font-bold text-[#2C332E] tracking-tight">
            Upload Perlengkapan Organisasi
          </h2>
          <p className="text-sm text-[#6E7871] max-w-2xl mt-1">
            Daftarkan perlengkapan beserta lokasi penyimpanannya agar dapat disewa atau dibeli oleh kepanitiaan lain.
          </p>
        </div>

        <Link to="/marketplace" className="btn-secondary text-xs !py-2.5 !px-4 self-start sm:self-auto">
          Lihat Marketplace
        </Link>
      </div>

      {!submitted ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 card p-6 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-[#5C645E] mb-1.5">
                  Nama Perlengkapan
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth. Standing Banner Frame, Sound Portable, Meja Lipat..."
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C645E] mb-1.5">
                  Foto Fisik Perlengkapan
                </label>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center border border-dashed border-[#D5D1C8] hover:border-[#3A6351] rounded-xl p-6 bg-[#F6F5F0] transition-colors cursor-pointer">
                    <Camera className="w-6 h-6 text-[#8A938C] mb-1.5" />
                    <span className="text-xs font-medium text-[#2C332E]">Pilih Foto Barang</span>
                    <span className="text-[11px] text-[#8A938C] mt-0.5">Format PNG, JPG, JPEG</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                ) : (
                  <div className="rounded-xl border border-[#E8E6DF] bg-[#F6F5F0] p-2.5 flex items-center gap-3">
                    <img src={imagePreview} alt="Item" className="w-16 h-16 object-cover rounded-lg border border-[#E8E6DF]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3A6351]"><CheckCircle className="w-3.5 h-3.5" /> Foto Terpilih</div>
                      <p className="text-[11px] text-[#6E7871] truncate mt-0.5">{imageFileName}</p>
                    </div>
                    <button type="button" onClick={() => setImagePreview(null)} className="p-1.5 text-[#8A938C] hover:text-[#2C332E] rounded-lg bg-[#FAF9F5]"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C645E] mb-1.5">Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="cozy-input">
                    <option value="Booth">Booth & Display</option>
                    <option value="Signage">Signage & Banner Frame</option>
                    <option value="Furniture">Furniture & Meja/Kursi</option>
                    <option value="Electronics">Electronics, Audio & Lighting</option>
                    <option value="Decoration">Decoration & Tanaman</option>
                    <option value="Others">Others / Reusable Cup / Alat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C645E] mb-1.5">Kondisi Fisik</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="cozy-input">
                    <option value="Excellent">Sangat Bagus / Seperti Baru</option>
                    <option value="Good">Bagus & Berfungsi Normal</option>
                    <option value="Fair">Layak Pakai</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C645E] mb-1.5">Jumlah Unit (Qty)</label>
                  <input type="number" min="1" required value={qty} onChange={(e) => setQty(e.target.value)} className="cozy-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C645E] mb-1.5">Dimensi / Ukuran</label>
                  <input type="text" required value={size} onChange={(e) => setSize(e.target.value)} className="cozy-input" />
                </div>
              </div>

              <div className="p-4 bg-[#EAF0EC]/60 rounded-xl border border-[#DCE5DF] space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#264738]">
                  <Star className="w-3.5 h-3.5 text-[#3A6351]" />
                  <span>Karakteristik Sirkular</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#5C645E] mb-1">Material Utama</label>
                    <select value={material} onChange={(e) => setMaterial(e.target.value)} className="cozy-input !bg-[#FAF9F5] !py-2 !text-xs">
                      <option value="Aluminium">Aluminium</option>
                      <option value="Steel Frame">Steel Frame</option>
                      <option value="Fabric / Polyester">Kain / Fabric Reusable</option>
                      <option value="Wood / Plywood">Kayu / Multiplex</option>
                      <option value="Plastic BPA-Free">Plastik Reusable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#5C645E] mb-1">Estimasi Daya Tahan</label>
                    <select value={maxReuse} onChange={(e) => setMaxReuse(e.target.value)} className="cozy-input !bg-[#FAF9F5] !py-2 !text-xs">
                      <option value="100">100+ Kali Pakai</option>
                      <option value="50">50+ Kali Pakai</option>
                      <option value="30">30+ Kali Pakai</option>
                      <option value="15">15+ Kali Pakai</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF] space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2C332E]">
                  <MapPin className="w-3.5 h-3.5 text-[#3A6351]" />
                  <span>Lokasi Pengambilan & Pengembalian Asal</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#5C645E] mb-1">Detail Lokasi Simpan (Gudang / Rak)</label>
                    <input 
                      type="text" 
                      required 
                      value={initialLocation} 
                      onChange={(e) => setInitialLocation(e.target.value)} 
                      placeholder="cth. Warehouse Kampus Gedung C (Rak A-01)"
                      className="cozy-input !bg-[#FAF9F5]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#5C645E] mb-1">Foto Lokasi / Rak Penyimpanan</label>
                    {!storagePhotoPreview ? (
                      <label className="flex items-center justify-center gap-2 border border-dashed border-[#D5D1C8] hover:border-[#3A6351] rounded-xl p-3.5 bg-[#FAF9F5] cursor-pointer transition-colors">
                        <MapPin className="w-4 h-4 text-[#8A938C]" />
                        <span className="text-xs font-medium text-[#5C645E]">Upload Foto Rak / Tempat Simpan</span>
                        <input type="file" accept="image/*" onChange={handleStoragePhotoChange} className="hidden" />
                      </label>
                    ) : (
                      <div className="rounded-xl border border-[#E8E6DF] bg-[#FAF9F5] p-2 flex items-center gap-3">
                        <img src={storagePhotoPreview} alt="Rak" className="w-14 h-14 object-cover rounded-lg border border-[#E8E6DF]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#3A6351]">✓ Foto Lokasi Tersimpan</p>
                          <p className="text-[11px] text-[#8A938C] truncate">{storageFileName}</p>
                        </div>
                        <button type="button" onClick={() => setStoragePhotoPreview(null)} className="p-1.5 text-[#8A938C] hover:text-[#2C332E]"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C645E] mb-2">Skema Transaksi</label>
                <div className="grid sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'rental', label: 'Disewakan Harian' },
                    { id: 'sale', label: 'Dijual Preloved' },
                    { id: 'free', label: 'Pinjam Gratis' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPricingType(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        pricingType === t.id
                          ? 'border-[#3A6351] bg-[#EAF0EC] text-[#264738] font-semibold'
                          : 'border-[#E8E6DF] bg-[#FAF9F5] hover:bg-[#F6F5F0] text-[#5C645E]'
                      }`}
                    >
                      <div className="text-xs flex items-center justify-between">
                        <span>{t.label}</span>
                        {pricingType === t.id && <CheckCircle className="w-3.5 h-3.5 text-[#3A6351]" />}
                      </div>
                    </button>
                  ))}
                </div>

                {pricingType === 'rental' && (
                  <div className="mt-3 p-4 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF] space-y-2">
                    <label className="block text-xs font-medium text-[#5C645E]">Tarif Sewa per Hari (Rp)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="cozy-input !bg-[#FAF9F5] max-w-xs" />
                  </div>
                )}
                {pricingType === 'sale' && (
                  <div className="mt-3 p-4 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF] space-y-2">
                    <label className="block text-xs font-medium text-[#5C645E]">Harga Jual Preloved (Rp)</label>
                    <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="cozy-input !bg-[#FAF9F5] max-w-xs" />
                  </div>
                )}

                {(pricingType === 'rental' || pricingType === 'sale') && (
                  <div className="mt-3 p-4 bg-[#EAF0EC]/60 rounded-xl border border-[#DCE5DF] space-y-2">
                    <label className="block text-xs font-medium text-[#264738] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#3A6351]" />
                      Rekening / E-Wallet Tujuan Payout
                    </label>
                    <input type="text" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="cozy-input !bg-[#FAF9F5]" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C645E] mb-1.5">Deskripsi & Catatan</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="cozy-input resize-none" />
              </div>

              <button type="submit" className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Kirim Pengajuan ke Admin</span>
              </button>
            </form>
          </div>

          {/* Right Preview Card */}
          <div className="hidden lg:block">
            <div className="card p-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#ECEAE3]">
                <span className="text-xs font-medium text-[#8A938C]">Pratinjau Katalog</span>
                <span className="badge-sage">Circular Score {circularScore}</span>
              </div>

              <div className="bg-[#F3F1EA] rounded-xl border border-[#E8E6DF] h-44 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl opacity-75">📦</span>
                )}
              </div>

              <div>
                <div className="text-[11px] font-medium text-[#6E7871]">{category} · {qty} unit</div>
                <h4 className="font-semibold text-[#2C332E] text-sm mt-0.5 leading-snug">{name}</h4>
              </div>

              <div className="pt-3 border-t border-[#ECEAE3] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8A938C] block">
                    {pricingType === 'rental' ? 'Tarif Sewa / Hari' : pricingType === 'sale' ? 'Harga Preloved' : 'Pinjam'}
                  </span>
                  <span className="text-base font-bold text-[#3A6351]">
                    {pricingType === 'rental' ? `Rp${parseInt(price || 0).toLocaleString('id-ID')}` : pricingType === 'sale' ? `Rp${parseInt(salePrice || 0).toLocaleString('id-ID')}` : 'Gratis'}
                  </span>
                </div>
                <span className="badge-stone">
                  <RefreshCw className="w-3 h-3" /> {maxReuse}x pakai
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Success State */
        <div className="card p-8 sm:p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-[#EAF0EC] text-[#3A6351] rounded-2xl flex items-center justify-center mx-auto border border-[#DCE5DF]">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#2C332E]">Pengajuan Berhasil Dikirim</h3>
            <p className="text-xs text-[#6E7871]">Menunggu Verifikasi Admin</p>
          </div>

          <p className="text-xs text-[#5C645E] leading-relaxed max-w-md mx-auto">
            Perlengkapan <strong>{name}</strong> telah masuk antrean verifikasi Admin sebelum ditayangkan di Marketplace.
          </p>

          <div className="p-4 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF] text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between"><span className="text-[#6E7871]">ID Pengajuan:</span> <strong className="text-[#2C332E]">#{submittedUnitId || 'APV-01'}</strong></div>
            <div className="flex justify-between"><span className="text-[#6E7871]">Lokasi Simpan:</span> <strong className="text-[#2C332E]">{initialLocation}</strong></div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[#6E7871]">Status:</span> 
              <span className="badge-warm">Pending Review</span>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link to="/my-equipment" className="btn-primary text-xs !py-2.5 !px-5 flex items-center justify-center gap-2">
              <span>Lihat Barang Saya</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={() => setSubmitted(false)} className="btn-secondary text-xs !py-2.5 !px-5 cursor-pointer">
              Upload Barang Lain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
