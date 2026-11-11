import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabaseClient'
import { 
  LayoutDashboard, 
  Package, 
  CalendarPlus, 
  ClipboardCheck, 
  RotateCcw, 
  BarChart3, 
  Menu, 
  X, 
  Recycle,
  PlusCircle,
  ShieldAlert,
  LogOut,
  Box,
  UserCircle
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/create-event', label: 'Buat Event', icon: CalendarPlus },
  { path: '/marketplace', label: 'Marketplace', icon: Package },
  { path: '/reservation', label: 'Reservasi & Bayar', icon: ClipboardCheck },
  { path: '/return', label: 'Pengembalian', icon: RotateCcw },
  { path: '/upload-equipment', label: 'Upload Barang', icon: PlusCircle },
  { path: '/my-equipment', label: 'Barang Saya', icon: Box },
  { path: '/impact', label: 'Dampak Sirkular', icon: BarChart3 },
  { path: '/profile', label: 'Profil Ormawa', icon: UserCircle },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  
  const { 
    currentUserRole, 
    currentUserName, 
    currentUserStudyProgram, 
    sessionUser,
    cartItems = [],
    activeReservation,
    userPaymentStatus,
    transactions = [],
    pendingApprovals = [],
    pendingReturns = [],
    logout
  } = useApp()

  const rentedItemsCount = activeReservation?.items?.filter(i => i.listingType !== 'sale')?.length || 0
  const pendingAdminTasks = 
    transactions.filter(t => !t.itemName?.startsWith('[RETURN_REQ]') && !t.itemName?.startsWith('[EQUIPMENT_UPLOAD]') && (t.qrisStatus?.includes('Pending') || t.payoutStatus === 'Pending Transfer')).length +
    pendingApprovals.length +
    pendingReturns.length

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout()
      } else {
        await supabase.auth.signOut()
      }
      navigate('/login')
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F6FBF8] text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-emerald-100/90 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-emerald-100/70">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
              <Recycle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight block leading-none">
                Event<span className="text-emerald-600">Loop</span>
              </span>
              <span className="text-[11px] text-emerald-600/80 font-medium block mt-1">
                Circular Campus Platform
              </span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {currentUserRole === 'user' && (
            <>
              <div className="text-[11px] font-semibold text-emerald-700/70 uppercase tracking-wider px-3 mb-2">
                Menu Utama
              </div>
              {navItems.map((item) => {
                const Icon = item.icon
                let badgeText = null

                if (item.path === '/reservation') {
                  if (cartItems.length > 0 && userPaymentStatus === 'idle') {
                    badgeText = `${cartItems.length}`
                  } else if (userPaymentStatus === 'pending_admin_approval') {
                    badgeText = 'Verifikasi'
                  }
                } else if (item.path === '/return' && userPaymentStatus === 'approved' && rentedItemsCount > 0) {
                  badgeText = `${rentedItemsCount}`
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                          : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {badgeText && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {badgeText}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </>
          )}

          {currentUserRole === 'admin' && (
            <>
              <div className="text-[11px] font-semibold text-emerald-700/70 uppercase tracking-wider px-3 mb-2">
                Panel Pengelola
              </div>
              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                      : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>Admin & Escrow</span>
                </div>
                {pendingAdminTasks > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {pendingAdminTasks}
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/marketplace"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                      : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                  }`
                }
              >
                <Package className="w-4 h-4 flex-shrink-0" />
                <span>Katalog Marketplace</span>
              </NavLink>
              <NavLink
                to="/impact"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                      : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                  }`
                }
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span>Dampak Sirkular</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom User Profile & Logout */}
        <div className="p-4 border-t border-emerald-100/70 space-y-3">
          {sessionUser && (
            <div className="px-3 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between gap-2">
              <Link to="/profile" className="min-w-0 flex-1 hover:opacity-80 transition-opacity">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {currentUserName || 'Prasmulyan'}
                </div>
                <div className="text-[11px] text-emerald-700 truncate">
                  {currentUserRole === 'admin' ? 'Administrator' : (currentUserStudyProgram || 'Prasetiya Mulya')}
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Keluar Sesi"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white/85 backdrop-blur-md border-b border-emerald-100/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-emerald-50 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-emerald-800/80 hidden sm:inline">
              🌱 Ekosistem Peminjaman Perlengkapan Event Sirkular & Berkelanjutan
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUserRole === 'user' && activeReservation?.eventName && (
              <Link
                to="/reservation"
                className="badge-sage hover:bg-emerald-100 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="truncate max-w-[180px]">{activeReservation.eventName}</span>
                <span>· {activeReservation.durationDays || 1} hari</span>
              </Link>
            )}

            <Link to="/profile" className="flex items-center gap-2.5 pl-2 group">
              <div className="text-right hidden md:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
                  {currentUserName || 'Prasmulyan'}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium">
                  {currentUserRole === 'admin' ? 'Admin EventLoop' : (currentUserStudyProgram || 'Prasetiya Mulya')}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform shadow-2xs">
                {(currentUserName || 'P').substring(0, 2).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
