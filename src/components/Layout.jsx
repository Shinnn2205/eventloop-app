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
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { path: '/create-event', label: 'Create Event', icon: CalendarPlus },
  { path: '/upload-equipment', label: 'Upload Barang', icon: PackagePlus },
  { path: '/my-equipment', label: 'Barang Saya', icon: Package },
  { path: '/reservation', label: 'Reservation', icon: ClipboardList },
  { path: '/return', label: 'Return', icon: RotateCcw },
  { path: '/impact', label: 'Impact Dashboard', icon: BarChart3 },
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
  const { currentUserRole, currentUserName, logout } = useApp()

  const currentNavItems = currentUserRole === 'admin' ? adminNavItems : userNavItems

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
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
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {currentNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${isActive 
                    ? currentUserRole === 'admin'
                      ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/25'
                      : 'bg-green-600 text-white shadow-sm shadow-green-600/25'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
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
            Reuse · Rent · Return · Repeat. Cegah limbah event kampus bersama.
          </p>
        </div>

        {/* User profile section - DINAMIS BERDASARKAN ROLE */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm ${currentUserRole === 'admin' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
              {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : (currentUserRole === 'admin' ? 'AD' : 'PR')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUserName || (currentUserRole === 'admin' ? 'Admin Sarpras' : 'Prasmulyan')}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUserRole === 'admin' ? 'Admin Sarpras' : 'Student Organization'}
              </p>
            </div>
            <button onClick={logout} title="Logout" className="text-gray-400 hover:text-red-500 transition-colors p-1">
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
            {currentUserName || (currentUserRole === 'admin' ? 'Admin' : 'Prasmulyan')}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
