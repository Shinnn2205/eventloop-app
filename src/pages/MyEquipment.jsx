import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Package, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  Box,
  MapPin,
  Plus,
  Receipt,
  Eye,
  X
} from 'lucide-react'

export default function MyEquipment() {
  const { equipments, pendingApprovals, currentUserName, transactions } = useApp()
  const [viewingPayoutProof, setViewingPayoutProof] = useState(null)

  const isMine = (uploader) => {
    if (!uploader) return false
    const uLow = String(uploader).toLowerCase()
    const nameLow = String(currentUserName || 'Prasmulyan').toLowerCase()
    return uLow === 'currentuser' || uLow.includes(nameLow) || nameLow.includes(uLow) || uLow.includes('prasmul')
  }

  const myApprovedEquipments = equipments.filter(item => isMine(item.uploader))
  const myPendingEquipments = pendingApprovals.filter(item => isMine(item.uploader))

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
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
              Pantau status verifikasi, stok barang, serta dana payout dari Admin EventLoop.
            </p>
          </div>
        </div>

        <Link
          to="/upload-equipment"
          className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Barang Baru</span>
        </Link>
      </div>

      {/* SECTION 1: MENUNGGU VERIFIKASI ADMIN */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Menunggu Verifikasi Admin ({myPendingEquipments.length})
        </h3>
        
        {myPendingEquipments.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center text-sm text-gray-500">
            Tidak ada barang dalam antrean verifikasi saat ini.
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
                  <div className="text-[10px] font-bold text-amber-600 uppercase mb-0.5">#{item.id} • PENDING</div>
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
                    <strong className="text-green-800">{Math.max(0, item.total - item.available)} Unit</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg truncate">
                  <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="truncate" title={item.lastLocation}>{item.lastLocation || 'Warehouse Kampus'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: STATUS PAYOUT & BUKTI TRANSFER DARI ADMIN */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Payout & Bukti Transfer dari Admin ({transactions.length})
          </h3>
          <span className="text-xs text-gray-400 font-medium">Escrow Payout Otomatis</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 bg-white border border-gray-200 rounded-3xl text-center text-sm text-gray-500 shadow-sm space-y-2">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto" />
            <p>Belum ada transaksi sewa/beli barang yang memerlukan payout.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(txn => {
              const isTransferred = txn.payoutStatus === 'Transferred'
              return (
                <div key={txn.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        #{txn.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isTransferred 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isTransferred ? '✅ Dana Telah Ditransfer Admin' : '⏳ Menunggu Transfer Admin'}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">{txn.itemName}</h4>
                    <p className="text-xs text-gray-500">
                      Penyewa: <strong className="text-gray-700">{txn.buyerOrg}</strong> • Durasi: <strong>{txn.durationDays || 1} Hari</strong>
                    </p>
                    <p className="text-xs text-gray-400">
                      Rekening Penerima: <span className="font-mono text-gray-600">{txn.ownerBank || 'BCA 8012345678'}</span>
                    </p>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Payout</span>
                      <span className="text-lg font-black text-emerald-600">
                        Rp{(txn.amount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {isTransferred && txn.payoutProofPhoto ? (
                      <button
                        onClick={() => setViewingPayoutProof(txn)}
                        className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer font-bold"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lihat Bukti Transfer Admin</span>
                      </button>
                    ) : isTransferred ? (
                      <span className="text-[11px] text-gray-500 font-mono">Ref: {txn.payoutRef || 'TRF-DONE'}</span>
                    ) : (
                      <span className="text-[11px] text-amber-600 italic">Admin sedang memproses transfer</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL PREVIEW BUKTI TRANSFER ADMIN */}
      {viewingPayoutProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-gray-900 text-base">Bukti Transfer Payout dari Admin</h4>
                <p className="text-xs text-gray-500">Transaksi #{viewingPayoutProof.id} • {viewingPayoutProof.itemName}</p>
              </div>
              <button 
                onClick={() => setViewingPayoutProof(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-96 flex items-center justify-center">
              <img 
                src={viewingPayoutProof.payoutProofPhoto} 
                alt="Bukti Transfer Admin" 
                className="w-full h-auto object-contain max-h-96"
              />
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Nominal Transfer:</span>
                <strong className="text-emerald-700 font-bold">Rp{(viewingPayoutProof.amount || 0).toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rekening Tujuan:</span>
                <strong className="text-gray-800">{viewingPayoutProof.ownerBank || 'BCA 8012345678'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Waktu Transfer:</span>
                <strong className="text-gray-800">{viewingPayoutProof.transferredAt || 'Hari ini'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nomor Referensi:</span>
                <strong className="font-mono text-gray-800">{viewingPayoutProof.payoutRef || 'TRF-DONE'}</strong>
              </div>
            </div>

            <button
              onClick={() => setViewingPayoutProof(null)}
              className="w-full btn-primary !py-2.5 text-xs font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
