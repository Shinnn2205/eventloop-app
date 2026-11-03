import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Search, 
  Plus, 
  Check, 
  Info, 
  Settings2,
  Trash2,
  Package,
  MapPin,
  Lock,
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
  const [listingFilter, setListingFilter] = useState('all') 
  const [editingItem, setEditingItem] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')

  const isLockedByActivePayment = currentUserRole === 'user' && userPaymentStatus !== 'idle'
  const durationDays = Math.max(1, parseInt(activeReservation?.durationDays) || 1)

  const dynamicCategories = useMemo(() => {
    const uniqueCats = Array.from(new Set(equipments.map(e => e.category).filter(Boolean)))
    return [
      { name: 'All', label: 'Semua', count: equipments.length },
      ...uniqueCats.map(catName => ({
        name: catName,
        label: catName,
        count: equipments.filter(e => e.category === catName).length
      }))
    ]
  }, [equipments])

  const filteredEquipment = equipments.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.material && item.material.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = listingFilter === 'all' || 
                        (listingFilter === 'sale' && item.listingType === 'sale') ||
                        (listingFilter === 'rental' && item.listingType !== 'sale')
    return matchesCategory && matchesSearch && matchesType
  })

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (editingItem && currentUserRole === 'admin') {
      updateEquipmentPriceAndStock(editingItem.id, editPrice, editStock)
      setEditingItem(null)
    }
  }

  const handleDelete = () => {
    if (editingItem && currentUserRole === 'admin' && window.confirm(`Hapus barang "${editingItem.name}" dari katalog?`)) {
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
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-[#3A6351]">Katalog Sirkular Kampus</span>
          <h2 className="text-2xl font-bold text-[#232925] mt-0.5">
            Perlengkapan Kegiatan
          </h2>
          <p className="text-sm text-[#5C645E] mt-0.5">
            {currentUserRole === 'admin' 
              ? 'Kelola ketersediaan stok dan tarif sewa harian peralatan.' 
              : 'Pilih peralatan yang dibutuhkan beserta informasi lokasi pengambilannya.'}
          </p>
        </div>

        {currentUserRole === 'user' && (
          <div className="flex flex-wrap items-center gap-2.5">
            {activeReservation?.eventName && !isLockedByActivePayment && (
              <span className="badge-sage py-2 px-3">
                Event: {activeReservation.eventName} ({durationDays} Hari)
              </span>
            )}
            <Link to="/upload-equipment" className="btn-secondary text-xs !py-2 !px-3.5">
              + Pinjamkan Barang
            </Link>
            <Link to="/reservation" className="btn-primary text-xs !py-2 !px-4">
              Reservasi ({isLockedByActivePayment ? (activeReservation?.items?.length || 0) : cartItems.length})
            </Link>
          </div>
        )}
      </div>

      {/* Info halus jika sudah ada reservasi aktif yang mengunci */}
      {isLockedByActivePayment && (
        <div className="p-4 bg-[#F7F1E3] border border-[#E5D8BD] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6E4D1F]">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 flex-shrink-0 text-[#855D27]" />
            <span>
              Akun Anda sedang memiliki reservasi aktif untuk event <strong>{activeReservation?.eventName}</strong>. Selesaikan event saat ini sebelum membuat reservasi baru.
            </span>
          </div>
          <Link to="/reservation" className="font-semibold underline whitespace-nowrap">
            Lihat Reservasi →
          </Link>
        </div>
      )}

      {/* Bar Pencarian & Filter Sederhana */}
      <div className="card p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A928C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari perlengkapan (mis. Banner, Booth, Sound System)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cozy-input !pl-10 !py-2"
            />
          </div>

          <div className="flex items-center bg-[#F3F1EA] p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setListingFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${listingFilter === 'all' ? 'bg-white text-[#232925] shadow-2xs font-semibold' : 'text-[#5C645E]'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setListingFilter('rental')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${listingFilter === 'rental' ? 'bg-white text-[#232925] shadow-2xs font-semibold' : 'text-[#5C645E]'}`}
            >
              Sewa Harian
            </button>
            <button
              onClick={() => setListingFilter('sale')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${listingFilter === 'sale' ? 'bg-white text-[#232925] shadow-2xs font-semibold' : 'text-[#5C645E]'}`}
            >
              Beli Preloved
            </button>
          </div>
        </div>

        {/* Kategori */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {dynamicCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-[#3A6351] text-white'
                  : 'bg-[#F3F1EA] text-[#5C645E] hover:bg-[#E8E5DC]'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Grid Barang */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredEquipment.map((item) => {
          const isReserved = cartItems.some(cartItem => cartItem.id === item.id)
          return (
            <div 
              key={item.id} 
              className="card overflow-hidden flex flex-col justify-between hover:border-[#C8C5B9]"
            >
              <div>
                <Link to={`/equipment/${item.id}`} className="bg-[#F3F1EA] h-44 flex items-center justify-center relative overflow-hidden block">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl opacity-85">{item.image || '📦'}</span>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-lg text-[11px] font-semibold text-[#3A6351] border border-[#E2E0D8]">
                    Score {item.circularScore || 85}
                  </div>
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-lg text-[10px] font-medium text-[#5C645E] border border-[#E2E0D8] max-w-[60%] truncate">
                    {item.owner || 'Kampus'}
                  </div>
                </Link>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#7A827C]">
                    <span>{item.category}</span>
                    <span>Tersedia <strong className="text-[#232925]">{item.available}</strong>/{item.total}</span>
                  </div>

                  <h3 className="font-semibold text-[#232925] text-sm line-clamp-1">
                    <Link to={`/equipment/${item.id}`} className="hover:text-[#3A6351]">{item.name}</Link>
                  </h3>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#5C645E] bg-[#FAF9F5] px-2.5 py-1.5 rounded-lg border border-[#ECEAE2] truncate">
                    <MapPin className="w-3 h-3 text-[#3A6351] flex-shrink-0" />
                    <span className="truncate" title={item.lastLocation}>{item.lastLocation || 'Warehouse Kampus Gedung C'}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 pt-3 border-t border-[#F3F1EA] flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-[#8A928C]">
                    {item.listingType === 'sale' ? 'Harga Beli' : 'Sewa Harian'}
                  </div>
                  <div className="text-sm font-bold text-[#232925]">
                    Rp{(item.listingType === 'sale' ? (item.salePrice || item.price) : item.price).toLocaleString('id-ID')}
                    {item.listingType !== 'sale' && <span className="text-[11px] font-normal text-[#7A827C]"> /hari</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {currentUserRole === 'admin' && (
                    <button
                      onClick={() => {
                        setEditingItem(item)
                        setEditPrice(item.listingType === 'sale' ? (item.salePrice || item.price) : item.price)
                        setEditStock(item.available)
                      }}
                      className="p-2 text-[#7A827C] hover:text-[#232925] hover:bg-[#F3F1EA] rounded-lg transition-colors cursor-pointer"
                      title="Edit Stok / Harga"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  )}

                  <Link
                    to={`/equipment/${item.id}`}
                    className="p-2 text-[#7A827C] hover:text-[#232925] hover:bg-[#F3F1EA] rounded-lg transition-colors"
                    title="Detail Barang"
                  >
                    <Info className="w-4 h-4" />
                  </Link>

                  {currentUserRole === 'user' && (
                    <button
                      disabled={isLockedByActivePayment || (item.available <= 0 && !isReserved)}
                      onClick={() => toggleReserve(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        isLockedByActivePayment
                          ? 'bg-[#EFECE6] text-[#9A9890] cursor-not-allowed'
                          : isReserved
                          ? 'bg-[#3A6351] text-white'
                          : item.available <= 0 
                          ? 'bg-[#EFECE6] text-[#9A9890] cursor-not-allowed'
                          : 'bg-[#EAF0EC] text-[#264738] hover:bg-[#DCE7E0]'
                      }`}
                    >
                      {isLockedByActivePayment ? (
                        <span>Terkunci</span>
                      ) : isReserved ? (
                        <><Check className="w-3.5 h-3.5" /><span>Dipilih</span></>
                      ) : item.available <= 0 ? (
                        <span>Habis</span>
                      ) : (
                        <><Plus className="w-3.5 h-3.5" /><span>Pilih</span></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="card p-12 text-center space-y-2">
          <Package className="w-10 h-10 mx-auto text-[#B8B4A8]" />
          <h4 className="font-semibold text-[#232925] text-sm">Barang tidak ditemukan</h4>
          <p className="text-xs text-[#7A827C]">Silakan gunakan kata kunci lain atau ubah kategori filter.</p>
        </div>
      )}

      {/* Floating Checkout Bar yang Lembut */}
      {currentUserRole === 'user' && !isLockedByActivePayment && cartItems.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 lg:left-72 lg:right-10 z-40 max-w-4xl mx-auto">
          <div className="bg-[#26302B] text-white px-5 py-3.5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3A6351] flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#DCE7E0]">
                  {cartItems.length} barang dipilih · Durasi {durationDays} hari
                </div>
                <div className="text-sm font-bold text-white">
                  Total Estimasi: Rp{estimatedCartTotal.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <Link
              to="/reservation"
              className="w-full sm:w-auto bg-[#EAF0EC] hover:bg-white text-[#232925] text-xs font-semibold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <span>Lanjut ke Reservasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Modal Edit Admin */}
      {editingItem && currentUserRole === 'admin' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[#E8E6DF] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
              <h4 className="font-semibold text-[#232925] text-sm">
                Edit: {editingItem.name}
              </h4>
              <button onClick={() => setEditingItem(null)} className="text-[#8A928C] hover:text-[#232925] text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#5C645E] mb-1">
                  {editingItem.listingType === 'sale' ? 'Harga Jual (Rp)' : 'Tarif Sewa / Hari (Rp)'}
                </label>
                <input
                  type="number"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="cozy-input"
                />
              </div>

              <div>
                <label className="block font-medium text-[#5C645E] mb-1">
                  Stok Tersedia (Unit)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="cozy-input"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full btn-primary text-xs cursor-pointer">Simpan Perubahan</button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full py-2.5 rounded-xl border border-[#ECC8C3] text-[#9E4738] hover:bg-[#FDF3F2] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Barang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
