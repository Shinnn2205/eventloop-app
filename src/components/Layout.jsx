import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  CalendarPlus, 
  ClipboardList, 
  RotateCcw,
  BarChart3,
  LogOut,
  Recycle,
  Menu,
  X,
  PackagePlus,
  ShieldCheck,
  Package
} from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'

// 1. MENU KHUSUS USER
const userNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/create-event', label: 'Buat Event', icon: CalendarPlus },
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { path: '/reservation', label: 'Reservasi & Tiket', icon: ClipboardList },
  { path: '/return', label: 'Pengembalian (Return)', icon: RotateCcw },
  { path: '/upload-equipment', label: 'Upload Barang', icon: PackagePlus },
  { path: '/my-equipment', label: 'Barang & Payout Saya', icon: Package },
  { path: '/impact', label: 'Impact Analytics', icon: BarChart3 },
]

// 2. MENU KHUSUS ADMIN
const adminNavItems = [
  { path: '/admin', label: 'Admin & Escrow Hub', icon: ShieldCheck },
  { path: '/marketplace', label: 'Kelola Katalog', icon: ShoppingBag },
  { path: '/impact', label: 'Dampak Kampus', icon: BarChart3 },
]

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { 
    currentUserRole, 
    currentUserName, 
    logout, 
    activeReservation, 
    cartItems = [], 
    userPaymentStatus,
    transactions = [],
    pendingApprovals = [],
    pendingReturns = []
  } = useApp()

  const currentNavItems = currentUserRole === 'admin' ? adminNavItems : userNavItems

  // Hitung badge dinamis untuk memudahkan navigasi user
  const unreturnedCount = (activeReservation?.items || []).filter(i => i.listingType !== 'sale').length
  const adminPendingTotal = 
    transactions.filter(t => t.qrisStatus?.includes('Pending') || t.payoutStatus === 'Pending Transfer').length +
    pendingApprovals.length +
    pendingReturns.length

  const getNavBadge = (path) => {
    if (currentUserRole === 'admin') {
      if (path === '/admin' && adminPendingTotal > 0) {
        return { text: `${adminPendingTotal}`, style: 'bg-amber-400 text-amber-950' }
      }
      return null
    }

    if (path === '/create-event' && activeReservation?.eventName) {
      return { text: '1 Aktif', style: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
    }
    if (path === '/reservation') {
      if (userPaymentStatus === 'approved_success') {
        return { text: 'Lunas', style: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
      }
      if (userPaymentStatus === 'pending_admin_approval') {
        return { text: 'Verifikasi', style: 'bg-amber-100 text-amber-800 border border-amber-200' }
      }
      if (cartItems.length > 0) {
        return { text: `${cartItems.length} Item`, style: 'bg-green-100 text-green-800 border border-green-200' }
      }
    }
    if (path === '/return' && userPaymentStatus === 'approved_success' && unreturnedCount > 0) {
      return { text: `${unreturnedCount}`, style: 'bg-amber-100 text-amber-800 border border-amber-200' }
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-200 ease-in-out
        flex flex-col
      `}>
        {/* Brand */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <Link to={currentUserRole === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${currentUserRole === 'admin' ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20'}`}>
              <Recycle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-lg tracking-tight">EventLoop</span>
              <p className="text-[10px] text-gray-400 font-medium">Universitas Prasetiya Mulya</p>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {currentNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const badge = getNavBadge(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${isActive 
                    ? currentUserRole === 'admin'
                      ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/25'
                      : 'bg-green-600 text-white shadow-sm shadow-green-600/25'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-white/25 text-white border-0' : badge.style
                  }`}>
                    {badge.text}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Circular Tagline Banner */}
        <div className={`p-4 mx-4 mb-2 rounded-2xl border ${currentUserRole === 'admin' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60'}`}>
          <div className={`flex items-center gap-2 font-semibold text-xs mb-1 ${currentUserRole === 'admin' ? 'text-emerald-900' : 'text-green-800'}`}>
            <Recycle className={`w-4 h-4 ${currentUserRole === 'admin' ? 'text-emerald-700' : 'text-green-600'}`} />
            <span>Circular Economy</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${currentUserRole === 'admin' ? 'text-emerald-800' : 'text-green-700'}`}>
            Reuse · Rent · Return · Repeat. Wujudkan event kampus bebas limbah.
          </p>
        </div>

        {/* User profile section */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 ${currentUserRole === 'admin' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
              {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : (currentUserRole === 'admin' ? 'AD' : 'PR')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {currentUserName || (currentUserRole === 'admin' ? 'Admin EventLoop' : 'Prasmulyan')}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-gray-500 truncate"> Sesi Aktif</span>
              </div>
            </div>
            <button onClick={logout} title="Keluar / Logout" className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Top bar for mobile */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${currentUserRole === 'admin' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
              <Recycle className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-900 text-lg">EventLoop</span>
          </div>
          <button onClick={logout} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${currentUserRole === 'admin' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
            Keluar
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
