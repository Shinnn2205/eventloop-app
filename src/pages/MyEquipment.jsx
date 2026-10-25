import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Package, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  Box,
  MapPin
} from 'lucide-react'

export default function MyEquipment() {
  const { equipments, pendingApprovals, userSession } = useApp()

  const currentUserId = userSession?.user?.id

  // Saring barang yang HANYA diupload oleh user yang sedang login saat ini berdasarkan uploader (user_id)
  const myApprovedEquipments = equipments.filter(item => item.uploader === currentUserId)
  const myPendingEquipments = pendingApprovals.filter(item => item.uploader === currentUserId)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link 
          to="/marketplace"
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Manajemen Barang Saya
          </h2>
          <p className="text-sm text-gray-500">
            Pantau status verifikasi dan stok barang milik organisasi Anda.
          </p>
        </div>
      </div>

      {/* SECTION 1: MENUNGGU VERIFIKASI ADMIN */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Menunggu Verifikasi Admin ({myPendingEquipments.length})
        </h3>
        
        {myPendingEquipments.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center text-sm text-gray-500">
            Tidak ada barang dalam antrean verifikasi.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myPendingEquipments.map(item => (
              <div key={item.id} className="p-4 bg-white border border-amber-200 rounded-2xl flex gap-4 items-center shadow-sm">
                <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 flex-shrink-0 overflow-hidden">
                  {item.imagePreview ? (
                    <img src={item.imagePreview} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-60">📦</span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase mb-0.5">#{item.id}PENDING</div>
                  <h4 className="font-extrabold text-gray-900 text-sm leading-tight">{item.name}</h4>
                  <div className="text-[11px] text-gray-500 mt-1">Stok diajukan: {item.qty} Unit</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: BARANG AKTIF DI MARKETPLACE */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Aktif & Tersedia di Marketplace ({myApprovedEquipments.length})
        </h3>
        
        {myApprovedEquipments.length === 0 ? (
          <div className="p-10 bg-white border border-gray-200 rounded-3xl text-center text-sm text-gray-500 shadow-sm space-y-3 flex flex-col items-center">
            <Box className="w-10 h-10 text-gray-300" />
            <p>Anda belum memiliki barang yang disetujui & tayang di katalog.</p>
            <Link to="/upload-equipment" className="btn-secondary text-xs mt-2">
              Mulai Upload Barang
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myApprovedEquipments.map(item => (
              <div key={item.id} className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-blue-300 transition-colors">
                <div className="flex gap-3 items-start border-b border-gray-100 pb-3">
                  <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-60">{item.image || '📦'}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{item.name}</h4>
                    <div className="text-[10px] text-gray-500 font-semibold mt-1">Total Dimiliki: {item.total} Unit</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[9px] text-gray-400 block uppercase font-bold">Stok di Gudang</span>
                    <strong className="text-gray-800">{item.available} Unit</strong>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-[9px] text-green-600 block uppercase font-bold">Sedang Disewa</span>
                    <strong className="text-green-800">{item.total - item.available} Unit</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg truncate">
                  <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="truncate" title={item.lastLocation}>{item.lastLocation || 'Lokasi Gudang'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}