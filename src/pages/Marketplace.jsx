import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/mockData'
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
  Package
} from 'lucide-react'

export default function Marketplace() {
  const { currentUserRole, equipments, updateEquipmentPriceAndStock, deleteEquipment, cartItems, addToCart, removeFromCart } = useApp()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [listingFilter, setListingFilter] = useState('all') 
  const [editingItem, setEditingItem] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')

  const filteredEquipment = equipments.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.material && item.material.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesScore = item.circularScore >= minScore
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
    const isReserved = cartItems.some(cartItem => cartItem.id === item.id)
    if (isReserved) {
      removeFromCart(item.id)
    } else {
      addToCart(item, 1)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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
            {currentUserRole === 'admin' ? 'Kelola stok, harga, dan penghapusan barang secara global.' : 'Pilih equipment modular, bandingkan Circular Score, dan reservasi untuk event organisasimu.'}
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
              <span>Barang Saya</span>
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
              <span>Reservasi Saya ({cartItems.length})</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari booth, banner, meja, sound, lighting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
              <button
                onClick={() => setListingFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  listingFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setListingFilter('rental')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  listingFilter === 'rental' ? 'bg-white text-green-700 shadow-sm' : 'hover:text-gray-900'
                }`}
              >
                🔄 Sewa
              </button>
              <button
                onClick={() => setListingFilter('sale')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  listingFilter === 'sale' ? 'bg-white text-amber-700 shadow-sm' : 'hover:text-gray-900'
                }`}
              >
                🏷️ Preloved
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <span>Min Score:</span>
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
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.name
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
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
              <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-green-50/30 h-44 flex items-center justify-center relative border-b border-gray-100 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                    {item.image || '📦'}
                  </span>
                )}
                <div 
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm backdrop-blur bg-white/90 ${
                    item.circularScore >= 90
                      ? 'text-green-800 border border-green-300'
                      : item.circularScore >= 80
                      ? 'text-emerald-800 border border-emerald-300'
                      : 'text-amber-800 border border-amber-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-green-600" />
                  <span>{item.circularScore}</span>
                  <span className="text-[10px] font-normal opacity-70">/100</span>
                </div>
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-600 border border-gray-200">
                  {item.owner || 'Prasmulyan'}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span>Tersedia: <strong className="text-gray-900">{item.available}</strong>/{item.total}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-green-700 transition-colors">
                    <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-gray-400">
                      {item.listingType === 'sale' ? 'Harga Jual' : 'Sewa / Event'}
                    </div>
                    <div className="text-base font-black text-gray-900">
                      Rp{(item.listingType === 'sale' ? (item.salePrice || item.price * 5) : item.price).toLocaleString('id-ID')}
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
                        className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                        title="Admin Control: Edit Stok atau Hapus Barang"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <Link
                      to={`/equipment/${item.id}`}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      title="Lihat Detail"
                    >
                      <Info className="w-4 h-4" />
                    </Link>

                    {/* HANYA MUNCUL JIKA USER BIASA */}
                    {currentUserRole === 'user' && (
                      <button
                        disabled={item.available <= 0 && !isReserved}
                        onClick={() => toggleReserve(item)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isReserved
                            ? 'bg-green-700 text-white'
                            : item.available <= 0 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : item.listingType === 'sale'
                            ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                            : 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {isReserved ? (
                          <><Check className="w-3.5 h-3.5" /><span>Dipilih</span></>
                        ) : item.listingType === 'sale' ? (
                          <span>Beli Preloved</span>
                        ) : (
                          <><Plus className="w-3.5 h-3.5" /><span>Reserve</span></>
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
                  {editingItem.listingType === 'sale' ? 'Harga Jual (Rp)' : 'Tarif Sewa / Event (Rp)'}
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
                <button type="submit" className="w-full btn-primary text-xs !py-3">Simpan Perubahan</button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
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