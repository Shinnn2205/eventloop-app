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
  
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Signage')
  const [qty, setQty] = useState('1')
  const [size, setSize] = useState('')
  const [material, setMaterial] = useState('')
  const [maxReuse, setMaxReuse] = useState('30')
  const [pricingType, setPricingType] = useState('rental')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [bankAccount, setBankAccount] = useState(() => {
    const b = localStorage.getItem('eventloop_payout_bank')
    const a = localStorage.getItem('eventloop_payout_acc_number')
    const h = localStorage.getItem('eventloop_payout_acc_holder')
    if (b && a) return `${b} ${a} a.n ${h || ''}`.trim()
    return ''
  })
  const [condition, setCondition] = useState('Excellent')
  const [description, setDescription] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFileName, setImageFileName] = useState('')
  
  const [initialLocation, setInitialLocation] = useState('')
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
      salePrice: parseInt(salePrice || 0), bankInfo: bankAccount, condition, description, 
      imagePreview, circularScore,
      initialLocation, initialStoragePhoto: storagePhotoPreview,
      ownerOrg: appContext.currentUserName || 'Prasmulyan Organization',
      status: 'pending_approval'
    })
    setSubmittedUnitId(newId)
    setSubmitted(true)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="badge-sage mb-2">
            <Package className="w-3.5 h-3.5" /> Berbagi Inventaris Kampus
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Upload Perlengkapan Organisasi
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Daftarkan perlengkapan beserta lokasi penyimpanannya agar dapat disewa atau dibeli oleh kepanitiaan lain.
          </p>
        </div>

        <Link to="/marketplace" className="btn-secondary text-xs !py-2.5 !px-4 self-start sm:self-auto">
          Lihat Marketplace
        </Link>
      </div>

      {!submitted ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Foto Fisik Perlengkapan
                </label>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center border border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-6 bg-emerald-50/30 transition-colors cursor-pointer">
                    <Camera className="w-6 h-6 text-emerald-600 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">Pilih Foto Barang</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Format PNG, JPG, JPEG</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-2.5 flex items-center gap-3">
                    <img src={imagePreview} alt="Item" className="w-16 h-16 object-cover rounded-lg border border-emerald-100" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle className="w-3.5 h-3.5" /> Foto Terpilih</div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{imageFileName}</p>
                    </div>
                    <button type="button" onClick={() => setImagePreview(null)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg bg-white"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kondisi Fisik</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="cozy-input">
                    <option value="Excellent">Sangat Bagus / Seperti Baru</option>
                    <option value="Good">Bagus & Berfungsi Normal</option>
                    <option value="Fair">Layak Pakai</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jumlah Unit (Qty)</label>
                  <input type="number" min="1" required value={qty} onChange={(e) => setQty(e.target.value)} className="cozy-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dimensi / Ukuran</label>
                  <input type="text" required value={size} onChange={(e) => setSize(e.target.value)} className="cozy-input" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Material Utama</label>
                  <select value={material} onChange={(e) => setMaterial(e.target.value)} className="cozy-input">
                    <option value="Aluminium">Aluminium</option>
                    <option value="Steel Frame">Steel Frame</option>
                    <option value="Fabric / Polyester">Kain / Fabric Reusable</option>
                    <option value="Wood / Plywood">Kayu / Multiplex</option>
                    <option value="Plastic BPA-Free">Plastik Reusable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estimasi Daya Tahan</label>
                  <select value={maxReuse} onChange={(e) => setMaxReuse(e.target.value)} className="cozy-input">
                    <option value="100">100+ Kali Pakai</option>
                    <option value="50">50+ Kali Pakai</option>
                    <option value="30">30+ Kali Pakai</option>
                    <option value="15">15+ Kali Pakai</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Rak / Gudang Asal</label>
                  <input 
                    type="text" 
                    required 
                    value={initialLocation} 
                    onChange={(e) => setInitialLocation(e.target.value)} 
                    placeholder="cth. Warehouse Kampus Gedung C (Rak A-01)"
                    className="cozy-input" 
                  />
                </div>
                {!storagePhotoPreview ? (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-3 bg-slate-50/50 hover:bg-emerald-50/20 cursor-pointer transition-colors">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">Upload Foto Rak / Tempat Simpan (Opsional)</span>
                    <input type="file" accept="image/*" onChange={handleStoragePhotoChange} className="hidden" />
                  </label>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-white p-2 flex items-center gap-3">
                    <img src={storagePhotoPreview} alt="Rak" className="w-12 h-12 object-cover rounded-lg border border-emerald-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-700">✓ Foto Lokasi Tersimpan</p>
                      <p className="text-[11px] text-slate-400 truncate">{storageFileName}</p>
                    </div>
                    <button type="button" onClick={() => setStoragePhotoPreview(null)} className="p-1.5 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Skema Transaksi</label>
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
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-white hover:bg-emerald-50/40 text-slate-600'
                      }`}
                    >
                      <div className="text-xs flex items-center justify-between">
                        <span>{t.label}</span>
                        {pricingType === t.id && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    </button>
                  ))}
                </div>

                {pricingType === 'rental' && (
                  <div className="mt-3 p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Tarif Sewa per Hari (Rp)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="cozy-input !bg-white max-w-xs" />
                  </div>
                )}
                {pricingType === 'sale' && (
                  <div className="mt-3 p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Harga Jual Preloved (Rp)</label>
                    <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="cozy-input !bg-white max-w-xs" />
                  </div>
                )}

                {(pricingType === 'rental' || pricingType === 'sale') && (
                  <div className="mt-3 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                    <label className="block text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      Rekening / E-Wallet Tujuan Payout
                    </label>
                    <input type="text" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="cozy-input !bg-white" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi & Catatan</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="cozy-input resize-none" />
              </div>

              <button type="submit" className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Kirim Pengajuan ke Admin</span>
              </button>
            </form>
          </div>

          <div className="hidden lg:block">
            <div className="card p-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <span className="text-xs font-semibold text-slate-400">Pratinjau Katalog</span>
                <span className="badge-sage">Circular Score {circularScore}</span>
              </div>

              <div className="bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 rounded-xl border border-emerald-100 h-44 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl opacity-80">📦</span>
                )}
              </div>

              <div>
                <div className="text-[11px] font-medium text-emerald-700">{category} · {qty} unit</div>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">{name}</h4>
              </div>

              <div className="pt-3 border-t border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {pricingType === 'rental' ? 'Tarif Sewa / Hari' : pricingType === 'sale' ? 'Harga Preloved' : 'Pinjam'}
                  </span>
                  <span className="text-base font-bold text-emerald-700">
                    {pricingType === 'rental' ? `Rp${parseInt(price || 0).toLocaleString('id-ID')}` : pricingType === 'sale' ? `Rp${parseInt(salePrice || 0).toLocaleString('id-ID')}` : 'Gratis'}
                  </span>
                </div>
                <span className="badge-sage">
                  <RefreshCw className="w-3 h-3" /> {maxReuse}x pakai
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 sm:p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Pengajuan Berhasil Dikirim 🌿</h3>
            <p className="text-xs text-slate-500">Menunggu Verifikasi Admin</p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            Perlengkapan <strong>{name}</strong> telah masuk antrean verifikasi Admin sebelum ditayangkan di Marketplace.
          </p>

          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between"><span className="text-slate-500">ID Pengajuan:</span> <strong className="text-slate-900">#{submittedUnitId || 'APV-01'}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Lokasi Simpan:</span> <strong className="text-slate-900">{initialLocation}</strong></div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Status:</span> 
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
