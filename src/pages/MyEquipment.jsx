import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  ArrowLeft,
  Clock,
  CheckCircle2,
  Box,
  MapPin,
  Plus,
  Receipt,
  Eye,
  X,
  User,
  Calendar,
  Trash2,
  AlertTriangle,
  MessageCircle
} from 'lucide-react'

export default function MyEquipment() {
  const { 
    equipments, 
    pendingApprovals, 
    currentUserName, 
    transactions, 
    getEquipmentBorrowings,
    deleteEquipment,
    deletePendingEquipment 
  } = useApp()
  const [viewingPayoutProof, setViewingPayoutProof] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isMine = (uploader) => {
    if (!uploader) return false
    const uLow = String(uploader).toLowerCase()
    const nameLow = String(currentUserName || 'Prasmulyan').toLowerCase()
    return uLow === 'currentuser' || uLow.includes(nameLow) || nameLow.includes(uLow) || uLow.includes('prasmul') || uLow.includes('admin')
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
            className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Barang & Payout Saya
            </h2>
            <p className="text-sm text-slate-500">
              Pantau siapa yang sedang meminjam barang Anda, untuk event apa, sampai tanggal berapa, serta bukti transfer dari Admin.
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
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Menunggu Verifikasi Admin ({myPendingEquipments.length})
        </h3>
        
        {myPendingEquipments.length === 0 ? (
          <div className="p-5 bg-white border border-emerald-100 rounded-2xl text-center text-xs text-slate-400">
            Tidak ada perlengkapan dalam antrean verifikasi saat ini.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myPendingEquipments.map(item => (
              <div key={item.id} className="card p-4 flex gap-3.5 items-center justify-between">
                <div className="flex gap-3.5 items-center min-w-0">
                  <div className="w-14 h-14 bg-emerald-50/60 rounded-xl flex items-center justify-center border border-emerald-100 flex-shrink-0 overflow-hidden">
                    {item.imagePreview ? (
                      <img src={item.imagePreview} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-75">📦</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="badge-warm">Pending Review</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{item.name}</h4>
                    <div className="text-[11px] text-slate-500 mt-0.5">Stok diajukan: {item.qty} unit</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deletePendingEquipment && deletePendingEquipment(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex-shrink-0"
                  title="Batalkan pengajuan barang"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: BARANG AKTIF DI MARKETPLACE + DETAIL PEMINJAM */}
      <div className="space-y-3 pt-4 border-t border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Aktif di Marketplace & Status Peminjam ({myApprovedEquipments.length})
          </h3>
          <span className="text-xs text-slate-400">
            Menampilkan informasi peminjam aktif, nama event, dan batas tanggal pinjam
          </span>
        </div>
        
        {myApprovedEquipments.length === 0 ? (
          <div className="card p-8 text-center text-xs text-slate-500 space-y-2.5 flex flex-col items-center">
            <Box className="w-8 h-8 text-emerald-300" />
            <p>Belum ada perlengkapan Anda yang tayang di katalog.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myApprovedEquipments.map(item => {
              const borrowedQty = Math.max(0, (Number(item.total) || 0) - (Number(item.available) || 0))
              const activeBorrowers = getEquipmentBorrowings ? getEquipmentBorrowings(item.id, item.name) : []

              return (
                <div key={item.id} className="card p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex gap-3.5 items-start border-b border-emerald-100/70 pb-3.5">
                      <div className="w-14 h-14 bg-emerald-50/50 rounded-xl flex items-center justify-center border border-emerald-100 flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl opacity-80">{item.image || '📦'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.name}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Total Inventaris: <strong className="text-slate-700">{item.total} unit</strong> · Rp{(item.price || 0).toLocaleString('id-ID')}/hari
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1 truncate">
                          <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span className="truncate" title={item.lastLocation}>Lokasi Asal: {item.lastLocation || 'Warehouse Kampus'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Tersedia di Gudang</span>
                        <strong className="text-slate-800">{item.available} unit</strong>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${
                        borrowedQty > 0 || activeBorrowers.length > 0
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-slate-50 border-slate-100'
                      }`}>
                        <span className="text-[10px] text-emerald-700 block">Sedang Dipinjam</span>
                        <strong className="text-emerald-900">
                          {borrowedQty > 0 ? borrowedQty : activeBorrowers.reduce((s, b) => s + (b.qty || 1), 0)} unit
                        </strong>
                      </div>
                    </div>

                    {/* KETERANGAN SIAPA YANG MEMINJAM, EVENT APA, SAMPAI TANGGAL BERAPA */}
                    {activeBorrowers.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-semibold text-emerald-800 block">
                          Detail Peminjam Saat Ini:
                        </span>
                        {activeBorrowers.map((b, bIdx) => (
                          <div 
                            key={bIdx} 
                            className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-emerald-600" />
                                {b.borrowerName} <span className="font-normal text-slate-500">({b.org})</span>
                              </span>
                              <span className="badge-sage !py-0.5 !px-2 !text-[10px]">
                                {b.qty} unit
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              🎪 Event: <strong className="text-slate-800">{b.eventName}</strong> ({b.location})
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium pt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Dipinjam: <strong>{b.startDate}</strong> s/d <strong>{b.endDate}</strong> ({b.durationDays} hari)</span>
                            </div>

                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `Halo ${b.borrowerName} (${b.org}), saya pemilik inventaris "${item.name}" di EventLoop. Ingin koordinasi terkait pengembalian perlengkapan event "${b.eventName}" pada tanggal ${b.endDate} ke ${item.lastLocation || 'Warehouse Kampus'}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg transition-colors mt-1 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Hubungi Peminjam (WhatsApp)</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : borrowedQty > 0 ? (
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs space-y-1">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-600" />
                            Panitia Mahasiswa Prasmul
                          </span>
                          <span className="badge-sage !py-0.5 !px-2 !text-[10px]">{borrowedQty} unit</span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          🎪 Event: <strong>Kegiatan Kampus Berjalan</strong>
                        </div>
                        <div className="text-[11px] text-emerald-800 font-medium">
                          📅 Dipinjam: <strong>03 Nov 2026</strong> s/d <strong>06 Nov 2026</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Seluruh unit sedang berada di lokasi penyimpanan asal dan siap dipinjam.</span>
                      </div>
                    )}
                  </div>

                  {/* AKSI HAPUS DARI MARKETPLACE */}
                  <div className="pt-3 border-t border-emerald-100/80 flex items-center justify-between gap-2">
                    {borrowedQty > 0 || activeBorrowers.length > 0 ? (
                      <>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1 font-medium truncate" title="Barang sedang dipinjam, tidak dapat dihapus">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          Sedang dipinjam ({borrowedQty || activeBorrowers.reduce((s, b) => s + (b.qty || 1), 0)} unit)
                        </span>
                        <button
                          disabled
                          type="button"
                          className="text-xs text-slate-300 bg-slate-50 cursor-not-allowed px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-1 font-medium"
                          title="Barang sedang dipinjam oleh kegiatan kampus. Tidak dapat dihapus sampai barang dipulangkan."
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Terkunci</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-slate-400">
                          Status: Siap di Marketplace
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/80 transition-all shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Hapus Barang</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: STATUS PAYOUT & BUKTI TRANSFER DARI ADMIN */}
      <div className="space-y-3 pt-4 border-t border-emerald-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Payout & Bukti Transfer dari Admin ({transactions.length})
          </h3>
          <span className="text-xs text-slate-400">Pencairan Dana Escrow</span>
        </div>

        {transactions.length === 0 ? (
          <div className="card p-8 text-center text-xs text-slate-500 space-y-2">
            <Receipt className="w-7 h-7 text-emerald-300 mx-auto" />
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
                    <h4 className="font-bold text-slate-900 text-sm pt-0.5">{txn.itemName}</h4>
                    <p className="text-xs text-slate-500">
                      Peminjam: <strong className="text-slate-800">{txn.borrowerName || txn.buyerOrg}</strong> · Event: <strong>{txn.eventName || 'Kegiatan Kampus'}</strong>
                    </p>
                    <p className="text-xs text-emerald-700 font-medium">
                      📅 Periode Pinjam: {txn.startDate || '03 Nov 2026'} s/d {txn.endDate || '05 Nov 2026'} ({txn.durationDays || 1} hari)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Rekening Tujuan: <span className="font-mono text-slate-600">{txn.ownerBank || 'BCA 8012345678'}</span>
                    </p>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-emerald-100/70">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total Diterima</span>
                      <span className="text-base font-bold text-emerald-700">
                        Rp{(txn.payoutAmount || txn.amount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {isTransferred && txn.payoutProofPhoto ? (
                      <button
                        onClick={() => setViewingPayoutProof(txn)}
                        className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lihat Bukti Transfer</span>
                      </button>
                    ) : isTransferred ? (
                      <span className="text-[11px] text-slate-400 font-mono">Ref: {txn.payoutRef || 'TRF-DONE'}</span>
                    ) : (
                      <span className="text-[11px] text-amber-700">Sedang diproses Admin</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Bukti Transfer Payout dari Admin</h4>
                <p className="text-xs text-slate-500">Transaksi #{viewingPayoutProof.id} · {viewingPayoutProof.itemName}</p>
              </div>
              <button 
                onClick={() => setViewingPayoutProof(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50/30 max-h-80 flex items-center justify-center">
              <img 
                src={viewingPayoutProof.payoutProofPhoto} 
                alt="Bukti Transfer Admin" 
                className="w-full h-auto object-contain max-h-80"
              />
            </div>

            <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Payout:</span>
                <strong className="text-emerald-700">Rp{(viewingPayoutProof.payoutAmount || viewingPayoutProof.amount || 0).toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rekening Tujuan:</span>
                <strong className="text-slate-800">{viewingPayoutProof.ownerBank || 'BCA 8012345678'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Transfer:</span>
                <strong className="text-slate-800">{viewingPayoutProof.transferredAt || 'Hari ini'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referensi:</span>
                <strong className="font-mono text-slate-800">{viewingPayoutProof.payoutRef || 'TRF-DONE'}</strong>
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

      {/* MODAL KONFIRMASI HAPUS PERLENGKAPAN DARI MARKETPLACE */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-emerald-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-slate-900">
                Hapus Perlengkapan dari Marketplace?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>"{itemToDelete.name}"</strong> ({itemToDelete.total} unit) dari katalog peminjaman kampus?
              </p>
              <p className="text-[11px] text-slate-400">
                Barang ini akan ditarik secara permanen dari katalog dan tidak akan muncul lagi di daftar peminjaman organisasi lain.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true)
                    await deleteEquipment(itemToDelete.id)
                    setItemToDelete(null)
                  } catch (err) {
                    console.warn(err)
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Barang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
