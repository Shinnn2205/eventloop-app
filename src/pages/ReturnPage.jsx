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
  X,
  ChevronRight,
  Info
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
  
  // Ambil item unik yang sedang aktif disewa (menghindari duplikasi data item yang menumpuk)
  const rawRentedItems = activeReservation?.items?.filter(item => item.listingType !== 'sale') || []
  const rentedItems = Array.from(new Set(rawRentedItems.map(i => i.id)))
    .map(id => rawRentedItems.find(i => i.id === id))
  
  const [selectedItemId, setSelectedItemId] = useState(rentedItems[0]?.id || '')
  
  useEffect(() => {
    if (rentedItems.length > 0 && !rentedItems.find(i => i.id === selectedItemId)) {
      setSelectedItemId(rentedItems[0].id)
    }
  }, [rentedItems, selectedItemId])

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

  const handleItemChange = (newId) => {
    setSelectedItemId(newId)
    
    const isPending = pendingReturns?.some(r => r.equipmentId === newId)
    if (isPending) {
      if (setReturnStatus) setReturnStatus('pending_admin_approval')
    } else {
      if (setReturnStatus) setReturnStatus('idle')
    }
  }

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
      equipmentId: currentItem.id,
      itemName: currentItem.name,
      itemCode: `ITEM-${currentItem.id}`,
      returnedQty: currentItem.qty || 1,
      conditionPhoto,
      storagePhoto,
      timestamp: conditionTime
    })
  }

  const canSubmit = conditionPhoto && storagePhoto && Object.values(checklist).every(Boolean) && currentItem

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10">
          <RotateCcw className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-700/50">
            <RotateCcw className="w-3.5 h-3.5" /> Portal Pengembalian Barang & Verifikasi Sliker
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pengembalian Perlengkapan Event ♻️
          </h2>
          <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
            Pastikan barang dikembalikan dalam kondisi bersih & lengkap ke rak semula di Warehouse Kampus Gedung C. Lampirkan 2 foto bukti ber-timestamp untuk verifikasi Admin Sarpras.
          </p>
        </div>
      </div>

      {rentedItems.length === 0 ? (
        <div className="text-center p-16 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900">Semua Barang Telah Dikembalikan!</h3>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            Anda tidak memiliki tanggungan barang rental aktif saat ini. Terima kasih telah menjaga sirkular ekonomi kampus tetap berkelanjutan.
          </p>
          <div className="pt-4">
            <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
              <span>Kembali ke Marketplace</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Left Column: Daftar Item dengan max-height dan scroll */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                  Daftar Barang Rental ({rentedItems.length})
                </h3>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                  Aktif Disewa
                </span>
              </div>

              {/* Kontainer dengan scroll vertikal agar tidak terlalu panjang ke bawah */}
              <div className="space-y-2 mt-2 max-h-[480px] overflow-y-auto pr-1">
                {rentedItems.map(item => {
                  const isSelected = item.id === selectedItemId
                  const isPending = pendingReturns?.some(r => r.equipmentId === item.id)

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemChange(item.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600/30' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                          <span>{item.qty || 1} Unit</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">Sewa Event</span>
                        </div>
                      </div>
                      {isPending && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded flex-shrink-0">
                          Pending
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {currentItem && (
                <div className="pt-4 border-t border-gray-100 space-y-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-700 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Lokasi Pengembalian:</span>
                    </div>
                    <p className="text-gray-600 pl-5 font-medium">Warehouse Kampus Gedung C <br/><strong className="text-gray-900">(Rak B-04)</strong></p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 2 Columns: Upload & Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Info Barang yang Dipilih */}
              {currentItem && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      ID: {currentItem.id}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 mt-1">{currentItem.name}</h3>
                  </div>
                  <div className="text-xs bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg self-start sm:self-auto">
                    Jumlah: {currentItem.qty || 1} Unit
                  </div>
                </div>
              )}

              {returnStatus === 'idle' ? (
                <form onSubmit={handleReturn} className="space-y-6">
                  
                  {/* UPLOAD FOTO BUKTI */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Upload 2 Bukti Foto Verifikasi</span>
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Foto 1 */}
                      <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/60 space-y-3">
                        <div className="text-xs font-bold text-gray-800">
                          1. Foto Kondisi Fisik Barang
                        </div>
                        <p className="text-[11px] text-gray-500 leading-normal">
                          Pastikan frame, baut, dan kain tidak ada yang rusak/patah.
                        </p>

                        {!conditionPhoto ? (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-6 bg-white cursor-pointer group transition-all">
                            <Camera className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mb-1.5" />
                            <span className="text-[11px] font-bold text-gray-700 group-hover:text-emerald-700">Ambil/Upload Foto Fisik</span>
                            <span className="text-[9px] text-gray-400 mt-0.5">+ Auto Timestamp</span>
                            <input type="file" accept="image/*" onChange={handleConditionPhotoChange} className="hidden" />
                          </label>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                            <img src={conditionPhoto} alt="Kondisi Fisik" className="w-full h-36 object-cover" />
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

                      {/* Foto 2 */}
                      <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/60 space-y-3">
                        <div className="text-xs font-bold text-gray-800">
                          2. Foto Bukti di Rak Semula
                        </div>
                        <p className="text-[11px] text-gray-500 leading-normal">
                          Tunjukkan barang sudah rapi diletakkan di rak gudang C.
                        </p>

                        {!storagePhoto ? (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-6 bg-white cursor-pointer group transition-all">
                            <MapPin className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mb-1.5" />
                            <span className="text-[11px] font-bold text-gray-700 group-hover:text-emerald-700">Upload Foto di Rak Semula</span>
                            <span className="text-[9px] text-gray-400 mt-0.5">+ Auto Location & Stamp</span>
                            <input type="file" accept="image/*" onChange={handleStoragePhotoChange} className="hidden" />
                          </label>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                            <img src={storagePhoto} alt="Rak Semula" className="w-full h-36 object-cover" />
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

                  {/* CHECKLIST */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                      Checklist Verifikasi Kondisi
                    </h4>

                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200/80 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.goodCondition}
                          onChange={(e) => setChecklist({ ...checklist, goodCondition: e.target.checked })}
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded"
                        />
                        <div>
                          <div className="text-xs font-bold text-gray-900">Kondisi Fisik Baik & Sesuai Foto</div>
                          <div className="text-[11px] text-gray-500">Tidak ada kerusakan berat, patah, atau cacat fungsi.</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200/80 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.complete}
                          onChange={(e) => setChecklist({ ...checklist, complete: e.target.checked })}
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded"
                        />
                        <div>
                          <div className="text-xs font-bold text-gray-900">Komponen & Kelengkapan Utuh</div>
                          <div className="text-[11px] text-gray-500">Seluruh aksesori, kabel, atau tas pembungkus dikembalikan lengkap.</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200/80 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.returnedToOriginalPlace}
                          onChange={(e) => setChecklist({ ...checklist, returnedToOriginalPlace: e.target.checked })}
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded"
                        />
                        <div>
                          <div className="text-xs font-bold text-gray-900">Sudah Diletakkan Kembali di Rak Semula</div>
                          <div className="text-[11px] text-gray-500">Diletakkan rapi di Warehouse Kampus Gedung C (Rak B-04).</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                        canSubmit
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Kirim Bukti Pengembalian ke Admin</span>
                    </button>
                    {!canSubmit && (
                      <p className="text-center text-[11px] text-gray-400 mt-2">
                        ⚠️ Lengkapi 2 foto bukti dan centang semua checklist di atas untuk melanjutkan.
                      </p>
                    )}
                  </div>
                </form>
              ) : returnStatus === 'pending_admin_approval' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm animate-pulse">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-amber-950">
                      Menunggu Verifikasi Admin Gudang ⏳
                    </h3>
                    <p className="text-xs text-amber-800 max-w-sm mx-auto mt-1 leading-relaxed">
                      Bukti pengembalian <strong>{currentItem?.name}</strong> sedang dicek oleh Admin Sarpras.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col items-center gap-2">
                    <Link to="/admin" className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-colors">
                      <span>Buka Panel Admin (Simulasi ACC)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <button 
                      onClick={() => setReturnStatus('idle')}
                      className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline pt-1"
                    >
                      Batal / Pilih Barang Lain
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                      Berita Acara Sah
                    </span>
                    <h3 className="text-xl font-black text-emerald-950 mt-2">
                      Pengembalian Berhasil Diverifikasi! ♻️
                    </h3>
                    <p className="text-xs text-emerald-800 max-w-sm mx-auto mt-1 leading-relaxed">
                      Stok barang telah otomatis dikembalikan ke Marketplace kampus.
                    </p>
                  </div>
                  <div className="pt-3 flex flex-wrap gap-2 justify-center">
                    {rentedItems.length > 0 ? (
                      <button 
                        onClick={() => {
                          setReturnStatus('idle')
                          setSelectedItemId(rentedItems[0]?.id)
                        }} 
                        className="btn-primary text-xs !py-2.5 !px-5"
                      >
                        Kembalikan Sisa Barang ({rentedItems.length})
                      </button>
                    ) : (
                      <Link to="/marketplace" className="btn-primary text-xs !py-2.5 !px-5">
                        Jelajahi Marketplace
                      </Link>
                    )}
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