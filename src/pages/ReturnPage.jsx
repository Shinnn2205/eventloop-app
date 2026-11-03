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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <span className="badge-sage mb-2">
          <RotateCcw className="w-3.5 h-3.5" /> Tahap 3 · Pengembalian Perlengkapan
        </span>
        <h2 className="text-2xl font-bold text-[#2C332E] tracking-tight">
          Pengembalian ke Lokasi Asal
        </h2>
        <p className="text-sm text-[#6E7871] mt-1">
          Kembalikan setiap perlengkapan ke tempat pengambilan asalnya dan lampirkan dua foto dokumentasi ber-timestamp.
        </p>
      </div>

      {/* KONDISI 1: PEMBAYARAN MASIH MENUNGGU VERIFIKASI ADMIN */}
      {userPaymentStatus === 'pending_admin_approval' ? (
        <div className="card p-10 text-center space-y-4">
          <div className="w-12 h-12 bg-[#F7F1E3] text-[#8A6116] rounded-2xl flex items-center justify-center mx-auto border border-[#EBE2CC]">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#2C332E]">Pembayaran Sedang Diverifikasi Admin</h3>
          <p className="text-xs text-[#6E7871] max-w-md mx-auto leading-relaxed">
            Anda telah memesan <strong>{rentedItems.length} jenis barang sewa</strong> untuk event <strong>{activeReservation?.eventName}</strong>. Formulir pengembalian akan terbuka otomatis setelah pembayaran QRIS disetujui Admin.
          </p>
          <div className="pt-2">
            <Link to="/reservation" className="btn-primary text-xs !py-2.5 !px-5 inline-flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span>Lihat Status Reservasi</span>
            </Link>
          </div>
        </div>
      ) : rentedItems.length === 0 ? (
        /* KONDISI 2: TIDAK ADA TANGGUNGAN BARANG / SEMUA SUDAH DIKEMBALIKAN */
        <div className="card p-10 text-center space-y-4">
          <div className="w-12 h-12 bg-[#EAF0EC] text-[#3A6351] rounded-2xl flex items-center justify-center mx-auto border border-[#DCE5DF]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#2C332E]">
            {hasActiveEvent ? 'Seluruh Perlengkapan Event Telah Dikembalikan' : 'Tidak Ada Tanggungan Pengembalian'}
          </h3>
          <p className="text-xs text-[#6E7871] max-w-md mx-auto leading-relaxed">
            {hasActiveEvent 
              ? `Terima kasih! Seluruh perlengkapan sewa untuk event "${activeReservation.eventName}" telah dikembalikan ke lokasi asalnya. Anda dapat menutup siklus kegiatan ini untuk membuat event baru.`
              : 'Anda belum memiliki pinjaman perlengkapan aktif saat ini. Silakan daftarkan kegiatan dan pilih perlengkapan di Marketplace.'}
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2.5">
            {hasActiveEvent ? (
              <button
                type="button"
                onClick={() => {
                  clearActiveEvent()
                  navigate('/create-event')
                }}
                className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Selesaikan Siklus Event & Buat Event Baru</span>
              </button>
            ) : (
              <Link to="/create-event" className="btn-primary text-xs !py-2.5 !px-5">
                Buat Event Baru
              </Link>
            )}
            <Link to="/marketplace" className="btn-secondary text-xs !py-2.5 !px-5">
              Buka Marketplace
            </Link>
          </div>
        </div>
      ) : (
        /* KONDISI 3: FORM PENGEMBALIAN BARANG AKTIF */
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Col: Target Item & Storage Info */}
          <div className="space-y-5">
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#5C645E]">
                  Perlengkapan Disewa ({rentedItems.length} tersisa)
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
                          ? 'bg-[#EAF0EC] border-[#A5C0B2]'
                          : 'bg-[#F6F5F0] border-[#E8E6DF] hover:bg-[#EFECE6]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#2C332E] text-xs truncate">{item.name}</div>
                        <div className="text-[11px] text-[#6E7871] truncate mt-0.5">
                          {item.qty} unit · {item.lastLocation || item.initialLocation || 'Warehouse Kampus'}
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg flex-shrink-0 ${
                        isPending ? 'bg-[#F7F1E3] text-[#8A6116]' : 'bg-[#FAF9F5] text-[#5C645E] border border-[#E8E6DF]'
                      }`}>
                        {isPending ? 'Dicek Admin' : 'Pilih'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {currentItem && (
                <div className="pt-4 border-t border-[#ECEAE3] space-y-3.5">
                  <div>
                    <span className="badge-stone">ITEM-{currentItem.id}</span>
                    <h4 className="font-semibold text-[#2C332E] text-sm mt-1.5">{currentItem.name}</h4>
                    <p className="text-xs text-[#6E7871] mt-1">Peminjam: <strong className="text-[#2C332E]">{currentUserName || 'Prasmulyan'}</strong></p>
                    <p className="text-xs text-[#6E7871] mt-0.5">Jumlah: <strong className="text-[#2C332E]">{currentItem.qty} unit</strong></p>
                  </div>

                  {/* Highlight Lokasi Pengembalian Asal */}
                  <div className="p-3.5 bg-[#EAF0EC] rounded-xl border border-[#DCE5DF] text-xs space-y-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#3A6351] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#4B6B5C] text-[11px] font-medium block">
                          Wajib Dikembalikan ke Lokasi Asal:
                        </span>
                        <span className="font-semibold text-[#264738] text-xs block mt-0.5">
                          {currentOriginLocation}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF] text-[11px] text-[#6E7871] leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-[#8A938C] flex-shrink-0 mt-0.5" />
                    <span>Lampirkan foto kondisi fisik dan foto penempatan di lokasi asal untuk diverifikasi Admin.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 2 Cols: Form Upload 2 Bukti Foto + Checklist */}
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6 space-y-6">

              {returnStatus === 'idle' ? (
                <form onSubmit={handleReturn} className="space-y-5">
                  
                  {/* 2 PHOTO UPLOAD SECTIONS WITH TIMESTAMPS */}
                  <div className="space-y-3.5">
                    <h4 className="font-semibold text-[#2C332E] text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#3A6351]" />
                      Dokumentasi Foto Pengembalian ({currentItem?.name})
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* BUKTI FOTO 1: KONDISI FISIK BARANG */}
                      <div className="border border-[#E8E6DF] rounded-xl p-4 bg-[#F6F5F0] space-y-2.5">
                        <div className="text-xs font-semibold text-[#2C332E]">
                          1. Foto Kondisi Fisik Barang
                        </div>
                        <p className="text-[11px] text-[#6E7871]">
                          Pastikan barang utuh, bersih, dan berfungsi baik.
                        </p>

                        <div className="relative border border-dashed border-[#D5D1C8] rounded-xl p-3 text-center hover:border-[#3A6351] transition-colors bg-[#FAF9F5]">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleConditionPhotoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {conditionPhoto ? (
                            <div className="space-y-2">
                              <img src={conditionPhoto} alt="Kondisi Fisik" className="w-full h-32 object-cover rounded-lg mx-auto border border-[#E8E6DF]" />
                              <span className="text-[10px] text-[#264738] font-medium block bg-[#EAF0EC] py-1 px-2 rounded-md">
                                {conditionTime}
                              </span>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center">
                              <Camera className="w-5 h-5 text-[#8A938C] mb-1.5" />
                              <span className="text-xs font-medium text-[#2C332E]">Pilih Foto Fisik</span>
                              <span className="text-[10px] text-[#8A938C] mt-0.5">Otomatis mencatat waktu</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BUKTI FOTO 2: BUKTI DILETAKKAN KEMBALI DI TEMPAT SEMULA */}
                      <div className="border border-[#E8E6DF] rounded-xl p-4 bg-[#F6F5F0] space-y-2.5">
                        <div className="text-xs font-semibold text-[#2C332E]">
                          2. Foto di Lokasi Asal
                        </div>
                        <p className="text-[11px] text-[#6E7871] truncate" title={currentOriginLocation}>
                          Lokasi: {currentOriginLocation}
                        </p>

                        <div className="relative border border-dashed border-[#D5D1C8] rounded-xl p-3 text-center hover:border-[#3A6351] transition-colors bg-[#FAF9F5]">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleStoragePhotoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {storagePhoto ? (
                            <div className="space-y-2">
                              <img src={storagePhoto} alt="Lokasi Asal" className="w-full h-32 object-cover rounded-lg mx-auto border border-[#E8E6DF]" />
                              <span className="text-[10px] text-[#264738] font-medium block bg-[#EAF0EC] py-1 px-2 rounded-md">
                                {storageTime}
                              </span>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center">
                              <MapPin className="w-5 h-5 text-[#8A938C] mb-1.5" />
                              <span className="text-xs font-medium text-[#2C332E]">Pilih Foto Lokasi Simpan</span>
                              <span className="text-[10px] text-[#8A938C] mt-0.5">Perlihatkan posisi rak/gudang</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CHECKLIST PENGECEKAN FISIK */}
                  <div className="p-4 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF] space-y-2.5">
                    <h5 className="font-semibold text-[#2C332E] text-xs">Konfirmasi Pengembalian:</h5>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2.5 cursor-pointer text-[#5C645E]">
                        <input 
                          type="checkbox" 
                          checked={checklist.goodCondition} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, goodCondition: e.target.checked }))}
                          className="rounded accent-[#3A6351]" 
                        />
                        <span>Barang berfungsi baik dan bersih seperti semula</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-[#5C645E]">
                        <input 
                          type="checkbox" 
                          checked={checklist.complete} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, complete: e.target.checked }))}
                          className="rounded accent-[#3A6351]" 
                        />
                        <span>Kelengkapan komponen pendukung lengkap</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-[#5C645E]">
                        <input 
                          type="checkbox" 
                          checked={checklist.returnedToOriginalPlace} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, returnedToOriginalPlace: e.target.checked }))}
                          className="rounded accent-[#3A6351]" 
                        />
                        <span>
                          Dikembalikan ke tempat asalnya (<strong className="text-[#2C332E]">{currentOriginLocation}</strong>)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Kirim Bukti Pengembalian</span>
                    </button>
                    {!canSubmit && (
                      <p className="text-center text-[11px] text-[#8A938C] mt-2">
                        Lengkapi kedua foto bukti di atas untuk mengirim pengembalian.
                      </p>
                    )}
                  </div>
                </form>
              ) : returnStatus === 'pending_admin_approval' ? (
                <div className="bg-[#F7F1E3] border border-[#EBE2CC] rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-[#FAF9F5] text-[#8A6116] rounded-2xl flex items-center justify-center mx-auto border border-[#EBE2CC]">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2C332E]">
                      Menunggu Verifikasi Admin
                    </h3>
                    <p className="text-xs text-[#6E5626] max-w-md mx-auto mt-1.5 leading-relaxed">
                      Bukti pengembalian <strong>{currentItem?.name}</strong> ke lokasi <strong>{currentOriginLocation}</strong> sedang diperiksa oleh Admin.
                    </p>
                  </div>
                  {rentedItems.length > 1 && (
                    <div className="pt-2">
                      <button 
                        onClick={() => setReturnStatus('idle')}
                        className="btn-secondary text-xs !py-2 !px-4 cursor-pointer"
                      >
                        Kembalikan Barang Lainnya
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Success State */
                <div className="bg-[#EAF0EC] border border-[#DCE5DF] rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-[#3A6351] text-white rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <span className="badge-sage mb-2">Pengembalian Terverifikasi</span>
                    <h3 className="text-lg font-bold text-[#264738]">
                      Barang Selesai Dikembalikan
                    </h3>
                    <p className="text-xs text-[#4B6B5C] max-w-md mx-auto mt-1 leading-relaxed">
                      Pengembalian barang telah disetujui Admin dan stok telah dipulihkan ke Marketplace.
                    </p>
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
                    {rentedItems.length > 0 ? (
                      <button 
                        onClick={() => {
                          setReturnStatus('idle')
                          setSelectedItemId(rentedItems[0]?.id)
                        }} 
                        className="btn-primary text-xs !py-2.5 !px-5 cursor-pointer"
                      >
                        Kembalikan Sisa Barang ({rentedItems.length})
                      </button>
                    ) : (
                      <Link to="/marketplace" className="btn-primary text-xs !py-2.5 !px-5">
                        Lihat Katalog Marketplace
                      </Link>
                    )}

                    <Link to="/impact" className="btn-secondary text-xs !py-2.5 !px-5">
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
