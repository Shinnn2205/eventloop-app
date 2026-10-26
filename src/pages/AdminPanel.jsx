import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  Send, 
  Package, 
  Check, 
  FileText,
  BadgeCheck,
  RotateCcw
} from 'lucide-react'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('payouts') // 'payouts' | 'approvals' | 'returns'
  const { 
    transactions, 
    pendingApprovals, 
    approveEquipmentByAdmin, 
    rejectEquipmentByAdmin, 
    approvePaymentByAdmin, 
    transferPayoutToOwner,
    pendingReturns = [], 
    approveReturnByAdmin 
  } = useApp()
  
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('')

  const handleTransferClick = (txnId) => {
    transferPayoutToOwner(txnId)
    setTransferSuccessMsg(`Dana berhasil ditransfer ke rekening owner untuk transaksi ${txnId}!`)
    setTimeout(() => setTransferSuccessMsg(''), 4000)
  }

  const handleApprovePaymentClick = (txnId) => {
    approvePaymentByAdmin(txnId)
    setTransferSuccessMsg(`Pembayaran QRIS ${txnId} BERHASIL DI-ACC! Status di layar pengguna kini otomatis BERHASIL (Lunas).`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const handleApproveEquipmentClick = (id) => {
    approveEquipmentByAdmin(id)
    setTransferSuccessMsg(`Barang ${id} disetujui dan SEKARANG LANGSUNG TAYANG di Marketplace!`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const handleRejectEquipmentClick = (id) => {
    rejectEquipmentByAdmin(id)
    setTransferSuccessMsg(`Barang ${id} ditolak dari antrean.`)
    setTimeout(() => setTransferSuccessMsg(''), 4000)
  }

  const handleApproveReturnClick = (returnId, equipmentId, returnedQty, itemName) => {
    approveReturnByAdmin(returnId, equipmentId, returnedQty)
    setTransferSuccessMsg(`Pengembalian barang ${itemName} di-ACC. Stok +${returnedQty} telah dikembalikan ke Marketplace!`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  // Total dana di escrow yang siap ditransfer (setelah lunas & status payout masih pending)
  const totalFundsInEscrow = transactions
    .filter(t => t.qrisStatus?.includes('Lunas') && t.payoutStatus === 'Pending Transfer')
    .reduce((sum, t) => sum + (t.payoutAmount || 0), 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up pb-12">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Portal Khusus Admin Kampus & Sarpras
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              EventLoop Admin & Escrow Hub 🏦
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Pusat kendali admin untuk memverifikasi pembayaran QRIS, mengecek kelayakan barang organisasi, dan mentransfer dana (payout) ke rekening pemilik barang secara aman.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-left shadow-inner">
            <span className="text-[11px] text-gray-200 uppercase font-semibold block">
              Dana Rekber Pending Payout
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              Rp{totalFundsInEscrow.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-gray-300 block mt-0.5">
              Siap di-transfer ke rekening organisasi pemilik (Net -5% Fee)
            </span>
          </div>
        </div>
      </div>

      {transferSuccessMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{transferSuccessMsg}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'payouts'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Keuangan & Payout Owner ({transactions.filter(t => t.payoutStatus === 'Pending Transfer').length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Verifikasi Barang Masuk ({pendingApprovals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'returns'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Verifikasi Pengembalian ({pendingReturns.length})</span>
        </button>
      </div>

      {/* TAB 1: PAYOUT & REKBER MANAGEMENT */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">
                  Daftar Transaksi QRIS & Penerusan Dana ke Owner
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Uang masuk ke Bank Admin via QRIS → Admin transfer ke rekening organisasi pemilik barang (setelah potong fee admin kampus 5%).
                </p>
              </div>
              <span className="text-xs font-bold text-gray-600 bg-white px-3 py-1 rounded-xl border border-gray-200">
                Rekening Penampung: <strong>BCA 0829102830 a.n EventLoop Escrow</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4">ID Transaksi & Waktu</th>
                    <th className="p-4">Barang & Pembeli</th>
                    <th className="p-4 text-right">Uang Masuk (QRIS)</th>
                    <th className="p-4">Rekening Owner (Tujuan Payout)</th>
                    <th className="p-4 text-right">Net Payout (-5% Fee)</th>
                    <th className="p-4 text-center">Status & Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-gray-900 text-xs">{txn.id}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{txn.paidAt || 'Baru saja'}</div>
                        <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          txn.qrisStatus?.includes('Lunas') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {txn.qrisStatus}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-xs">{txn.itemName}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Dibayar oleh: <strong>{txn.buyerOrg}</strong>
                        </div>
                      </td>

                      <td className="p-4 text-right font-black text-gray-900 text-sm">
                        Rp{(txn.amount || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-gray-800 text-xs">{txn.ownerOrg || 'Organisasi Kampus'}</div>
                        <div className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md mt-1 inline-block">
                          {txn.ownerBank || 'BCA 8012345678 a.n Owner'}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="font-black text-emerald-700 text-sm">
                          Rp{(txn.payoutAmount || (txn.amount * 0.95) || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          (Fee kampus 5%: Rp{(txn.adminFee || (txn.amount * 0.05) || 0).toLocaleString('id-ID')})
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        {txn.qrisStatus?.includes('Pending') ? (
                          <button
                            onClick={() => handleApprovePaymentClick(txn.id)}
                            className="btn-primary text-[11px] !py-2 !px-3 flex items-center gap-1.5 mx-auto bg-green-600 hover:bg-green-700 shadow-md whitespace-nowrap animate-pulse"
                            title="Klik untuk ACC bahwa uang sudah masuk ke Bank Admin"
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            <span>✓ ACC Pembayaran QRIS</span>
                          </button>
                        ) : txn.payoutStatus === 'Pending Transfer' ? (
                          <button
                            onClick={() => handleTransferClick(txn.id)}
                            className="btn-primary text-[11px] !py-2 !px-3.5 flex items-center gap-1.5 mx-auto bg-emerald-700 hover:bg-emerald-800 whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Transfer ke Owner</span>
                          </button>
                        ) : (
                          <div className="text-center">
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Payout Selesai
                            </span>
                            {txn.payoutRef && (
                              <div className="text-[9px] font-mono text-gray-400 mt-0.5">{txn.payoutRef}</div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-xs">
                Belum ada transaksi QRIS masuk.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VERIFIKASI & APPROVAL BARANG MASUK */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-extrabold text-gray-900 text-sm mb-1">
              Antrean Verifikasi Equipment Organisasi Mahasiswa
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Admin mengecek foto fisik, kondisi, dan kelayakan barang sebelum ditampilkan ke seluruh mahasiswa di Marketplace.
            </p>

            {pendingApprovals.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
                    {item.imagePreview && (
                      <div className="h-40 w-full rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <img src={item.imagePreview} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {item.listingType === 'sale' ? '🏷️ Dijual Preloved' : '🔄 Disewakan'}
                        </span>
                        <h4 className="font-extrabold text-gray-900 text-base mt-1.5">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Pemilik: <strong>{item.owner || item.ownerOrg}</strong> • Qty: <strong>{item.qty} unit</strong>
                        </p>
                      </div>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
                        Score {item.circularScore || 88}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Harga / Tarif</span>
                        <span className="font-bold text-gray-900">Rp{item.price?.toLocaleString('id-ID')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] block">Kondisi Fisik</span>
                        <span className="font-bold text-emerald-700">{item.condition || 'Baik'}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-gray-100">
                        <span className="text-gray-400 text-[10px] block">Info Rekening Pencairan</span>
                        <span className="font-mono font-semibold text-gray-800">{item.bankAccount || item.bankInfo || 'BCA 8012345678'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApproveEquipmentClick(item.id)}
                        className="flex-1 btn-primary text-xs !py-2.5 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui & Tayangkan di Marketplace</span>
                      </button>
                      <button
                        onClick={() => handleRejectEquipmentClick(item.id)}
                        className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                Tidak ada antrean barang baru. Semua barang telah diperiksa!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIKASI PENGEMBALIAN BARANG (RETURN) */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-extrabold text-gray-900 text-sm mb-1">
              Antrean Verifikasi Pengembalian Barang
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Cek bukti foto fisik dan posisi barang di rak sebelum mengembalikan stok ke Marketplace.
            </p>

            {pendingReturns.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {pendingReturns.map((ret) => (
                  <div key={ret.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {ret.itemCode || 'RET-ITEM'}
                        </span>
                        <h4 className="font-extrabold text-gray-900 text-base mt-1.5">{ret.itemName}</h4>
                        <p className="text-xs text-gray-500">Peminjam: <strong>{ret.borrower}</strong></p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Dikembalikan: <strong>{ret.returnedQty} unit</strong></p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">{ret.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 bg-black/60 text-white text-[9px] p-1 text-center font-bold backdrop-blur-sm">Bukti Fisik</div>
                        <img src={ret.conditionPhoto} alt="Fisik" className="h-28 w-full object-cover" />
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 bg-black/60 text-white text-[9px] p-1 text-center font-bold backdrop-blur-sm">Bukti Rak/Gudang</div>
                        <img src={ret.storagePhoto} alt="Rak" className="h-28 w-full object-cover" />
                      </div>
                    </div>

                    <button
                      onClick={() => handleApproveReturnClick(ret.id, ret.equipmentId, ret.returnedQty, ret.itemName)}
                      className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ACC & Kembalikan Stok ke Marketplace</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                Belum ada antrean pengembalian barang.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Rekber Workflow for Presentation */}
      <div className="card p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-blue-200/70">
        <h4 className="font-extrabold text-blue-950 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700" />
          Alur Sistem Pembayaran QRIS & Rekber Kampus (Untuk Bahan Presentasi Dosen)
        </h4>
        <div className="grid md:grid-cols-4 gap-3 text-xs text-blue-900 mt-3">
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold block text-blue-700 mb-1">1. Pembeli Scan QRIS</span>
            Organisasi penyewa/pembeli scan QRIS di web. Uang masuk ke Rekening Penampung Kampus.
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold block text-blue-700 mb-1">2. Verifikasi Fisik</span>
            Admin Sarpras mengecek kondisi barang saat diserahkan ke pembeli/peminjam.
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold block text-blue-700 mb-1">3. Admin Transfer Dana</span>
            Admin menekan tombol "Transfer ke Owner" untuk meneruskan dana bersih ke rekening pemilik (setelah dipotong fee 5%).
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold block text-blue-700 mb-1">4. Aman & Bebas Penipuan</span>
            Mencegah barang rusak / tidak sesuai, serta memastikan kepanitiaan saling percaya.
          </div>
        </div>
      </div>
    </div>
  )
}