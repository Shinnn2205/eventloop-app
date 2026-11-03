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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            to="/marketplace"
            className="p-2 text-[#6E7871] hover:text-[#2C332E] hover:bg-[#EFECE6] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-[#2C332E] tracking-tight">
              Barang & Payout Saya
            </h2>
            <p className="text-sm text-[#6E7871]">
              Pantau status verifikasi perlengkapan, ketersediaan stok, serta bukti pencairan dana dari Admin.
            </p>
          </div>
        </div>

        <Link
          to="/upload-equipment"
          className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Barang Baru</span>
        </Link>
      </div>

      {/* SECTION 1: MENUNGGU VERIFIKASI ADMIN */}
      <div className="space-y-3">
        <h3 className="font-semibold text-[#2C332E] text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#8A6116]" />
          Menunggu Verifikasi Admin ({myPendingEquipments.length})
        </h3>
        
        {myPendingEquipments.length === 0 ? (
          <div className="p-5 bg-[#FAF9F5] border border-[#E8E6DF] rounded-2xl text-center text-xs text-[#8A938C]">
            Tidak ada perlengkapan dalam antrean verifikasi saat ini.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myPendingEquipments.map(item => (
              <div key={item.id} className="card p-4 flex gap-3.5 items-center">
                <div className="w-14 h-14 bg-[#F3F1EA] rounded-xl flex items-center justify-center border border-[#E8E6DF] flex-shrink-0 overflow-hidden">
                  {item.imagePreview ? (
                    <img src={item.imagePreview} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-70">📦</span>
                  )}
                </div>
                <div>
                  <span className="badge-warm">Pending Review</span>
                  <h4 className="font-semibold text-[#2C332E] text-sm mt-1">{item.name}</h4>
                  <div className="text-[11px] text-[#6E7871] mt-0.5">Stok diajukan: {item.qty} unit</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: BARANG AKTIF DI MARKETPLACE */}
      <div className="space-y-3 pt-4 border-t border-[#E8E6DF]">
        <h3 className="font-semibold text-[#2C332E] text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3A6351]" />
          Aktif di Marketplace ({myApprovedEquipments.length})
        </h3>
        
        {myApprovedEquipments.length === 0 ? (
          <div className="card p-8 text-center text-xs text-[#6E7871] space-y-2.5 flex flex-col items-center">
            <Box className="w-8 h-8 text-[#8A938C]" />
            <p>Belum ada perlengkapan Anda yang tayang di katalog.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myApprovedEquipments.map(item => (
              <div key={item.id} className="card p-4 flex flex-col gap-3">
                <div className="flex gap-3 items-start border-b border-[#ECEAE3] pb-3">
                  <div className="w-12 h-12 bg-[#F3F1EA] rounded-xl flex items-center justify-center border border-[#E8E6DF] flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl opacity-75">{item.image || '📦'}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2C332E] text-sm leading-snug line-clamp-2">{item.name}</h4>
                    <div className="text-[11px] text-[#6E7871] mt-0.5">Total: {item.total} unit</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF]">
                    <span className="text-[10px] text-[#8A938C] block">Tersedia</span>
                    <strong className="text-[#2C332E]">{item.available} unit</strong>
                  </div>
                  <div className="p-2.5 bg-[#EAF0EC] rounded-xl border border-[#DCE5DF]">
                    <span className="text-[10px] text-[#4B6B5C] block">Sedang Disewa</span>
                    <strong className="text-[#264738]">{Math.max(0, item.total - item.available)} unit</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#6E7871] bg-[#F6F5F0] px-2.5 py-1.5 rounded-lg truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#3A6351] flex-shrink-0" />
                  <span className="truncate" title={item.lastLocation}>{item.lastLocation || 'Warehouse Kampus'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: STATUS PAYOUT & BUKTI TRANSFER DARI ADMIN */}
      <div className="space-y-3 pt-4 border-t border-[#E8E6DF]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#2C332E] text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#3A6351]" />
            Payout & Bukti Transfer dari Admin ({transactions.length})
          </h3>
          <span className="text-xs text-[#8A938C]">Pencairan Dana Escrow</span>
        </div>

        {transactions.length === 0 ? (
          <div className="card p-8 text-center text-xs text-[#6E7871] space-y-2">
            <Receipt className="w-7 h-7 text-[#8A938C] mx-auto" />
            <p>Belum ada riwayat transaksi penyewaan yang memerlukan pencairan dana.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(txn => {
              const isTransferred = txn.payoutStatus === 'Transferred'
              return (
                <div key={txn.id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="badge-stone font-mono">#{txn.id}</span>
                      <span className={isTransferred ? 'badge-sage' : 'badge-warm'}>
                        {isTransferred ? 'Dana Telah Ditransfer Admin' : 'Menunggu Transfer Admin'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-[#2C332E] text-sm pt-0.5">{txn.itemName}</h4>
                    <p className="text-xs text-[#6E7871]">
                      Penyewa: <strong className="text-[#2C332E]">{txn.buyerOrg}</strong> · Durasi: <strong>{txn.durationDays || 1} hari</strong>
                    </p>
                    <p className="text-[11px] text-[#8A938C]">
                      Rekening Tujuan: <span className="font-mono text-[#5C645E]">{txn.ownerBank || 'BCA 8012345678'}</span>
                    </p>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[#ECEAE3]">
                    <div className="text-right">
                      <span className="text-[10px] text-[#8A938C] block">Total Diterima</span>
                      <span className="text-base font-bold text-[#3A6351]">
                        Rp{(txn.payoutAmount || txn.amount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {isTransferred && txn.payoutProofPhoto ? (
                      <button
                        onClick={() => setViewingPayoutProof(txn)}
                        className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#3A6351]" />
                        <span>Lihat Bukti Transfer</span>
                      </button>
                    ) : isTransferred ? (
                      <span className="text-[11px] text-[#8A938C] font-mono">Ref: {txn.payoutRef || 'TRF-DONE'}</span>
                    ) : (
                      <span className="text-[11px] text-[#8A6116]">Sedang diproses Admin</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2421]/60 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8E6DF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECEAE3] pb-3">
              <div>
                <h4 className="font-bold text-[#2C332E] text-sm">Bukti Transfer Payout dari Admin</h4>
                <p className="text-xs text-[#6E7871]">Transaksi #{viewingPayoutProof.id} · {viewingPayoutProof.itemName}</p>
              </div>
              <button 
                onClick={() => setViewingPayoutProof(null)}
                className="p-1 text-[#8A938C] hover:text-[#2C332E] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#E8E6DF] bg-[#F3F1EA] max-h-80 flex items-center justify-center">
              <img 
                src={viewingPayoutProof.payoutProofPhoto} 
                alt="Bukti Transfer Admin" 
                className="w-full h-auto object-contain max-h-80"
              />
            </div>

            <div className="p-3.5 bg-[#F6F5F0] rounded-xl border border-[#E8E6DF] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6E7871]">Nominal Payout:</span>
                <strong className="text-[#3A6351]">Rp{(viewingPayoutProof.payoutAmount || viewingPayoutProof.amount || 0).toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E7871]">Rekening Tujuan:</span>
                <strong className="text-[#2C332E]">{viewingPayoutProof.ownerBank || 'BCA 8012345678'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E7871]">Waktu Transfer:</span>
                <strong className="text-[#2C332E]">{viewingPayoutProof.transferredAt || 'Hari ini'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E7871]">Referensi:</span>
                <strong className="font-mono text-[#2C332E]">{viewingPayoutProof.payoutRef || 'TRF-DONE'}</strong>
              </div>
            </div>

            <button
              onClick={() => setViewingPayoutProof(null)}
              className="w-full btn-primary !py-2.5 text-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
