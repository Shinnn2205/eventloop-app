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
  RotateCcw,
  Eye,
  Upload,
  Image as ImageIcon
} from 'lucide-react'

// Fungsi Kompresi Bukti Foto Transfer Admin
const compressImage = (file, callback) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 600
      const scaleSize = MAX_WIDTH / img.width
      canvas.width = MAX_WIDTH
      canvas.height = img.height * scaleSize
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      callback(canvas.toDataURL('image/jpeg', 0.65))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('payouts') // 'payouts' | 'approvals' | 'returns'
  const [viewingProof, setViewingProof] = useState(null) // { title, photo, details }
  const [payoutModalTxn, setPayoutModalTxn] = useState(null)
  const [adminProofPhoto, setAdminProofPhoto] = useState(null)
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

  const totalFundsInEscrow = transactions
    .filter(t => t.payoutStatus === 'Pending Transfer')
    .reduce((sum, t) => sum + (t.payoutAmount || 0), 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Portal Khusus Admin & Manajemen Kampus
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              EventLoop Admin & Escrow Hub 🏦
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Pusat kendali admin untuk memverifikasi pembayaran QRIS, mengecek kelayakan barang organisasi, dan mentransfer dana (payout) ke rekening pemilik barang secara aman.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-left">
            <span className="text-[11px] text-gray-300 uppercase font-semibold block">
              Dana Rekber Pending Payout
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              Rp{totalFundsInEscrow.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Siap di-transfer ke rekening organisasi pemilik
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
                  Uang masuk ke Bank Admin via QRIS → Admin transfer ke rekening organisasi pemilik barang.
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
                    <th className="p-4 text-right">Uang Masuk & Bukti Transfer</th>
                    <th className="p-4">Rekening Owner (Tujuan Payout)</th>
                    <th className="p-4 text-right">Net Payout</th>
                    <th className="p-4 text-center">Status & Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-gray-900 text-xs">{txn.id}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{txn.paidAt}</div>
                        <span className="inline-block mt-1 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                          ✓ {txn.qrisStatus}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-xs">{txn.itemName}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Dibayar oleh: <strong>{txn.buyerOrg}</strong>
                        </div>
                      </td>

                      <td className="p-4 text-right font-black text-gray-900 text-sm">
                        Rp{txn.amount?.toLocaleString('id-ID')}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-gray-800 text-xs">{txn.ownerOrg}</div>
                        <div className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md mt-1 inline-block">
                          {txn.ownerBank}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="font-black text-emerald-700 text-sm">
                          Rp{txn.payoutAmount?.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          (Fee kampus: Rp{txn.adminFee?.toLocaleString('id-ID')})
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
                        <p className="text-xs text-gray-500">Pemilik: <strong>{item.owner || item.ownerOrg}</strong> • Qty: {item.qty} unit</p>
                      </div>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
                        Score {item.circularScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Harga / Tarif</span>
                        <span className="font-bold text-gray-900">Rp{item.price?.toLocaleString('id-ID')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] block">Kondisi Fisik</span>
                        <span className="font-bold text-emerald-700">{item.condition}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-gray-100">
                        <span className="text-gray-400 text-[10px] block">Info Rekening Pencairan</span>
                        <span className="font-mono font-semibold text-gray-800">{item.bankInfo}</span>
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
                          {ret.itemCode}
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
            Admin mengecek kondisi barang saat diserahkan ke pembeli/peminjam.
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold block text-blue-700 mb-1">3. Admin Transfer Dana</span>
            Admin menekan tombol "Transfer ke Owner" untuk meneruskan dana bersih ke rekening pemilik.
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold block text-blue-700 mb-1">4. Aman & Bebas Penipuan</span>
            Mencegah barang rusak / tidak sesuai, serta memastikan kepanitiaan saling percaya.
          </div>
        </div>
      </div>
      {/* MODAL 1: VIEW PROOF (PREVIEW BUKTI TRANSFER MAHASISWA / ADMIN) */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                {viewingProof.title}
              </h4>
              <button onClick={() => setViewingProof(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center max-h-80">
              <img src={viewingProof.photo} alt="Bukti Transfer" className="w-full h-auto object-contain max-h-80" />
            </div>

            {viewingProof.details && (
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 font-mono">
                {viewingProof.details}
              </div>
            )}

            <button
              onClick={() => setViewingProof(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSFER PAYOUT & UPLOAD BUKTI TRANSFER DARI ADMIN KE OWNER */}
      {payoutModalTxn && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  Kirim Payout ke Organisasi Pemilik
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">ID: {payoutModalTxn.id}</p>
              </div>
              <button onClick={() => setPayoutModalTxn(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">
                ✕
              </button>
            </div>

            {/* Rincian Rekening & Nominal */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs space-y-2 text-emerald-950">
              <div className="flex justify-between">
                <span className="text-emerald-800">Organisasi Pemilik:</span>
                <strong className="text-emerald-950">{payoutModalTxn.ownerOrg}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800">Rekening Tujuan:</span>
                <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{payoutModalTxn.ownerBank}</strong>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-emerald-200">
                <span className="text-emerald-800 font-bold">Nominal Net Payout:</span>
                <span className="text-xl font-black text-emerald-700">Rp{payoutModalTxn.payoutAmount?.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Upload Bukti Transfer Admin */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 text-left">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Upload Bukti Transfer Bank (Wajib) *
                </span>
                <span className="text-[10px] text-red-500 font-semibold">Wajib Diisi</span>
              </label>

              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    compressImage(f, (b64) => setAdminProofPhoto(b64))
                  }
                }}
                className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
              />

              {adminProofPhoto && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-emerald-300 max-h-40 bg-black/5 flex items-center justify-center">
                  <img src={adminProofPhoto} alt="Bukti Transfer Admin" className="w-full h-auto object-contain max-h-40" />
                  <span className="absolute bottom-1 right-1 bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    ✓ Foto Terpasang
                  </span>
                </div>
              )}
              <p className="text-[10px] text-gray-400">
                Bukti transfer ini dapat dilihat langsung oleh organisasi pemilik barang di halaman Barang Saya.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                disabled={!adminProofPhoto}
                onClick={handleConfirmPayoutWithProof}
                className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{adminProofPhoto ? 'Konfirmasi & Kirim Bukti ke Owner' : 'Upload Bukti Transfer Terlebih Dahulu'}</span>
              </button>
              <button
                onClick={() => setPayoutModalTxn(null)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}