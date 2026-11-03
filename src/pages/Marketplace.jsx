import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Spinner from '../components/Spinner'
import { 
  Search, 
  Plus, 
  Check, 
  Sparkles, 
  PlusCircle,
  Lock,
  MapPin,
  ShoppingBag,
  ArrowRight,
  Clock
} from 'lucide-react'

const categories = ['All', 'Booth', 'Signage', 'Furniture', 'Electronics', 'Decoration', 'Others']

export default function Marketplace() {
  const { 
    equipments, 
    cartItems, 
    addToCart, 
    removeFromCart, 
    loadingDb, 
    userPaymentStatus, 
    currentUserRole,
    activeReservation
  } = useApp()

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedListingType, setSelectedListingType] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const isLockedByActivePayment = currentUserRole === 'user' && userPaymentStatus !== 'idle'
  const durationDays = Math.max(1, Number(activeReservation?.durationDays) || 1)

  const filteredItems = equipments.filter((item) => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchType = 
      selectedListingType === 'All' || 
      (selectedListingType === 'rental' && item.listingType !== 'sale') ||
      (selectedListingType === 'sale' && item.listingType === 'sale')
    const matchSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.material.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchType && matchSearch
  })

  const isInCart = (id) => cartItems.some((i) => i.id === id)

  const toggleCart = (e, item) => {
    e.preventDefault()
    e.stopPropagation()
    if (isLockedByActivePayment) return
    if (isInCart(item.id)) {
      removeFromCart(item.id)
    } else {
      addToCart(item, 1)
    }
  }

  const cartTotalEstimate = cartItems.reduce((sum, item) => {
    const unitPrice = item.listingType === 'sale' ? (item.salePrice || item.price * 5) : item.price
    const multiplier = item.listingType === 'sale' ? 1 : durationDays
    return sum + unitPrice * item.qty * multiplier
  }, 0)

  if (loadingDb) return <Spinner />

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge-sage mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Katalog Perlengkapan Sirkular
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Marketplace Perlengkapan Event
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pinjam perlengkapan lintas organisasi dengan sistem pengembalian ke lokasi asal barang.
          </p>
        </div>

        {currentUserRole === 'user' && (
          <div className="flex items-center gap-2.5">
            <Link 
              to="/my-equipment" 
              className="btn-secondary text-xs !py-2.5 !px-4"
            >
              Barang Saya
            </Link>
            <Link 
              to="/upload-equipment" 
              className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Barang</span>
            </Link>
          </div>
        )}
      </div>

      {/* Info Banner: Event Aktif atau Terkunci */}
      {isLockedByActivePayment ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Pemesanan Terkunci:</strong> Anda memiliki reservasi aktif untuk event <strong>{activeReservation?.eventName}</strong>. Selesaikan pengembalian barang terlebih dahulu untuk memesan kembali.
            </span>
          </div>
          <Link to="/reservation" className="btn-secondary !py-1.5 !px-3 text-xs flex-shrink-0">
            Lihat Reservasi
          </Link>
        </div>
      ) : currentUserRole === 'user' && activeReservation?.eventName ? (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Memilih perlengkapan untuk kegiatan <strong>{activeReservation.eventName}</strong> · Durasi sewa: <strong>{durationDays} Hari</strong>
            </span>
          </div>
          <Link to="/reservation" className="font-semibold text-emerald-700 hover:underline flex items-center gap-1">
            <span>Ke Halaman Reservasi ({cartItems.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : null}

      {/* Filter & Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between gap-3 pb-3 border-b border-emerald-100/70">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'All', label: 'Semua Barang' },
              { id: 'rental', label: 'Sewa Harian' },
              { id: 'sale', label: 'Beli Preloved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedListingType(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedListingType === tab.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-emerald-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama alat, bahan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cozy-input !pl-9 !py-1.5 !text-xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                  : 'text-slate-500 hover:bg-emerald-50/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const reserved = isInCart(item.id)
          const itemLocation = item.lastLocation || item.initialLocation || 'Warehouse Kampus Gedung C'
          return (
            <Link 
              to={`/equipment/${item.id}`}
              key={item.id} 
              className="card flex flex-col justify-between overflow-hidden group hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                {/* Image Area */}
                <div className="bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 h-44 flex items-center justify-center relative border-b border-emerald-100/70 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="text-6xl opacity-85 group-hover:scale-105 transition-transform duration-300">{item.image}</span>
                  )}

                  {/* Top Left Type Tag */}
                  <div className="absolute top-3 left-3">
                    <span className={item.listingType === 'sale' ? 'badge-warm' : 'badge-sage'}>
                      {item.listingType === 'sale' ? 'Preloved' : 'Sewa / Hari'}
                    </span>
                  </div>

                  {/* Top Right Circular Score */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-emerald-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-emerald-100 shadow-2xs">
                    ♻️ Score {item.circularScore}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{item.category}</span>
                    <span>Stok: <strong className="text-slate-700">{item.available}/{item.total}</strong></span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                    {item.name}
                  </h3>

                  {/* Origin / Return Location */}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/60 px-2.5 py-1.5 rounded-lg border border-emerald-100/80">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{itemLocation}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span className="truncate max-w-[160px]">{item.owner}</span>
                    <span>{item.reuseCount}x dipakai</span>
                  </div>
                </div>
              </div>

              {/* Price & Action Footer */}
              <div className="px-5 py-3.5 bg-emerald-50/25 border-t border-emerald-100/70 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {item.listingType === 'sale' ? 'Harga Beli' : 'Tarif Sewa'}
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    Rp{(item.listingType === 'sale' ? (item.salePrice || item.price * 5) : item.price).toLocaleString('id-ID')}
                  </span>
                  {item.listingType !== 'sale' && (
                    <span className="text-[11px] text-slate-400"> / hari</span>
                  )}
                </div>

                {currentUserRole === 'user' && (
                  <button
                    disabled={isLockedByActivePayment}
                    onClick={(e) => toggleCart(e, item)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isLockedByActivePayment
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : reserved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                    }`}
                  >
                    {isLockedByActivePayment ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Terkunci</span>
                      </>
                    ) : reserved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Terpilih</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pilih</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Floating Bottom Cart Bar */}
      {currentUserRole === 'user' && cartItems.length > 0 && !isLockedByActivePayment && (
        <div className="fixed bottom-5 left-4 right-4 lg:left-72 lg:right-8 z-40 max-w-4xl mx-auto">
          <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-lg shadow-emerald-950/20 border border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-emerald-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  {cartItems.length} Jenis Barang Dipilih · Durasi {durationDays} Hari
                </div>
                <div className="text-xs text-emerald-200 mt-0.5">
                  Estimasi Total: <strong className="text-white">Rp{cartTotalEstimate.toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </div>

            <Link
              to="/reservation"
              className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-900 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Lanjut ke Reservasi & Bayar</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
