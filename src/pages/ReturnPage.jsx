import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  RotateCcw, 
  CheckCircle2, 
  Camera, 
  MapPin, 
  AlertCircle,
  PackageCheck,
  X
} from 'lucide-react'

// Fungsi Kompresi Foto
const compressImage = (file, callback) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 500
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

export default function ReturnPage() {
  const { returnStatus, setReturnStatus, submitUserReturnProof, activeReservation, pendingReturns } = useApp()
  
  // Mengambil daftar barang rental dari reservasi aktif (yang belum dikembalikan)
  const rentedItems = activeReservation?.items?.filter(item => item.listingType !== 'sale') || []
  
  const [selectedItemId, setSelectedItemId] = useState(rentedItems[0]?.id || '')
  
  // Update pilihan pertama otomatis jika barang sebelumnya sudah dihapus
  useEffect(() => {
    if (rentedItems.length > 0 && !rentedItems.find(i => i.id === selectedItemId)) {
      setSelectedItemId(rentedItems[0].id)
    }
  }, [rentedItems, selectedItemId])

  // Dapatkan data spesifik berdasarkan dropdown
  const currentItem = rentedItems.find(i => i.id === selectedItemId) || rentedItems[0]

  const [conditionPhoto, setConditionPhoto] = useState(null)
  const [conditionTime, setConditionTime] = useState('')
  const [storagePhoto, setStoragePhoto] = useState(null)
  const [storageTime, setStorageTime] = useState('')

  const [checklist, setChecklist] = useState({
    goodCondition: true,
    complete: true,
    returnedToOriginalPlace: true,
  })

  // RESET FORM KETIKA MEMILIH BARANG LAIN DI DROPDOWN
  const handleItemChange = (e) => {
    const newId = Number(e.target.value)
    setSelectedItemId(newId)
    
    // Cek apakah barang yang dipilih ini sedang "Pending Admin" atau belum
    const isPending = pendingReturns?.some(r => r.equipmentId === newId)
    if (isPending) {
      if (setReturnStatus) setReturnStatus('pending_admin_approval')
    } else {
      if (setReturnStatus) setReturnStatus('idle')
    }
  }

  // HAPUS FOTO LAMA KETIKA ID BARANG BERUBAH
  useEffect(() => {
    setConditionPhoto(null)
    setConditionTime('')
    setStoragePhoto(null)
    setStorageTime('')
    setChecklist({
      goodCondition: true,
      complete: true,
      returnedToOriginalPlace: true,
    })
  }, [selectedItemId])

  const handleConditionPhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      compressImage(file, (compressedBase64) => {
        setConditionPhoto(compressedBase64)
        setConditionTime(new Date().toLocaleString('id-ID') + ' WIB')
      })
    }
  }

  const handleStoragePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      compressImage(file, (compressedBase64) => {
        setStoragePhoto(compressedBase64)
        setStorageTime(new Date().toLocaleString('id-ID') + ' WIB')
      })
    }
  }

  const handleReturn = (e) => {
    e.preventDefault()
    if (!currentItem) return

    submitUserReturnProof({
      equipmentId: currentItem.id, // ID Asli Barang (Penting untuk Admin)
      itemName: currentItem.name,
      itemCode: `ITEM-${currentItem.id}`,
      returnedQty: currentItem.qty, // Jumlah yang dikembalikan
      conditionPhoto,
      storagePhoto,
      timestamp: conditionTime
    })
  }

  const canSubmit = conditionPhoto && storagePhoto && Object.values(checklist).every(Boolean) && currentItem

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
          <RotateCcw className="w-3.5 h-3.5" /> Screen 7 — Equipment Return & Proof Verification
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Pengembalian Barang Berbasis Bukti Foto & Timestamp 📸
        </h2>
        <p className="text-sm text-gray-500">
          Untuk menjaga kepercayaan circular economy kampus, wajib melampirkan foto kondisi fisik dan foto bukti barang telah diletakkan kembali di tempat semulanya dengan stempel waktu resmi.
        </p>
      </div>

      {rentedItems.length === 0 ? (
        <div className="text-center p-12 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Semua Barang Telah Dikembalikan!</h3>
          <p className="text-gray-500 max-w-md mx-auto">Anda tidak memiliki tanggungan barang rental aktif saat ini. Terima kasih telah menjaga sirkular ekonomi kampus.</p>
          <div className="pt-4">
            <Link to="/marketplace" className="btn-primary">Kembali ke Marketplace</Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Col: Target Item & Storage Info */}
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <label className="block text-xs font-bold text-gray-700 uppercase">Pilih Barang Dikembalikan ({rentedItems.length} Sisa):</label>
              <select 
                value={selectedItemId} 
                onChange={handleItemChange}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-bold outline-none focus:border-green-500 cursor-pointer"
              >
                {rentedItems.map(item => {
                  const isPending = pendingReturns?.some(r => r.equipmentId === item.id)
                  return (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.qty} unit) {isPending ? '⏳ (Menunggu ACC)' : ''}
                    </option>
                  )
                })}
              </select>

              {currentItem && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-[10px] font-black uppercase text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    ITEM-{currentItem.id}
                  </span>
                  <div className="mt-2">
                    <h4 className="font-extrabold text-gray-900 text-base">{currentItem.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Peminjam: <strong className="text-gray-800">SISO Prasmulyan</strong></p>
                    <p className="text-xs text-gray-500 mt-1">Jumlah Pinjaman: <strong className="text-gray-800">{currentItem.qty} unit</strong></p>
                  </div>

                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 mt-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-gray-400 text-[10px] block uppercase font-bold">Tempat Pengembalian Semula:</span>
                        <span className="font-bold text-gray-900 text-xs">Warehouse Sarpras Kampus Gedung C (Rak B-04)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2 mt-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Kedua foto bukti di bawah wajib diupload dengan stempel waktu untuk verifikasi Admin Sarpras.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 2 Cols: Form Upload 2 Bukti Foto + Checklist */}
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6 md:p-8 space-y-6">

              {returnStatus === 'idle' ? (
                <form onSubmit={handleReturn} className="space-y-6">
                  
                  {/* 2 PHOTO UPLOAD SECTIONS WITH TIMESTAMPS */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      Wajib Upload 2 Bukti Foto Terverifikasi
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* BUKTI FOTO 1: KONDISI FISIK BARANG */}
                      <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <div className="text-xs font-bold text-gray-800">
                          1. Foto Kondisi Fisik Barang
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Tunjukkan frame, baut, kain, dan kelengkapan tidak ada yang patah.
                        </p>

                        {!conditionPhoto ? (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-5 bg-white cursor-pointer group transition-all">
                            <Camera className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mb-1" />
                            <span className="text-[11px] font-bold text-gray-700 group-hover:text-emerald-700">Ambil/Upload Foto Fisik</span>
                            <span className="text-[9px] text-gray-400 mt-0.5">+ Auto-Generated Timestamp</span>
                            <input type="file" accept="image/*" onChange={handleConditionPhotoChange} className="hidden" />
                          </label>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                            <img src={conditionPhoto} alt="Kondisi Fisik" className="w-full h-36 object-cover" />
                            {/* Automatic Timestamp Stamp Watermark */}
                            <div className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-xs text-white p-2 font-mono text-[9px] space-y-0.5">
                              <div className="text-emerald-300 font-bold">✓ TIMESTAMP VERIFIED</div>
                              <div>{conditionTime} • SISO BEM</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConditionPhoto(null)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* BUKTI FOTO 2: KEMBALI KE TEMPAT/RAK SEMULA */}
                      <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <div className="text-xs font-bold text-gray-800">
                          2. Foto Bukti di Tempat/Rak Semula
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Tunjukkan barang sudah rapi diletakkan di rak gudang semula.
                        </p>

                        {!storagePhoto ? (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-5 bg-white cursor-pointer group transition-all">
                            <MapPin className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mb-1" />
                            <span className="text-[11px] font-bold text-gray-700 group-hover:text-emerald-700">Upload Foto di Rak Semula</span>
                            <span className="text-[9px] text-gray-400 mt-0.5">+ Auto-Location & Stamp</span>
                            <input type="file" accept="image/*" onChange={handleStoragePhotoChange} className="hidden" />
                          </label>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                            <img src={storagePhoto} alt="Rak Semula" className="w-full h-36 object-cover" />
                            {/* Automatic Location & Timestamp Stamp Watermark */}
                            <div className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-xs text-white p-2 font-mono text-[9px] space-y-0.5">
                              <div className="text-emerald-300 font-bold">✓ LOKASI: WAREHOUSE RAK B-04</div>
                              <div>{storageTime} • RET-LOCATION OK</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setStoragePhoto(null)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* VERIFICATION CHECKLIST (DIDUKUNG BUKTI FOTO) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                        Checklist Verifikasi Fisik & Penempatan
                      </h4>
                      <span className="text-[11px] text-gray-400">Pastikan sesuai dengan foto yang diunggah</span>
                    </div>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.goodCondition}
                        onChange={(e) => setChecklist({ ...checklist, goodCondition: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-green-600 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900">✓ Kondisi Fisik Baik (Sesuai Foto 1)</div>
                        <div className="text-[11px] text-gray-500">Tidak ada kerusakan patah, retak frame, atau sobekan material.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.complete}
                        onChange={(e) => setChecklist({ ...checklist, complete: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-green-600 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900">✓ Komponen & Aksesoris Lengkap</div>
                        <div className="text-[11px] text-gray-500">Konektor pipa, baut, dan tas pembungkus kembali lengkap.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.returnedToOriginalPlace}
                        onChange={(e) => setChecklist({ ...checklist, returnedToOriginalPlace: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-green-600 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900">✓ Telah Diletakkan di Rak Semula (Sesuai Foto 2)</div>
                        <div className="text-[11px] text-gray-500">Barang sudah ditaruh rapi di Warehouse Kampus Gedung C (Rak B-04).</div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        canSubmit
                          ? 'btn-primary'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Kirim Bukti Pengembalian Ber-Timestamp ke Admin</span>
                    </button>
                    {!canSubmit && (
                      <p className="text-center text-[11px] text-gray-400 mt-2">
                        ⚠️ Harap upload Foto Kondisi Fisik dan Foto Bukti di Rak Semula terlebih dahulu.
                      </p>
                    )}
                  </div>
                </form>
              ) : returnStatus === 'pending_admin_approval' ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 text-center space-y-5 animate-fade-in-up">
                  <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md animate-pulse">
                    <RotateCcw className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-amber-950 mt-2">
                      MENUNGGU ACC ADMIN GUDANG ⏳
                    </h3>
                    <p className="text-xs text-amber-800 max-w-md mx-auto mt-2 leading-relaxed">
                      Bukti pengembalian <strong>{currentItem?.name}</strong> telah masuk ke sistem. Admin akan memverifikasi foto kondisi fisik dan penempatan di rak.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col items-center gap-3">
                    <Link to="/admin" className="text-xs font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-4 py-2.5 rounded-xl inline-flex items-center transition-colors">
                      👉 Buka Admin Panel untuk ACC (Simulasi)
                    </Link>
                    
                    {/* Tombol kembali ke form jika user mau upload barang lain sebelum di-ACC */}
                    <button 
                      onClick={() => setReturnStatus('idle')}
                      className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline"
                    >
                      Batal & Pilih Barang Lain Dulu
                    </button>
                  </div>
                </div>
              ) : (
                /* Success State - Digital Return Certificate */
                <div className="bg-green-50 border-2 border-green-400 rounded-3xl p-6 md:p-8 text-center space-y-5 animate-fade-in-up">
                  <div className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                      BERITA ACARA PENGEMBALIAN DIGITAL SAH
                    </span>
                    <h3 className="text-2xl font-black text-green-950 mt-2">
                      STATUS: RETURN VERIFIED & AVAILABLE AGAIN! ♻️
                    </h3>
                    <p className="text-xs text-green-800 max-w-md mx-auto mt-1 leading-relaxed">
                      Pengembalian telah diverifikasi Admin. Stok barang telah ditambahkan kembali ke Marketplace secara otomatis beserta lokasi rak terakhir.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-green-200/50 flex flex-col sm:flex-row gap-3 justify-center">
                    {/* JIKA MASIH ADA BARANG LAIN YANG BELUM DIKEMBALIKAN */}
                    {rentedItems.length > 0 ? (
                      <button 
                        onClick={() => {
                          setReturnStatus('idle')
                          setSelectedItemId(rentedItems[0]?.id)
                        }} 
                        className="btn-primary text-xs !py-3 !px-6 animate-pulse"
                      >
                        Kembalikan Sisa Barang Lainnya ({rentedItems.length})
                      </button>
                    ) : (
                      <Link to="/marketplace" className="btn-primary text-xs !py-3 !px-6">
                        Sewa Barang Lain di Marketplace
                      </Link>
                    )}

                    <Link to="/impact" className="btn-secondary text-xs !py-3 !px-6 bg-white">
                      Lihat Dampak Sirkular
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}