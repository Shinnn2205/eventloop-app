import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  RotateCcw, 
  CheckCircle2, 
  Camera, 
  MapPin, 
  AlertCircle,
  Clock,
  PlusCircle,
  ClipboardList
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
  const navigate = useNavigate()
  const { 
    returnStatus, 
    setReturnStatus, 
    submitUserReturnProof, 
    activeReservation, 
    pendingReturns, 
    currentUserName,
    userPaymentStatus,
    clearActiveEvent
  } = useApp()
  
  // Mengambil daftar barang rental dari reservasi aktif (yang belum dikembalikan)
  const rentedItems = activeReservation?.items?.filter(item => item.listingType !== 'sale') || []
  const hasActiveEvent = Boolean(activeReservation?.eventName)
  
  const [selectedItemId, setSelectedItemId] = useState(rentedItems[0]?.id || '')
  
  // Update pilihan pertama otomatis jika barang sebelumnya sudah dihapus/dikembalikan
  useEffect(() => {
    if (rentedItems.length > 0 && !rentedItems.find(i => i.id === selectedItemId)) {
      setSelectedItemId(rentedItems[0].id)
    }
  }, [rentedItems, selectedItemId])

  // Dapatkan data spesifik berdasarkan item yang dipilih
  const currentItem = rentedItems.find(i => i.id === selectedItemId) || rentedItems[0]
  const currentOriginLocation = currentItem?.lastLocation || currentItem?.initialLocation || 'Warehouse Kampus Gedung C (Rak B-04)'

  const [conditionPhoto, setConditionPhoto] = useState(null)
  const [conditionTime, setConditionTime] = useState('')
  const [storagePhoto, setStoragePhoto] = useState(null)
  const [storageTime, setStorageTime] = useState('')

  const [checklist, setChecklist] = useState({
    goodCondition: true,
    complete: true,
    returnedToOriginalPlace: true,
  })

  const selectItem = (newId) => {
    setSelectedItemId(newId)
    const isPending = pendingReturns?.some(r => r.equipmentId === newId)
    if (isPending) {
      if (setReturnStatus) setReturnStatus('pending_admin_approval')
    } else {
      if (setReturnStatus) setReturnStatus('idle')
    }
  }

  const handleItemChange = (e) => {
    selectItem(Number(e.target.value))
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
      equipmentId: currentItem.id,
      itemName: currentItem.name,
      itemCode: `ITEM-${currentItem.id}`,
      returnedQty: currentItem.qty || 1,
      returnLocation: currentOriginLocation,
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
          <RotateCcw className="w-3.5 h-3.5" /> Pengembalian & Verifikasi Lokasi Asal
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Pengembalian Barang Sesuai Tempat Pengambilan 📸
        </h2>
        <p className="text-sm text-gray-500">
          Setiap barang wajib dikembalikan ke lokasi tempat barang tersebut diambil dengan melampirkan bukti foto kondisi fisik dan foto penempatan kembali ber-timestamp.
        </p>
      </div>

      {/* KONDISI 1: PEMBAYARAN MASIH MENUNGGU VERIFIKASI ADMIN */}
      {userPaymentStatus === 'pending_admin_approval' ? (
        <div className="text-center p-10 bg-amber-50/70 border-2 border-amber-300 rounded-3xl shadow-2xs space-y-4">
          <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-amber-950">Pembayaran Reservasi Sedang Diverifikasi Admin</h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
            Anda telah memesan <strong>{rentedItems.length} jenis barang sewa</strong> untuk event <strong>{activeReservation?.eventName}</strong>. Formulir pengembalian akan otomatis terbuka setelah Admin menyetujui pembayaran QRIS Anda.
          </p>
          <div className="pt-2">
            <Link to="/reservation" className="btn-primary text-xs !py-2.5 !px-5 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700">
              <ClipboardList className="w-4 h-4" />
              <span>Lihat Status Reservasi Saya</span>
            </Link>
          </div>
        </div>
      ) : rentedItems.length === 0 ? (
        /* KONDISI 2: TIDAK ADA TANGGUNGAN BARANG / SEMUA SUDAH DIKEMBALIKAN */
        <div className="text-center p-12 bg-white border border-gray-200 rounded-3xl shadow-2xs space-y-4">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {hasActiveEvent ? 'Seluruh Barang Event Telah Dikembalikan! 🎉' : 'Tidak Ada Tanggungan Pengembalian Barang'}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            {hasActiveEvent 
              ? `Terima kasih! Seluruh perlengkapan sewa untuk event "${activeReservation.eventName}" telah selesai dikembalikan ke lokasi asalnya. Anda kini dapat menutup siklus event ini untuk membuat event baru.`
              : 'Anda belum memiliki pinjaman barang rental aktif saat ini. Silakan buat event dan pilih perlengkapan di Marketplace.'}
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            {hasActiveEvent ? (
              <button
                type="button"
                onClick={() => {
                  clearActiveEvent()
                  navigate('/create-event')
                }}
                className="btn-primary text-xs !py-3 !px-6 flex items-center gap-2 cursor-pointer shadow-lg shadow-green-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Selesaikan Siklus Event & Buat Event Baru</span>
              </button>
            ) : (
              <Link to="/create-event" className="btn-primary text-xs !py-3 !px-6">
                + Buat Event & Pinjam Barang
              </Link>
            )}
            <Link to="/marketplace" className="btn-secondary text-xs !py-3 !px-6">
              Lihat Marketplace
            </Link>
          </div>
        </div>
      ) : (
        /* KONDISI 3: FORM PENGEMBALIAN BARANG AKTIF */
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Col: Target Item & Storage Info */}
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Daftar Barang Disewa ({rentedItems.length} Sisa):
                </label>
              </div>

              {/* Pilihan Cepat Kartu Barang */}
              <div className="space-y-2">
                {rentedItems.map(item => {
                  const isPending = pendingReturns?.some(r => r.equipmentId === item.id)
                  const isSelected = currentItem?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectItem(item.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-green-50 border-green-500 ring-2 ring-green-500/20'
                          : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-xs truncate">{item.name}</div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">
                          {item.qty} Unit • 📍 {item.lastLocation || item.initialLocation || 'Warehouse Kampus'}
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isPending ? 'bg-amber-100 text-amber-800' : 'bg-white text-gray-600 border border-gray-200'
                      }`}>
                        {isPending ? '⏳ Dicek Admin' : 'Pilih'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {currentItem && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-green-700 bg-green-100 px-2 py-0.5 rounded">
                      ITEM-{currentItem.id}
                    </span>
                    <h4 className="font-extrabold text-gray-900 text-base mt-1.5">{currentItem.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Peminjam: <strong className="text-gray-800">{currentUserName || 'Prasmulyan'}</strong></p>
                    <p className="text-xs text-gray-500 mt-0.5">Jumlah Dikembalikan: <strong className="text-gray-800">{currentItem.qty} unit</strong></p>
                  </div>

                  {/* Highlight Lokasi Pengembalian Asal */}
                  <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-emerald-800 text-[10px] block uppercase font-black tracking-wider">
                          Wajib Dikembalikan Ke Lokasi Asal:
                        </span>
                        <span className="font-black text-emerald-950 text-sm block mt-0.5">
                          {currentOriginLocation}
                        </span>
                        <span className="text-[10px] text-emerald-700 block mt-1">
                          Harap letakkan kembali tepat di tempat barang ini diambil semula.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Kedua foto bukti di sebelah kanan wajib diupload dengan stempel waktu untuk verifikasi Admin Pengelola.</span>
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
                      Wajib Upload 2 Bukti Foto Pengembalian ({currentItem?.name})
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* BUKTI FOTO 1: KONDISI FISIK BARANG */}
                      <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <div className="text-xs font-bold text-gray-800">
                          1. Foto Kondisi Fisik Barang
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Pastikan barang utuh, bersih, dan berfungsi baik seperti saat diambil.
                        </p>

                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-green-500 transition-colors bg-white">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleConditionPhotoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {conditionPhoto ? (
                            <div className="space-y-2">
                              <img src={conditionPhoto} alt="Kondisi Fisik" className="w-full h-32 object-cover rounded-lg mx-auto border" />
                              <span className="text-[10px] text-emerald-700 font-bold block bg-emerald-50 py-1 px-2 rounded">
                                🕒 {conditionTime}
                              </span>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center">
                              <Camera className="w-6 h-6 text-gray-400 mb-1" />
                              <span className="text-xs font-bold text-gray-700">Ambil / Upload Foto Fisik</span>
                              <span className="text-[10px] text-gray-400">Otomatis mencatat waktu</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BUKTI FOTO 2: BUKTI DILETAKKAN KEMBALI DI TEMPAT SEMULA */}
                      <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <div className="text-xs font-bold text-gray-800">
                          2. Foto di Lokasi Asal ({currentOriginLocation})
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Tunjukkan barang telah diletakkan rapi di tempat pengambilan semula.
                        </p>

                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-green-500 transition-colors bg-white">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleStoragePhotoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {storagePhoto ? (
                            <div className="space-y-2">
                              <img src={storagePhoto} alt="Lokasi Asal" className="w-full h-32 object-cover rounded-lg mx-auto border" />
                              <span className="text-[10px] text-emerald-700 font-bold block bg-emerald-50 py-1 px-2 rounded">
                                🕒 {storageTime}
                              </span>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center">
                              <MapPin className="w-6 h-6 text-gray-400 mb-1" />
                              <span className="text-xs font-bold text-gray-700">Upload Foto di Lokasi Asal</span>
                              <span className="text-[10px] text-gray-400">Wajib memperlihatkan posisi simpan</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CHECKLIST PENGECEKAN FISIK */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <h5 className="font-bold text-gray-900 text-xs">Konfirmasi Pernyataan Peminjam:</h5>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={checklist.goodCondition} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, goodCondition: e.target.checked }))}
                          className="rounded text-green-600 focus:ring-green-500" 
                        />
                        <span className="text-gray-700">Barang dalam keadaan berfungsi baik dan bersih seperti semula</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={checklist.complete} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, complete: e.target.checked }))}
                          className="rounded text-green-600 focus:ring-green-500" 
                        />
                        <span className="text-gray-700">Kelengkapan aksesoris, kabel, dan komponen pendukung lengkap</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={checklist.returnedToOriginalPlace} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, returnedToOriginalPlace: e.target.checked }))}
                          className="rounded text-green-600 focus:ring-green-500" 
                        />
                        <span className="text-gray-700">
                          Barang telah dipulangkan ke tempat asalnya (<strong>{currentOriginLocation}</strong>)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={`w-full text-sm !py-3.5 flex items-center justify-center gap-2 rounded-xl font-bold transition-all ${
                        canSubmit 
                          ? 'btn-primary shadow-lg shadow-green-600/20 cursor-pointer' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Kirim Bukti Pengembalian ke Admin</span>
                    </button>
                    {!canSubmit && (
                      <p className="text-center text-[11px] text-gray-400 mt-2">
                        ⚠️ Harap upload Foto Kondisi Fisik dan Foto di Lokasi Asal terlebih dahulu.
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
                      MENUNGGU VERIFIKASI ADMIN ⏳
                    </h3>
                    <p className="text-xs text-amber-800 max-w-md mx-auto mt-2 leading-relaxed">
                      Bukti pengembalian <strong>{currentItem?.name}</strong> ke lokasi <strong>{currentOriginLocation}</strong> telah masuk ke sistem. Admin akan memverifikasi foto fisik dan lokasi penempatan barang.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col items-center gap-3">
                    {rentedItems.length > 1 && (
                      <button 
                        onClick={() => setReturnStatus('idle')}
                        className="btn-secondary text-xs !py-2.5 !px-5 bg-white cursor-pointer"
                      >
                        Kembalikan Barang Lainnya Dulu
                      </button>
                    )}
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
                      PENGEMBALIAN DIVERIFIKASI! ♻️
                    </h3>
                    <p className="text-xs text-green-800 max-w-md mx-auto mt-1 leading-relaxed">
                      Pengembalian barang telah disetujui Admin. Stok barang telah dipulihkan ke Marketplace beserta posisi penyimpanannya.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-green-200/50 flex flex-col sm:flex-row gap-3 justify-center">
                    {rentedItems.length > 0 ? (
                      <button 
                        onClick={() => {
                          setReturnStatus('idle')
                          setSelectedItemId(rentedItems[0]?.id)
                        }} 
                        className="btn-primary text-xs !py-3 !px-6 cursor-pointer"
                      >
                        Kembalikan Sisa Barang Lainnya ({rentedItems.length})
                      </button>
                    ) : (
                      <Link to="/marketplace" className="btn-primary text-xs !py-3 !px-6">
                        Lihat Katalog Marketplace
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
