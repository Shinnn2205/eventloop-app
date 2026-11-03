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
  Image as ImageIcon,
  MapPin,
  Clock,
  X
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

  const openPayoutModal = (txn) => {
    setPayoutModalTxn(txn)
    setAdminProofPhoto(null)
  }

  const handleConfirmPayoutWithProof = () => {
    if (!payoutModalTxn || !adminProofPhoto) return
    transferPayoutToOwner(payoutModalTxn.id, adminProofPhoto)
    setTransferSuccessMsg(`Dana Rp${payoutModalTxn.payoutAmount?.toLocaleString('id-ID')} beserta bukti transfer berhasil dikirim ke ${payoutModalTxn.ownerOrg}!`)
    setPayoutModalTxn(null)
    setAdminProofPhoto(null)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const handleApprovePaymentClick = (txnId) => {
    approvePaymentByAdmin(txnId)
    setTransferSuccessMsg(`Pembayaran QRIS ${txnId} BERHASIL DI-ACC! Status reservasi mahasiswa kini telah LUNAS dan siap diambil.`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const handleApproveEquipmentClick = (id) => {
    approveEquipmentByAdmin(id)
    setTransferSuccessMsg(`Barang #${id} disetujui dan SEKARANG LANGSUNG TAYANG di Marketplace!`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const handleRejectEquipmentClick = (id) => {
    rejectEquipmentByAdmin(id)
    setTransferSuccessMsg(`Barang #${id} telah ditolak dari antrean verifikasi.`)
    setTimeout(() => setTransferSuccessMsg(''), 4000)
  }

  const handleApproveReturnClick = (returnId, equipmentId, returnedQty, itemName) => {
    approveReturnByAdmin(returnId, equipmentId, returnedQty)
    setTransferSuccessMsg(`Pengembalian barang "${itemName}" di-ACC. Stok +${returnedQty} telah dikembalikan ke lokasi asalnya di Marketplace!`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const pendingQrisCount = transactions.filter(t => t.qrisStatus?.includes('Pending')).length
  const pendingPayoutCount = transactions.filter(t => t.payoutStatus === 'Pending Transfer').length
  const totalFundsInEscrow = transactions
    .filter(t => t.payoutStatus === 'Pending Transfer' || t.qrisStatus?.includes('Pending'))
    .reduce((sum, t) => sum + (t.payoutAmount || 0), 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Portal Khusus Admin & Pengelola EventLoop
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              EventLoop Admin & Escrow Hub 🏦
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Pusat kendali terpadu untuk memverifikasi screenshot pembayaran QRIS mahasiswa, menyetujui perlengkapan baru, memvalidasi pengembalian sesuai lokasi asal, dan mengirim bukti transfer payout ke pemilik barang.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-left min-w-[240px]">
            <span className="text-[11px] text-gray-300 uppercase font-semibold block">
              Dana Escrow / Rekber Aktif
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5 block">
              Rp{totalFundsInEscrow.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-gray-300 block mt-1">
              {pendingQrisCount} menunggu ACC • {pendingPayoutCount} siap transfer
            </span>
          </div>
        </div>
      </div>

      {transferSuccessMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in-up shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{transferSuccessMsg}</span>
          </div>
          <button onClick={() => setTransferSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'payouts'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Verifikasi QRIS & Payout Owner</span>
          {(pendingQrisCount + pendingPayoutCount) > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'payouts' ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingQrisCount + pendingPayoutCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Verifikasi Barang Masuk</span>
          {pendingApprovals.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'approvals' ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Verifikasi Pengembalian Barang</span>
          {pendingReturns.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'returns' ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingReturns.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PAYOUT & REKBER MANAGEMENT */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">
                  Daftar Transaksi Pembayaran QRIS & Penerusan Dana (Payout)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  1. Cek Screenshot Bukti Bayar Mahasiswa $\rightarrow$ 2. Klik ACC Pembayaran $\rightarrow$ 3. Transfer ke Owner & Upload Bukti Transfer.
                </p>
              </div>
              <span className="text-xs font-bold text-gray-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                Rekening Escrow: <strong>BCA 0829102830 a.n EventLoop Escrow</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4">ID Transaksi & Waktu</th>
                    <th className="p-4">Barang, Durasi & Penyewa</th>
                    <th className="p-4 text-right">Uang Masuk & Bukti SS</th>
                    <th className="p-4">Rekening Owner (Tujuan Payout)</th>
                    <th className="p-4 text-right">Net Payout (95%)</th>
                    <th className="p-4 text-center">Status & Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn) => {
                    const isPendingQris = txn.qrisStatus?.includes('Pending')
                    const isPendingTransfer = txn.payoutStatus === 'Pending Transfer'
                    return (
                      <tr key={txn.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4">
                          <div className="font-mono font-bold text-gray-900 text-xs">{txn.id}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{txn.paidAt}</div>
                          <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isPendingQris
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isPendingQris ? '⏳ Menunggu Verifikasi' : `✓ ${txn.qrisStatus}`}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-gray-900 text-xs">{txn.itemName}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Penyewa: <strong className="text-gray-800">{txn.buyerOrg}</strong>
                          </div>
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <Clock className="w-3 h-3" /> Durasi: {txn.durationDays || 1} Hari
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="font-black text-gray-900 text-sm">
                            Rp{txn.amount?.toLocaleString('id-ID')}
                          </div>
                          {txn.paymentProofPhoto ? (
                            <button
                              type="button"
                              onClick={() => setViewingProof({
                                title: `Bukti Transfer QRIS Mahasiswa (${txn.id})`,
                                photo: txn.paymentProofPhoto,
                                details: `Pembeli: ${txn.buyerOrg} • Total: Rp${txn.amount?.toLocaleString('id-ID')} (${txn.durationDays || 1} Hari)`
                              })}
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat Bukti SS</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 block mt-1 italic">
                              Terverifikasi Sistem
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-gray-800 text-xs">{txn.ownerOrg}</div>
                          <div className="text-[11px] font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-md mt-1 inline-block border border-gray-200">
                            {txn.ownerBank}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="font-black text-emerald-700 text-sm">
                            Rp{txn.payoutAmount?.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            (Fee 5%: Rp{txn.adminFee?.toLocaleString('id-ID')})
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {isPendingQris ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <button
                                onClick={() => handleApprovePaymentClick(txn.id)}
                                className="btn-primary text-[11px] !py-2 !px-3 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 shadow-md whitespace-nowrap cursor-pointer"
                                title="Klik untuk ACC bahwa uang sudah masuk ke Bank Admin"
                              >
                                <BadgeCheck className="w-3.5 h-3.5" />
                                <span>ACC Pembayaran QRIS</span>
                              </button>
                            </div>
                          ) : isPendingTransfer ? (
                            <button
                              onClick={() => openPayoutModal(txn)}
                              className="btn-primary text-[11px] !py-2 !px-3.5 flex items-center gap-1.5 mx-auto bg-emerald-700 hover:bg-emerald-800 whitespace-nowrap cursor-pointer shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Transfer & Upload Bukti</span>
                            </button>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Payout Selesai
                              </span>
                              {txn.payoutProofPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setViewingProof({
                                    title: `Bukti Payout Admin ke ${txn.ownerOrg}`,
                                    photo: txn.payoutProofPhoto,
                                    details: `Ref: ${txn.payoutRef || 'TRF-DONE'} • Nominal: Rp${txn.payoutAmount?.toLocaleString('id-ID')} • Tujuan: ${txn.ownerBank}`
                                  })}
                                  className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> Bukti Payout
                                </button>
                              )}
                              {txn.payoutRef && (
                                <div className="text-[9px] font-mono text-gray-400">{txn.payoutRef}</div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
              Periksa foto kondisi fisik, lokasi penyimpanan awal, dan kelayakan barang sebelum ditayangkan di Marketplace.
            </p>

            {pendingApprovals.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 shadow-2xs">
                    <div className="grid grid-cols-2 gap-2">
                      {item.imagePreview ? (
                        <div 
                          onClick={() => setViewingProof({
                            title: `Foto Fisik: ${item.name}`,
                            photo: item.imagePreview,
                            details: `Kondisi: ${item.condition} • Qty: ${item.qty} Unit`
                          })}
                          className="h-36 w-full rounded-xl overflow-hidden border border-gray-200 bg-white relative group cursor-pointer"
                        >
                          <div className="absolute top-0 inset-x-0 bg-black/60 text-white text-[9px] p-1 text-center font-bold">Foto Barang</div>
                          <img src={item.imagePreview} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="h-36 rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center text-gray-400 text-xs">
                          <span className="text-3xl mb-1">📦</span>
                          <span className="text-[10px]">Tanpa Foto Barang</span>
                        </div>
                      )}

                      {item.initialStoragePhoto ? (
                        <div 
                          onClick={() => setViewingProof({
                            title: `Foto Lokasi Penyimpanan: ${item.name}`,
                            photo: item.initialStoragePhoto,
                            details: `Lokasi: ${item.initialLocation || 'Warehouse Kampus'}`
                          })}
                          className="h-36 w-full rounded-xl overflow-hidden border border-gray-200 bg-white relative group cursor-pointer"
                        >
                          <div className="absolute top-0 inset-x-0 bg-blue-900/75 text-white text-[9px] p-1 text-center font-bold">Foto Lokasi / Rak</div>
                          <img src={item.initialStoragePhoto} alt="Rak" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="h-36 rounded-xl border border-dashed border-gray-200 bg-white flex flex-col items-center justify-center text-gray-400 text-xs p-2 text-center">
                          <MapPin className="w-5 h-5 mb-1 text-gray-300" />
                          <span className="text-[10px]">Foto rak belum dilampirkan</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {item.listingType === 'sale' || item.pricingType === 'sale' ? '🏷️ Dijual Preloved' : '🔄 Disewakan Harian'}
                        </span>
                        <h4 className="font-extrabold text-gray-900 text-base mt-1.5">{item.name}</h4>
                        <p className="text-xs text-gray-500">Pemilik: <strong>{item.uploader || item.owner || item.ownerOrg}</strong> • Qty: <strong>{item.qty} unit</strong></p>
                      </div>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
                        Score {item.circularScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3.5 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Tarif Sewa / Jual</span>
                        <span className="font-bold text-gray-900">
                          Rp{item.price?.toLocaleString('id-ID')} {item.pricingType !== 'sale' && '/ hari'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] block">Kondisi Fisik</span>
                        <span className="font-bold text-emerald-700">{item.condition}</span>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-gray-100">
                        <span className="text-gray-400 text-[10px] block">Lokasi Pengambilan & Pengembalian</span>
                        <span className="font-bold text-blue-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          {item.initialLocation || 'Warehouse Kampus Gedung C'}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-gray-100">
                        <span className="text-gray-400 text-[10px] block">Rekening Pencairan Payout</span>
                        <span className="font-mono font-semibold text-gray-800">{item.bankInfo || item.bankAccount || 'BCA 8012345678'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApproveEquipmentClick(item.id)}
                        className="flex-1 btn-primary text-xs !py-2.5 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui & Tayangkan</span>
                      </button>
                      <button
                        onClick={() => handleRejectEquipmentClick(item.id)}
                        className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 text-xs space-y-2">
                <Package className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-600 text-sm">Tidak ada antrean barang baru</p>
                <p>Semua pengajuan perlengkapan organisasi telah diperiksa.</p>
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
              Antrean Verifikasi Pengembalian Barang (Return Verification)
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Pastikan barang dikembalikan dalam kondisi baik dan diletakkan tepat di lokasi asalnya sebelum stok dikembalikan ke Marketplace.
            </p>

            {pendingReturns.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {pendingReturns.map((ret) => (
                  <div key={ret.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {ret.itemCode}
                        </span>
                        <h4 className="font-extrabold text-gray-900 text-base mt-1.5">{ret.itemName}</h4>
                        <p className="text-xs text-gray-500">Peminjam: <strong>{ret.borrower}</strong> • Jumlah: <strong>{ret.returnedQty} unit</strong></p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                        🕒 {ret.timestamp}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Lokasi Pengembalian Asal:</span>
                        <strong className="text-gray-900">{ret.returnLocation || 'Warehouse Kampus Gedung C (Rak B-04)'}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div 
                        onClick={() => setViewingProof({
                          title: `Bukti Kondisi Fisik: ${ret.itemName}`,
                          photo: ret.conditionPhoto,
                          details: `Peminjam: ${ret.borrower} • Waktu: ${ret.timestamp}`
                        })}
                        className="border border-gray-200 rounded-xl overflow-hidden relative group cursor-pointer bg-white"
                      >
                        <div className="absolute top-0 inset-x-0 bg-black/60 text-white text-[9px] p-1 text-center font-bold backdrop-blur-xs">
                          1. Bukti Kondisi Fisik (Klik Perbesar)
                        </div>
                        <img src={ret.conditionPhoto} alt="Fisik" className="h-32 w-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div 
                        onClick={() => setViewingProof({
                          title: `Bukti Lokasi Pengembalian: ${ret.itemName}`,
                          photo: ret.storagePhoto,
                          details: `Lokasi Asal: ${ret.returnLocation || 'Gudang Asal'} • Waktu: ${ret.timestamp}`
                        })}
                        className="border border-gray-200 rounded-xl overflow-hidden relative group cursor-pointer bg-white"
                      >
                        <div className="absolute top-0 inset-x-0 bg-emerald-900/75 text-white text-[9px] p-1 text-center font-bold backdrop-blur-xs">
                          2. Bukti di Lokasi Asal (Klik Perbesar)
                        </div>
                        <img src={ret.storagePhoto} alt="Rak" className="h-32 w-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <button
                      onClick={() => handleApproveReturnClick(ret.id, ret.equipmentId, ret.returnedQty, ret.itemName)}
                      className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ACC Pengembalian & Pulihkan Stok (+{ret.returnedQty} Unit)</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 text-xs space-y-2">
                <RotateCcw className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-600 text-sm">Belum ada antrean pengembalian barang</p>
                <p>Bukti pengembalian barang dari mahasiswa akan muncul di sini.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Rekber Workflow */}
      <div className="card p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-blue-200/70">
        <h4 className="font-extrabold text-blue-950 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700" />
          Alur Keamanan Transaksi & Sirkularitas EventLoop
        </h4>
        <div className="grid md:grid-cols-4 gap-3 text-xs text-blue-900 mt-3">
          <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <span className="font-bold block text-blue-700 mb-1">1. Bukti Bayar Mahasiswa</span>
            Penyewa membayar sesuai akumulasi hari event & wajib melampirkan screenshot bukti transfer QRIS.
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <span className="font-bold block text-blue-700 mb-1">2. Verifikasi Admin</span>
            Admin memeriksa screenshot pembayaran mahasiswa dan meng-ACC agar tiket pengambilan barang aktif.
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <span className="font-bold block text-blue-700 mb-1">3. Payout + Bukti Transfer</span>
            Admin mentransfer dana ke pemilik barang disertai upload bukti transfer yang dapat dilihat oleh owner.
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <span className="font-bold block text-blue-700 mb-1">4. Return ke Tempat Asal</span>
            Setelah event selesai, barang wajib dikembalikan ke tempat pengambilan asalnya dengan bukti foto ber-timestamp.
          </div>
        </div>
      </div>

      {/* MODAL 1: VIEW PROOF (PREVIEW BUKTI TRANSFER MAHASISWA / ADMIN / RETURN) */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                {viewingProof.title}
              </h4>
              <button onClick={() => setViewingProof(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm p-1">
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center max-h-80">
              <img src={viewingProof.photo} alt="Bukti" className="w-full h-auto object-contain max-h-80" />
            </div>

            {viewingProof.details && (
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 font-mono border border-gray-200">
                {viewingProof.details}
              </div>
            )}

            <button
              onClick={() => setViewingProof(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Tutup Preview
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
                <p className="text-xs text-gray-500 mt-0.5">ID Transaksi: {payoutModalTxn.id}</p>
              </div>
              <button onClick={() => setPayoutModalTxn(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm p-1">
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
              <div className="flex justify-between items-baseline pt-2 border-t border-emerald-200">
                <span className="text-emerald-800 font-bold">Nominal Net Payout (95%):</span>
                <span className="text-xl font-black text-emerald-700">Rp{payoutModalTxn.payoutAmount?.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Upload Bukti Transfer Admin */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5 text-left">
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
                    ✓ Foto Bukti Siap Dikirim
                  </span>
                </div>
              )}
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Bukti transfer ini akan langsung muncul di halaman <strong>Barang Saya</strong> milik organisasi pemilik barang sebagai bukti pencairan dana yang sah.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                disabled={!adminProofPhoto}
                onClick={handleConfirmPayoutWithProof}
                className="w-full btn-primary text-xs !py-3 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{adminProofPhoto ? 'Konfirmasi & Kirim Bukti ke Owner' : 'Upload Bukti Transfer Terlebih Dahulu'}</span>
              </button>
              <button
                onClick={() => setPayoutModalTxn(null)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 cursor-pointer"
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
