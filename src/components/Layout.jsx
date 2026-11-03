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

const userNavItems = [
  { path: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { path: '/create-event', label: 'Buat Event', icon: CalendarPlus },
  { path: '/marketplace', label: 'Katalog Barang', icon: ShoppingBag },
  { path: '/reservation', label: 'Reservasi Saya', icon: ClipboardList },
  { path: '/return', label: 'Pengembalian', icon: RotateCcw },
  { path: '/upload-equipment', label: 'Pinjamkan Barang', icon: PackagePlus },
  { path: '/my-equipment', label: 'Barang & Payout', icon: Package },
  { path: '/impact', label: 'Dampak Sirkular', icon: BarChart3 },
]

const adminNavItems = [
  { path: '/admin', label: 'Panel Verifikasi', icon: ShieldCheck },
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

  const unreturnedCount = (activeReservation?.items || []).filter(i => i.listingType !== 'sale').length
  const adminPendingTotal = 
    transactions.filter(t => t.qrisStatus?.includes('Pending') || t.payoutStatus === 'Pending Transfer').length +
    pendingApprovals.length +
    pendingReturns.length

  const getNavBadge = (path) => {
    if (currentUserRole === 'admin') {
      if (path === '/admin' && adminPendingTotal > 0) return `${adminPendingTotal}`
      return null
    }
    if (path === '/create-event' && activeReservation?.eventName) return 'Aktif'
    if (path === '/reservation') {
      if (userPaymentStatus === 'approved_success') return 'Lunas'
      if (userPaymentStatus === 'pending_admin_approval') return 'Proses'
      if (cartItems.length > 0) return `${cartItems.length}`
    }
    if (path === '/return' && userPaymentStatus === 'approved_success' && unreturnedCount > 0) {
      return `${unreturnedCount}`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#2C332E] flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/25 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Cozy */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#FAF9F5] border-r border-[#E8E6DF]
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-200 ease-in-out
        flex flex-col
      `}>
        {/* Brand */}
        <div className="px-6 py-6 flex items-center justify-between">
          <Link to={currentUserRole === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3A6351] flex items-center justify-center text-white">
              <Recycle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-[#232925] text-base tracking-tight block leading-none">EventLoop</span>
              <span className="text-[11px] text-[#8A928C] mt-1 block">Prasetiya Mulya</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#8A928C] hover:text-[#2C332E] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3.5 py-2 space-y-1 overflow-y-auto">
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
                  flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm
                  transition-colors duration-150
                  ${isActive 
                    ? 'bg-[#E6EFE9] text-[#264738] font-semibold'
                    : 'text-[#5C645E] hover:bg-[#EFECE6]/70 hover:text-[#232925] font-medium'
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#3A6351]' : 'text-[#8A928C]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {badge && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium flex-shrink-0 ${
                    isActive 
                      ? 'bg-[#3A6351] text-white' 
                      : 'bg-[#ECEAE2] text-[#5C645E]'
                  }`}>
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-[#E8E6DF]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F3F1EA]">
            <div className="w-8 h-8 rounded-lg bg-[#3A6351] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : (currentUserRole === 'admin' ? 'AD' : 'PR')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#232925] truncate">
                {currentUserName || (currentUserRole === 'admin' ? 'Admin EventLoop' : 'Prasmulyan')}
              </p>
              <p className="text-[11px] text-[#7A827C] truncate">
                Sesi Aktif
              </p>
            </div>
            <button 
              onClick={logout} 
              title="Keluar" 
              className="text-[#8A928C] hover:text-[#B84A39] transition-colors p-1.5 rounded-lg hover:bg-white/60 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
        <header className="lg:hidden bg-[#FAF9F5] border-b border-[#E8E6DF] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-[#EFECE6] rounded-lg text-[#5C645E]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3A6351] flex items-center justify-center text-white">
              <Recycle className="w-4 h-4" />
            </div>
            <span className="font-bold text-[#232925] text-base">EventLoop</span>
          </div>
          <button onClick={logout} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#EFECE6] text-[#5C645E]">
            Keluar
          </button>
        </header>

        <main className="flex-1 p-5 sm:p-8 lg:p-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
