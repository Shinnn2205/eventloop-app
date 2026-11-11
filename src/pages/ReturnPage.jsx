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
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  MessageSquare
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
  
  const rentedItems = activeReservation?.items?.filter(item => item.listingType !== 'sale') || []
  const hasActiveEvent = Boolean(activeReservation?.eventName)
  
  const [selectedItemId, setSelectedItemId] = useState(rentedItems[0]?.id || '')
  
  useEffect(() => {
    if (rentedItems.length > 0 && !rentedItems.find(i => i.id === selectedItemId)) {
      setSelectedItemId(rentedItems[0].id)
    }
  }, [rentedItems, selectedItemId])

  const currentItem = rentedItems.find(i => i.id === selectedItemId) || rentedItems[0]
  const currentOriginLocation = currentItem?.lastLocation || currentItem?.initialLocation || 'Warehouse Kampus Gedung C (Rak B-04)'

  const calculateOverdueDays = () => {
    const endStr = activeReservation?.endDateLabel || activeReservation?.endDate
    if (!endStr) return 0
    const d = new Date(endStr)
    if (isNaN(d.getTime())) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const overdueDays = calculateOverdueDays()

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
    const isPending = pendingReturns?.some(r => String(r.equipmentId) === String(newId))
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
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pengembalian ke Lokasi Asal
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Kembalikan setiap perlengkapan ke tempat pengambilan asalnya dan lampirkan dua foto dokumentasi ber-timestamp.
        </p>
      </div>

      {/* STATUS KETERLAMBATAN & KEBIJAKAN DENDA */}
      {rentedItems.length > 0 && userPaymentStatus === 'approved' && (
        <div className="card p-4 bg-emerald-50/40 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              overdueDays > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {overdueDays > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {overdueDays > 0 
                  ? `Status: Melewati Batas ${overdueDays} Hari` 
                  : 'Status Pengembalian: Tepat Waktu (Bebas Denda)'
                }
              </div>
              <div className="text-[11px] text-slate-500">
                Batas Akhir: <strong>{activeReservation?.endDateLabel || activeReservation?.endDate || '06 Nov 2026'}</strong> · Denda Terlambat: <strong className={overdueDays > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700'}>Rp{(overdueDays > 0 ? overdueDays * 25000 : 0).toLocaleString('id-ID')}</strong> (Rp25.000/hari)
              </div>
            </div>
          </div>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Halo Admin Gudang EventLoop, saya PIC event "${activeReservation?.eventName}". Ingin konfirmasi jadwal serah terima pengembalian perlengkapan ke rak gudang.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary !py-2 !px-3 text-[11px] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kontak Admin Gudang (WhatsApp)</span>
          </a>
        </div>
      )}

      {/* KONDISI 1: PEMBAYARAN MASIH MENUNGGU VERIFIKASI ADMIN */}
      {userPaymentStatus === 'pending_admin_approval' ? (
        <div className="card p-10 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Pembayaran Sedang Diverifikasi Admin</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
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
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {hasActiveEvent ? 'Seluruh Perlengkapan Event Telah Dikembalikan 🌿' : 'Tidak Ada Tanggungan Pengembalian'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
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
                <label className="block text-xs font-bold text-slate-700">
                  Perlengkapan Disewa ({rentedItems.length} tersisa)
                </label>
              </div>

              <div className="space-y-2">
                {rentedItems.map(item => {
                  const isPending = pendingReturns?.some(r => String(r.equipmentId) === String(item.id))
                  const isSelected = currentItem?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectItem(item.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-xs truncate">{item.name}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.qty} unit · {item.lastLocation || item.initialLocation || 'Warehouse Kampus'}
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isPending ? 'bg-amber-100 text-amber-800' : 'bg-white text-emerald-700 border border-emerald-200'
                      }`}>
                        {isPending ? 'Dicek Admin' : 'Pilih'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {currentItem && (
                <div className="pt-4 border-t border-emerald-100/80 space-y-3.5">
                  <div>
                    <span className="badge-sage">ITEM-{currentItem.id}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1.5">{currentItem.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Peminjam: <strong className="text-slate-800">{currentUserName || 'Prasmulyan'}</strong></p>
                    <p className="text-xs text-slate-500 mt-0.5">Jumlah: <strong className="text-slate-800">{currentItem.qty} unit</strong></p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-emerald-700 text-[11px] font-medium block">
                          Wajib Dikembalikan ke Lokasi Asal:
                        </span>
                        <span className="font-bold text-emerald-950 text-xs block mt-0.5">
                          {currentOriginLocation}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
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
                  <div className="space-y-3.5">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      Dokumentasi Foto Pengembalian ({currentItem?.name})
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* BUKTI FOTO 1 */}
                      <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/20 space-y-2.5">
                        <div className="text-xs font-bold text-slate-800">
                          1. Foto Kondisi Fisik Barang
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Pastikan barang utuh, bersih, dan berfungsi baik.
                        </p>

                        <div className="relative border border-dashed border-emerald-300 rounded-xl p-3 text-center hover:border-emerald-500 transition-colors bg-white">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleConditionPhotoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {conditionPhoto ? (
                            <div className="space-y-2">
                              <img src={conditionPhoto} alt="Kondisi Fisik" className="w-full h-32 object-cover rounded-lg mx-auto border border-emerald-100" />
                              <span className="text-[10px] text-emerald-800 font-semibold block bg-emerald-50 py-1 px-2 rounded-md">
                                {conditionTime}
                              </span>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center">
                              <Camera className="w-5 h-5 text-emerald-600 mb-1.5" />
                              <span className="text-xs font-semibold text-slate-700">Pilih Foto Fisik</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Otomatis mencatat waktu</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BUKTI FOTO 2 */}
                      <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/20 space-y-2.5">
                        <div className="text-xs font-bold text-slate-800">
                          2. Foto di Lokasi Asal
                        </div>
                        <p className="text-[11px] text-slate-500 truncate" title={currentOriginLocation}>
                          Lokasi: {currentOriginLocation}
                        </p>

                        <div className="relative border border-dashed border-emerald-300 rounded-xl p-3 text-center hover:border-emerald-500 transition-colors bg-white">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleStoragePhotoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {storagePhoto ? (
                            <div className="space-y-2">
                              <img src={storagePhoto} alt="Lokasi Asal" className="w-full h-32 object-cover rounded-lg mx-auto border border-emerald-100" />
                              <span className="text-[10px] text-emerald-800 font-semibold block bg-emerald-50 py-1 px-2 rounded-md">
                                {storageTime}
                              </span>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center">
                              <MapPin className="w-5 h-5 text-emerald-600 mb-1.5" />
                              <span className="text-xs font-semibold text-slate-700">Pilih Foto Lokasi Simpan</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Perlihatkan posisi rak/gudang</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-2.5">
                    <h5 className="font-bold text-slate-800 text-xs">Konfirmasi Pengembalian:</h5>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600">
                        <input 
                          type="checkbox" 
                          checked={checklist.goodCondition} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, goodCondition: e.target.checked }))}
                          className="rounded accent-emerald-600" 
                        />
                        <span>Barang berfungsi baik dan bersih seperti semula</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600">
                        <input 
                          type="checkbox" 
                          checked={checklist.complete} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, complete: e.target.checked }))}
                          className="rounded accent-emerald-600" 
                        />
                        <span>Kelengkapan komponen pendukung lengkap</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600">
                        <input 
                          type="checkbox" 
                          checked={checklist.returnedToOriginalPlace} 
                          onChange={(e) => setChecklist(prev => ({ ...prev, returnedToOriginalPlace: e.target.checked }))}
                          className="rounded accent-emerald-600" 
                        />
                        <span>
                          Dikembalikan ke tempat asalnya (<strong className="text-emerald-800">{currentOriginLocation}</strong>)
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
                      <p className="text-center text-[11px] text-slate-400 mt-2">
                        Lengkapi kedua foto bukti di atas untuk mengirim pengembalian.
                      </p>
                    )}
                  </div>
                </form>
              ) : returnStatus === 'pending_admin_approval' ? (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-white text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Menunggu Verifikasi Admin
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-1.5 leading-relaxed">
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
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <span className="badge-sage mb-2">Pengembalian Terverifikasi</span>
                    <h3 className="text-lg font-bold text-emerald-950">
                      Barang Selesai Dikembalikan ♻️
                    </h3>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto mt-1 leading-relaxed">
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
