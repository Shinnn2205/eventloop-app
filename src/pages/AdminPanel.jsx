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
    setTransferSuccessMsg(`Dana Rp${payoutModalTxn.payoutAmount?.toLocaleString('id-ID')} beserta bukti transfer berhasil dikirim ke ${payoutModalTxn.ownerOrg}.`)
    setPayoutModalTxn(null)
    setAdminProofPhoto(null)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const handleApprovePaymentClick = (txnId) => {
    approvePaymentByAdmin(txnId)
    setTransferSuccessMsg(`Pembayaran QRIS ${txnId} telah disetujui. Status reservasi mahasiswa kini aktif.`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const handleApproveEquipmentClick = (id) => {
    approveEquipmentByAdmin(id)
    setTransferSuccessMsg(`Barang #${id} disetujui dan langsung tayang di Marketplace.`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const handleRejectEquipmentClick = (id) => {
    rejectEquipmentByAdmin(id)
    setTransferSuccessMsg(`Barang #${id} telah ditolak dari antrean verifikasi.`)
    setTimeout(() => setTransferSuccessMsg(''), 4000)
  }

  const handleApproveReturnClick = (returnId, equipmentId, returnedQty, itemName) => {
    approveReturnByAdmin(returnId, equipmentId, returnedQty)
    setTransferSuccessMsg(`Pengembalian "${itemName}" disetujui. Stok +${returnedQty} telah dikembalikan ke lokasi asalnya.`)
    setTimeout(() => setTransferSuccessMsg(''), 5000)
  }

  const pendingQrisCount = transactions.filter(t => t.qrisStatus?.includes('Pending')).length
  const pendingPayoutCount = transactions.filter(t => t.payoutStatus === 'Pending Transfer').length
  const totalFundsInEscrow = transactions
    .filter(t => t.payoutStatus === 'Pending Transfer' || t.qrisStatus?.includes('Pending'))
    .reduce((sum, t) => sum + (t.payoutAmount || 0), 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Cozy Admin Header */}
      <div className="bg-[#EAEFE9] border border-[#DCE5DF] p-6 sm:p-7 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#FAF9F5] text-[#3A6351] text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-[#DCE5DF]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Portal Pengelola EventLoop
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2D26] tracking-tight">
              Admin & Escrow Hub
            </h2>
            <p className="text-[#4E5E54] text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Kelola verifikasi bukti pembayaran QRIS mahasiswa, persetujuan perlengkapan baru, pengembalian sesuai lokasi asal, serta pengiriman bukti payout ke pemilik barang.
            </p>
          </div>

          <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#DCE5DF] text-left min-w-[230px]">
            <span className="text-[11px] text-[#6E7871] font-medium block">
              Dana Escrow Aktif
            </span>
            <span className="text-2xl font-bold text-[#264738] mt-0.5 block">
              Rp{totalFundsInEscrow.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-[#6E7871] block mt-1">
              {pendingQrisCount} verifikasi bayar · {pendingPayoutCount} siap payout
            </span>
          </div>
        </div>
      </div>

      {transferSuccessMsg && (
        <div className="p-4 bg-[#EAF0EC] border border-[#C5D6CD] rounded-2xl text-[#264738] text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#3A6351] flex-shrink-0" />
            <span>{transferSuccessMsg}</span>
          </div>
          <button onClick={() => setTransferSuccessMsg('')} className="text-[#3A6351] hover:text-[#1F2D26] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E6DF] pb-3">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'payouts'
              ? 'bg-[#3A6351] text-white'
              : 'bg-[#FAF9F5] text-[#5C645E] hover:bg-[#EFECE6] border border-[#E8E6DF]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pembayaran & Payout</span>
          {(pendingQrisCount + pendingPayoutCount) > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              activeTab === 'payouts' ? 'bg-white/20 text-white' : 'bg-[#F7F1E3] text-[#8A6116]'
            }`}>
              {pendingQrisCount + pendingPayoutCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-[#3A6351] text-white'
              : 'bg-[#FAF9F5] text-[#5C645E] hover:bg-[#EFECE6] border border-[#E8E6DF]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Verifikasi Barang Baru</span>
          {pendingApprovals.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              activeTab === 'approvals' ? 'bg-white/20 text-white' : 'bg-[#F7F1E3] text-[#8A6116]'
            }`}>
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-[#3A6351] text-white'
              : 'bg-[#FAF9F5] text-[#5C645E] hover:bg-[#EFECE6] border border-[#E8E6DF]'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Verifikasi Pengembalian</span>
          {pendingReturns.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              activeTab === 'returns' ? 'bg-white/20 text-white' : 'bg-[#F7F1E3] text-[#8A6116]'
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
            <div className="p-5 border-b border-[#ECEAE3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F6F5F0]">
              <div>
                <h3 className="font-semibold text-[#2C332E] text-sm">
                  Daftar Transaksi QRIS & Pencairan Dana (Payout)
                </h3>
                <p className="text-xs text-[#6E7871] mt-0.5">
                  Periksa bukti bayar mahasiswa, setujui pembayaran, lalu teruskan dana ke pemilik barang beserta bukti transfer.
                </p>
              </div>
              <span className="text-xs text-[#5C645E] bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-[#E8E6DF]">
                Escrow: <strong className="text-[#2C332E]">BCA 0829102830</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ECEAE3] bg-[#FAF9F5] text-[#8A938C] font-medium">
                    <th className="p-4">ID & Waktu</th>
                    <th className="p-4">Barang, Durasi & Penyewa</th>
                    <th className="p-4 text-right">Total & Bukti Bayar</th>
                    <th className="p-4">Rekening Pemilik</th>
                    <th className="p-4 text-right">Net Payout (95%)</th>
                    <th className="p-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEAE3]">
                  {transactions.map((txn) => {
                    const isPendingQris = txn.qrisStatus?.includes('Pending')
                    const isPendingTransfer = txn.payoutStatus === 'Pending Transfer'
                    return (
                      <tr key={txn.id} className="hover:bg-[#F6F5F0]/60 transition-colors">
                        <td className="p-4">
                          <div className="font-mono font-semibold text-[#2C332E] text-xs">{txn.id}</div>
                          <div className="text-[11px] text-[#8A938C] mt-0.5">{txn.paidAt}</div>
                          <span className={`inline-block mt-1 ${isPendingQris ? 'badge-warm' : 'badge-sage'}`}>
                            {isPendingQris ? 'Menunggu ACC' : txn.qrisStatus}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-[#2C332E] text-xs">{txn.itemName}</div>
                          <div className="text-[11px] text-[#6E7871] mt-0.5">
                            Penyewa: <strong className="text-[#2C332E]">{txn.buyerOrg}</strong>
                          </div>
                          <span className="badge-stone mt-1">
                            <Clock className="w-3 h-3" /> {txn.durationDays || 1} hari
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="font-bold text-[#2C332E] text-sm">
                            Rp{txn.amount?.toLocaleString('id-ID')}
                          </div>
                          {txn.paymentProofPhoto ? (
                            <button
                              type="button"
                              onClick={() => setViewingProof({
                                title: `Bukti Pembayaran QRIS (${txn.id})`,
                                photo: txn.paymentProofPhoto,
                                details: `Penyewa: ${txn.buyerOrg} · Nominal: Rp${txn.amount?.toLocaleString('id-ID')} (${txn.durationDays || 1} hari)`
                              })}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#3A6351] bg-[#EAF0EC] hover:bg-[#DCE7E0] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat Bukti SS</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#8A938C] block mt-1">
                              Terverifikasi
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-[#2C332E] text-xs">{txn.ownerOrg}</div>
                          <div className="text-[11px] font-mono text-[#5C645E] bg-[#F6F5F0] px-2 py-0.5 rounded-md mt-1 inline-block border border-[#E8E6DF]">
                            {txn.ownerBank}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="font-bold text-[#3A6351] text-sm">
                            Rp{txn.payoutAmount?.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-[#8A938C]">
                            Fee 5%: Rp{txn.adminFee?.toLocaleString('id-ID')}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {isPendingQris ? (
                            <button
                              onClick={() => handleApprovePaymentClick(txn.id)}
                              className="btn-primary text-[11px] !py-2 !px-3 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              <BadgeCheck className="w-3.5 h-3.5" />
                              <span>Setujui Pembayaran</span>
                            </button>
                          ) : isPendingTransfer ? (
                            <button
                              onClick={() => openPayoutModal(txn)}
                              className="btn-primary text-[11px] !py-2 !px-3 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Transfer & Upload Bukti</span>
                            </button>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="badge-sage">
                                <CheckCircle2 className="w-3 h-3" /> Selesai
                              </span>
                              {txn.payoutProofPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setViewingProof({
                                    title: `Bukti Payout ke ${txn.ownerOrg}`,
                                    photo: txn.payoutProofPhoto,
                                    details: `Ref: ${txn.payoutRef || 'TRF-DONE'} · Nominal: Rp${txn.payoutAmount?.toLocaleString('id-ID')}`
                                  })}
                                  className="text-[11px] font-medium text-[#3A6351] hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> Bukti Transfer
                                </button>
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
        <div className="card p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-[#2C332E] text-sm">
              Antrean Verifikasi Perlengkapan Baru
            </h3>
            <p className="text-xs text-[#6E7871] mt-0.5">
              Periksa foto fisik dan lokasi penyimpanan sebelum barang ditayangkan di Marketplace.
            </p>
          </div>

          {pendingApprovals.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl border border-[#E8E6DF] bg-[#F6F5F0] space-y-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    {item.imagePreview ? (
                      <div 
                        onClick={() => setViewingProof({
                          title: `Foto Fisik: ${item.name}`,
                          photo: item.imagePreview,
                          details: `Kondisi: ${item.condition} · Jumlah: ${item.qty} unit`
                        })}
                        className="h-32 w-full rounded-xl overflow-hidden border border-[#E8E6DF] bg-[#FAF9F5] relative group cursor-pointer"
                      >
                        <div className="absolute top-1.5 left-1.5 bg-[#FAF9F5]/90 text-[#2C332E] text-[10px] px-2 py-0.5 rounded-md font-medium">Foto Barang</div>
                        <img src={item.imagePreview} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-32 rounded-xl border border-[#E8E6DF] bg-[#FAF9F5] flex flex-col items-center justify-center text-[#8A938C] text-xs">
                        <span className="text-2xl mb-1">📦</span>
                        <span className="text-[10px]">Tanpa Foto</span>
                      </div>
                    )}

                    {item.initialStoragePhoto ? (
                      <div 
                        onClick={() => setViewingProof({
                          title: `Foto Lokasi Penyimpanan: ${item.name}`,
                          photo: item.initialStoragePhoto,
                          details: `Lokasi: ${item.initialLocation || 'Warehouse Kampus'}`
                        })}
                        className="h-32 w-full rounded-xl overflow-hidden border border-[#E8E6DF] bg-[#FAF9F5] relative group cursor-pointer"
                      >
                        <div className="absolute top-1.5 left-1.5 bg-[#FAF9F5]/90 text-[#2C332E] text-[10px] px-2 py-0.5 rounded-md font-medium">Foto Lokasi</div>
                        <img src={item.initialStoragePhoto} alt="Rak" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-32 rounded-xl border border-dashed border-[#D5D1C8] bg-[#FAF9F5] flex flex-col items-center justify-center text-[#8A938C] text-xs p-2 text-center">
                        <MapPin className="w-4 h-4 mb-1" />
                        <span className="text-[10px]">Tanpa foto lokasi</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="badge-stone">
                        {item.listingType === 'sale' || item.pricingType === 'sale' ? 'Preloved' : 'Sewa Harian'}
                      </span>
                      <h4 className="font-semibold text-[#2C332E] text-base mt-1.5">{item.name}</h4>
                      <p className="text-xs text-[#6E7871]">Pemilik: <strong>{item.uploader || item.owner || item.ownerOrg}</strong> · {item.qty} unit</p>
                    </div>
                    <span className="badge-sage">
                      Score {item.circularScore}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E6DF]">
                    <div>
                      <span className="text-[#8A938C] text-[10px] block">Tarif</span>
                      <span className="font-semibold text-[#2C332E]">
                        Rp{item.price?.toLocaleString('id-ID')} {item.pricingType !== 'sale' && '/ hari'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A938C] text-[10px] block">Kondisi</span>
                      <span className="font-semibold text-[#3A6351]">{item.condition}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-[#ECEAE3]">
                      <span className="text-[#8A938C] text-[10px] block">Lokasi Pengambilan & Pengembalian</span>
                      <span className="font-medium text-[#2C332E] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#3A6351] flex-shrink-0" />
                        {item.initialLocation || 'Warehouse Kampus Gedung C'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveEquipmentClick(item.id)}
                      className="flex-1 btn-primary text-xs !py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui & Tayangkan</span>
                    </button>
                    <button
                      onClick={() => handleRejectEquipmentClick(item.id)}
                      className="px-4 py-2.5 rounded-xl border border-[#E8D4D4] text-[#9E3B3B] hover:bg-[#F9EFEF] text-xs font-medium transition-colors cursor-pointer"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-[#8A938C] text-xs space-y-2">
              <Package className="w-8 h-8 mx-auto" />
              <p className="font-medium text-[#5C645E]">Tidak ada antrean barang baru</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERIFIKASI PENGEMBALIAN BARANG (RETURN) */}
      {activeTab === 'returns' && (
        <div className="card p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-[#2C332E] text-sm">
              Verifikasi Pengembalian Barang ke Lokasi Asal
            </h3>
            <p className="text-xs text-[#6E7871] mt-0.5">
              Pastikan barang telah diletakkan kembali di tempat pengambilannya sebelum memulihkan stok.
            </p>
          </div>

          {pendingReturns.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {pendingReturns.map((ret) => (
                <div key={ret.id} className="p-5 rounded-2xl border border-[#E8E6DF] bg-[#F6F5F0] space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="badge-stone">{ret.itemCode}</span>
                      <h4 className="font-semibold text-[#2C332E] text-base mt-1.5">{ret.itemName}</h4>
                      <p className="text-xs text-[#6E7871]">Peminjam: <strong>{ret.borrower}</strong> · {ret.returnedQty} unit</p>
                    </div>
                    <span className="text-[11px] text-[#6E7871] bg-[#FAF9F5] px-2.5 py-1 rounded-lg border border-[#E8E6DF]">
                      {ret.timestamp}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E6DF] text-xs flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#3A6351] flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-[#8A938C] block">Lokasi Pengembalian Asal:</span>
                      <strong className="text-[#2C332E]">{ret.returnLocation || 'Warehouse Kampus Gedung C'}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div 
                      onClick={() => setViewingProof({
                        title: `Kondisi Fisik: ${ret.itemName}`,
                        photo: ret.conditionPhoto,
                        details: `Peminjam: ${ret.borrower} · Waktu: ${ret.timestamp}`
                      })}
                      className="border border-[#E8E6DF] rounded-xl overflow-hidden relative group cursor-pointer bg-[#FAF9F5]"
                    >
                      <div className="absolute top-1.5 left-1.5 bg-[#FAF9F5]/90 text-[#2C332E] text-[10px] px-2 py-0.5 rounded-md font-medium">
                        1. Kondisi Fisik
                      </div>
                      <img src={ret.conditionPhoto} alt="Fisik" className="h-32 w-full object-cover" />
                    </div>
                    <div 
                      onClick={() => setViewingProof({
                        title: `Lokasi Simpan: ${ret.itemName}`,
                        photo: ret.storagePhoto,
                        details: `Lokasi Asal: ${ret.returnLocation || 'Gudang Asal'}`
                      })}
                      className="border border-[#E8E6DF] rounded-xl overflow-hidden relative group cursor-pointer bg-[#FAF9F5]"
                    >
                      <div className="absolute top-1.5 left-1.5 bg-[#FAF9F5]/90 text-[#2C332E] text-[10px] px-2 py-0.5 rounded-md font-medium">
                        2. Lokasi Asal
                      </div>
                      <img src={ret.storagePhoto} alt="Rak" className="h-32 w-full object-cover" />
                    </div>
                  </div>

                  <button
                    onClick={() => handleApproveReturnClick(ret.id, ret.equipmentId, ret.returnedQty, ret.itemName)}
                    className="w-full btn-primary text-xs !py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui Pengembalian & Pulihkan Stok (+{ret.returnedQty})</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-[#8A938C] text-xs space-y-2">
              <RotateCcw className="w-8 h-8 mx-auto" />
              <p className="font-medium text-[#5C645E]">Belum ada antrean pengembalian barang</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: VIEW PROOF */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 bg-[#1F2421]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E8E6DF] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEAE3]">
              <h4 className="font-bold text-[#2C332E] text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#3A6351]" />
                {viewingProof.title}
              </h4>
              <button onClick={() => setViewingProof(null)} className="text-[#8A938C] hover:text-[#2C332E] p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#E8E6DF] bg-[#F3F1EA] flex items-center justify-center max-h-80">
              <img src={viewingProof.photo} alt="Bukti" className="w-full h-auto object-contain max-h-80" />
            </div>

            {viewingProof.details && (
              <div className="p-3 bg-[#F6F5F0] rounded-xl text-xs text-[#5C645E] border border-[#E8E6DF]">
                {viewingProof.details}
              </div>
            )}

            <button
              onClick={() => setViewingProof(null)}
              className="w-full btn-primary !py-2.5 text-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSFER PAYOUT & UPLOAD BUKTI TRANSFER DARI ADMIN KE OWNER */}
      {payoutModalTxn && (
        <div className="fixed inset-0 z-50 bg-[#1F2421]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E8E6DF] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEAE3]">
              <div>
                <h4 className="font-bold text-[#2C332E] text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#3A6351]" />
                  Kirim Payout ke Pemilik Barang
                </h4>
                <p className="text-xs text-[#6E7871] mt-0.5">ID Transaksi: {payoutModalTxn.id}</p>
              </div>
              <button onClick={() => setPayoutModalTxn(null)} className="text-[#8A938C] hover:text-[#2C332E] p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#EAF0EC] border border-[#DCE5DF] p-4 rounded-xl text-xs space-y-2 text-[#264738]">
              <div className="flex justify-between">
                <span className="text-[#4B6B5C]">Pemilik:</span>
                <strong>{payoutModalTxn.ownerOrg}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4B6B5C]">Rekening Tujuan:</span>
                <strong className="font-mono bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#DCE5DF]">{payoutModalTxn.ownerBank}</strong>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#DCE5DF]">
                <span className="text-[#4B6B5C] font-medium">Nominal Net Payout (95%):</span>
                <span className="text-lg font-bold text-[#264738]">Rp{payoutModalTxn.payoutAmount?.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="p-4 bg-[#F6F5F0] border border-[#E8E6DF] rounded-xl space-y-2.5 text-left">
              <label className="block text-xs font-semibold text-[#2C332E] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#3A6351]" />
                  Upload Bukti Transfer Bank
                </span>
                <span className="text-[10px] text-[#8A6116] font-medium">Wajib</span>
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
                className="w-full text-xs text-[#6E7871] file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#3A6351] file:text-white hover:file:bg-[#2E5041] cursor-pointer"
              />

              {adminProofPhoto && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-[#DCE5DF] max-h-36 bg-[#FAF9F5] flex items-center justify-center">
                  <img src={adminProofPhoto} alt="Bukti Transfer Admin" className="w-full h-auto object-contain max-h-36" />
                  <span className="absolute bottom-1.5 right-1.5 bg-[#3A6351] text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    Siap Dikirim
                  </span>
                </div>
              )}
              <p className="text-[11px] text-[#8A938C] leading-relaxed">
                Bukti transfer ini akan tampil di halaman <strong>Barang Saya</strong> milik pemilik perlengkapan.
              </p>
            </div>

            <div className="pt-1 space-y-2">
              <button
                disabled={!adminProofPhoto}
                onClick={handleConfirmPayoutWithProof}
                className="w-full btn-primary text-xs !py-2.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{adminProofPhoto ? 'Konfirmasi & Kirim Bukti ke Owner' : 'Upload Bukti Transfer Terlebih Dahulu'}</span>
              </button>
              <button
                onClick={() => setPayoutModalTxn(null)}
                className="w-full text-xs text-[#8A938C] hover:text-[#2C332E] py-1 cursor-pointer"
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
