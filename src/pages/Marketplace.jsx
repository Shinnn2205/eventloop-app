import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Leaf, 
  Plus, 
  Check, 
  Info, 
  Settings2,
  Trash2,
  Package,
  MapPin,
  Lock,
  Calendar,
  ArrowRight,
  ShoppingBag
} from 'lucide-react'

export default function Marketplace() {
  const { 
    currentUserRole, 
    equipments, 
    updateEquipmentPriceAndStock, 
    deleteEquipment, 
    cartItems, 
    addToCart, 
    removeFromCart, 
    activeReservation,
    userPaymentStatus 
  } = useApp()

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [listingFilter, setListingFilter] = useState('all') 
  const [editingItem, setEditingItem] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')

  const isLockedByActivePayment = currentUserRole === 'user' && userPaymentStatus !== 'idle'
  const durationDays = Math.max(1, parseInt(activeReservation?.durationDays) || 1)

  // Kategori dinamis dari data equipments di Supabase
  const dynamicCategories = useMemo(() => {
    const uniqueCats = Array.from(new Set(equipments.map(e => e.category).filter(Boolean)))
    return [
      { name: 'All', icon: '📦', count: equipments.length },
      ...uniqueCats.map(catName => ({
        name: catName,
        icon: catName.toLowerCase().includes('booth') ? '🏗️' :
              catName.toLowerCase().includes('signage') || catName.toLowerCase().includes('banner') ? '🪧' :
              catName.toLowerCase().includes('furniture') || catName.toLowerCase().includes('meja') ? '🪑' :
              catName.toLowerCase().includes('elektronik') || catName.toLowerCase().includes('sound') || catName.toLowerCase().includes('led') ? '💡' :
              catName.toLowerCase().includes('tenda') ? '⛺' :
              catName.toLowerCase().includes('dekorasi') ? '🌿' : '📦',
        count: equipments.filter(e => e.category === catName).length
      }))
    ]
  }, [equipments])

  const filteredEquipment = equipments.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.material && item.material.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesScore = (item.circularScore || 0) >= minScore
    const matchesType = listingFilter === 'all' || 
                        (listingFilter === 'sale' && item.listingType === 'sale') ||
                        (listingFilter === 'rental' && item.listingType !== 'sale')
    return matchesCategory && matchesSearch && matchesScore && matchesType
  })

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (editingItem && currentUserRole === 'admin') {
      updateEquipmentPriceAndStock(editingItem.id, editPrice, editStock)
      setEditingItem(null)
    }
  }

  const handleDelete = () => {
    if (editingItem && currentUserRole === 'admin' && window.confirm(`Apakah Anda yakin ingin MENGHAPUS PERMANEN barang "${editingItem.name}" dari Marketplace?`)) {
      deleteEquipment(editingItem.id)
      setEditingItem(null)
    }
  }

  const toggleReserve = (item) => {
    if (isLockedByActivePayment) return
    const isReserved = cartItems.some(cartItem => cartItem.id === item.id)
    if (isReserved) {
      removeFromCart(item.id)
    } else {
      addToCart(item, 1)
    }
  }

  const estimatedCartTotal = cartItems.reduce((sum, item) => {
    const unitPrice = item.listingType === 'sale' ? (item.salePrice || item.price) : item.price
    return sum + (item.listingType === 'sale' ? unitPrice * item.qty : unitPrice * item.qty * durationDays)
  }, 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-1">
            <Leaf className="w-3.5 h-3.5" /> Circular Equipment Marketplace
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Katalog Perlengkapan Event Kampus
          </h2>
          <p className="text-sm text-gray-500">
            {currentUserRole === 'admin' ? 'Kelola stok, tarif harian, dan penghapusan barang secara global.' : 'Pilih equipment modular, cek lokasi pengambilan, dan reservasi untuk event organisasimu.'}
          </p>
        </div>

        {/* HANYA MUNCUL JIKA USER BIASA */}
        {currentUserRole === 'user' && (
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              to="/my-equipment" 
              className="btn-secondary text-sm !py-2.5 !px-4 flex items-center gap-2 border-blue-200 text-blue-800 hover:bg-blue-50"
            >
              <Package className="w-4 h-4" />
              <span>Barang & Payout Saya</span>
            </Link>
            <Link 
              to="/upload-equipment" 
              className="btn-secondary text-sm !py-2.5 !px-4 flex items-center gap-2 border-green-200 text-green-800 hover:bg-green-50"
            >
              <span>+ Upload Barang</span>
            </Link>
            <Link 
              to="/reservation" 
              className="btn-primary text-sm !py-2.5 !px-5 flex items-center gap-2"
            >
              <span>Reservasi Saya ({isLockedByActivePayment ? (activeReservation?.items?.length || 0) : cartItems.length})</span>
            </Link>
          </div>
        )}
      </div>

      {/* BANNER STATUS EVENT & BATASAN 1 AKUN 1 EVENT */}
      {currentUserRole === 'user' && (
        isLockedByActivePayment ? (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-amber-950 flex items-center gap-2">
                  <span>Reservasi Terkunci — Akun Anda Memiliki 1 Event Aktif: <strong>{activeReservation?.eventName || 'Event Kampus'}</strong></span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Sesuai aturan 1 Akun = 1 Event, Anda tidak dapat membuat reservasi baru sebelum seluruh barang event saat ini selesai dikembalikan atau di-reset.
                </p>
              </div>
            </div>
            <Link to="/reservation" className="btn-primary text-xs !py-2 !px-4 whitespace-nowrap self-end sm:self-auto font-bold bg-amber-600 hover:bg-amber-700">
              Lihat Tiket Reservasi Aktif
            </Link>
          </div>
        ) : activeReservation?.eventName ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-lg">
                🗓️
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900 flex flex-wrap items-center gap-2">
                  <span>Event Terjadwal: <strong>{activeReservation.eventName}</strong></span>
                  <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                    Durasi: {durationDays} Hari
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Biaya sewa peralatan di bawah akan diakumulasikan otomatis dengan {durationDays} hari peminjaman saat checkout.
                </p>
              </div>
            </div>
            <Link to="/reservation" className="btn-primary text-xs !py-2 !px-3.5 whitespace-nowrap self-end sm:self-auto font-bold">
              Buka Checkout ({cartItems.length} Item)
            </Link>
          </div>
        ) : (
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-950">
                  Belum Mengatur Jadwal & Durasi Hari Event?
                </div>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Buat Event terlebih dahulu agar sistem dapat menghitung akumulasi biaya sewa per hari secara otomatis.
                </p>
              </div>
            </div>
            <Link to="/create-event" className="btn-secondary text-xs !py-2 !px-3.5 whitespace-nowrap self-end sm:self-auto font-bold bg-white border-blue-300 text-blue-800 hover:bg-blue-100">
              + Buat Event Sekarang
            </Link>
          </div>
        )
      )}

      {/* Filter Chips & Search Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama barang (cth. Standing Banner, Booth, Sound System) atau bahan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>

          {/* Listing Type & Circular Score Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setListingFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${listingFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600'}`}
              >
                Semua ({equipments.length})
              </button>
              <button
                onClick={() => setListingFilter('rental')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${listingFilter === 'rental' ? 'bg-green-600 text-white shadow-2xs font-bold' : 'text-gray-600'}`}
              >
                🔄 Sewa Harian
              </button>
              <button
                onClick={() => setListingFilter('sale')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${listingFilter === 'sale' ? 'bg-amber-600 text-white shadow-2xs font-bold' : 'text-gray-600'}`}
              >
                🏷️ Beli Preloved
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-600 font-medium">Min. Score:</span>
              <select 
                value={minScore} 
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-transparent font-bold text-green-700 outline-none cursor-pointer"
              >
                <option value={0}>Semua (0+)</option>
                <option value={80}>Tinggi (80+)</option>
                <option value={90}>Sangat Tinggi (90+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Tab Pill */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {dynamicCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name} ({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEquipment.map((item) => {
          const isReserved = cartItems.some(cartItem => cartItem.id === item.id)
          return (
            <div 
              key={item.id} 
              className="card overflow-hidden flex flex-col group border-gray-200/70 hover:border-green-300 transition-all"
            >
              <Link to={`/equipment/${item.id}`} className="bg-gradient-to-br from-gray-50 via-gray-100 to-green-50/30 h-44 flex items-center justify-center relative border-b border-gray-100 overflow-hidden block">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                    {item.image || '📦'}
                  </span>
                )}
                <div 
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm backdrop-blur bg-white/90 ${
                    (item.circularScore || 0) >= 90
                      ? 'text-green-800 border border-green-300'
                      : (item.circularScore || 0) >= 80
                      ? 'text-emerald-800 border border-emerald-300'
                      : 'text-amber-800 border border-amber-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-green-600" />
                  <span>{item.circularScore || 85}</span>
                  <span className="text-[10px] font-normal opacity-70">/100</span>
                </div>
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-600 border border-gray-200 max-w-[60%] truncate">
                  {item.owner || 'Kampus'}
                </div>
              </Link>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span>Stok: <strong className="text-gray-900">{item.available}</strong>/{item.total}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-green-700 transition-colors line-clamp-1">
                    <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>

                  <div className="mt-2.5 flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 truncate">
                    <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="truncate" title={item.lastLocation}>{item.lastLocation || 'Warehouse Kampus Gedung C'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-gray-400">
                      {item.listingType === 'sale' ? 'Harga Jual' : 'Sewa / Hari'}
                    </div>
                    <div className="text-base font-black text-gray-900 flex items-baseline gap-1">
                      <span>Rp{(item.listingType === 'sale' ? (item.salePrice || item.price) : item.price).toLocaleString('id-ID')}</span>
                      {item.listingType !== 'sale' && (
                        <span className="text-[11px] text-gray-500 font-normal">/ hari</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* TOMBOL GEAR (EDIT/DELETE) HANYA UNTUK ADMIN */}
                    {currentUserRole === 'admin' && (
                      <button
                        onClick={() => {
                          setEditingItem(item)
                          setEditPrice(item.listingType === 'sale' ? (item.salePrice || item.price) : item.price)
                          setEditStock(item.available)
                        }}
                        className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                        title="Admin Control: Edit Stok atau Hapus Barang"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <Link
                      to={`/equipment/${item.id}`}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      title="Lihat Detail & Lokasi"
                    >
                      <Info className="w-4 h-4" />
                    </Link>

                    {/* HANYA MUNCUL JIKA USER BIASA */}
                    {currentUserRole === 'user' && (
                      <button
                        disabled={isLockedByActivePayment || (item.available <= 0 && !isReserved)}
                        onClick={() => toggleReserve(item)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isLockedByActivePayment
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : isReserved
                            ? 'bg-green-700 text-white shadow-xs'
                            : item.available <= 0 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : item.listingType === 'sale'
                            ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                            : 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {isLockedByActivePayment ? (
                          <><Lock className="w-3 h-3" /><span>Terkunci</span></>
                        ) : isReserved ? (
                          <><Check className="w-3.5 h-3.5" /><span>Dipilih</span></>
                        ) : item.available <= 0 ? (
                          <span>Habis</span>
                        ) : item.listingType === 'sale' ? (
                          <span>Beli Preloved</span>
                        ) : (
                          <><Plus className="w-3.5 h-3.5" /><span>Pilih</span></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="card p-12 text-center text-gray-400 space-y-2">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <h4 className="font-bold text-gray-700">Tidak ada perlengkapan yang cocok</h4>
          <p className="text-xs text-gray-500">Coba ubah filter pencarian atau pilih kategori lain.</p>
        </div>
      )}

      {/* FLOATING STICKY CART BAR UNTUK KENYAMANAN CHECKOUT */}
      {currentUserRole === 'user' && !isLockedByActivePayment && cartItems.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 lg:left-72 lg:right-8 z-40 max-w-5xl mx-auto">
          <div className="bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center font-black text-white shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{cartItems.length} Jenis Perlengkapan Dipilih</span>
                  <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full text-[10px] border border-green-500/30">
                    Durasi {durationDays} Hari
                  </span>
                </div>
                <div className="text-xs text-gray-300 mt-0.5">
                  Estimasi Total Akumulasi: <strong className="text-green-400 text-sm">Rp{estimatedCartTotal.toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </div>

            <Link
              to="/reservation"
              className="w-full sm:w-auto btn-primary text-xs !py-3 !px-6 flex items-center justify-center gap-2 font-bold shadow-lg shadow-green-600/30"
            >
              <span>Lanjut ke Reservasi & Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* QUICK EDIT MODAL DENGAN TOMBOL HAPUS (ADMIN ONLY) */}
      {editingItem && currentUserRole === 'admin' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-amber-600" />
                <h4 className="font-extrabold text-gray-900 text-sm">
                  Admin Edit: {editingItem.name}
                </h4>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  {editingItem.listingType === 'sale' ? 'Harga Jual (Rp)' : 'Tarif Sewa / Hari (Rp)'}
                </label>
                <input
                  type="number"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Ubah / Tambah Stok Tersedia (Unit)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 text-sm"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full btn-primary text-xs !py-3 cursor-pointer">Simpan Perubahan</button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Barang dari Sistem</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
