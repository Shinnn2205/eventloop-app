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
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabaseClient' // <-- Import supabase client

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

const adminNavItems = [
  { path: '/admin', label: 'Admin & Escrow Hub', icon: ShieldCheck },
  { path: '/marketplace', label: 'Kelola Katalog', icon: ShoppingBag },
  { path: '/impact', label: 'Dampak Kampus', icon: BarChart3 },
]

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { currentUserRole } = useApp() 

  // State untuk menyimpan nama dan NIM dari Supabase Auth
  const [displayName, setDisplayName] = useState('Prasmulyan')
  const [displayNim, setDisplayNim] = useState('Mahasiswa / Org')

  useEffect(() => {
    async function fetchUserData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const metadata = session.user.user_metadata
        if (metadata?.full_name) {
          setDisplayName(metadata.full_name)
        }
        if (metadata?.nim) {
          setDisplayNim(`NIM: ${metadata.nim}`)
        }
      }
    }
    fetchUserData()
  }, [])

  const currentNavItems = currentUserRole === 'admin' ? adminNavItems : userNavItems

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <Link to={currentUserRole === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${currentUserRole === 'admin' ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20'}`}>
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">EventLoop</h1>
              <p className={`text-[10px] font-semibold tracking-wider uppercase ${currentUserRole === 'admin' ? 'text-emerald-700' : 'text-green-600'}`}>
                {currentUserRole === 'admin' ? 'Admin System' : 'Circular Campus'}
              </p>
            </div>
          </Link>
          <button 
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className={`px-3 pb-2 text-[10px] font-black uppercase tracking-wider ${currentUserRole === 'admin' ? 'text-emerald-700' : 'text-gray-400'}`}>
            {currentUserRole === 'admin' ? 'Portal Admin Kampus / Sarpras' : 'Portal Mahasiswa / Organisasi'}
          </div>
          
          {currentNavItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path === '/marketplace' && location.pathname.startsWith('/equipment/'))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                  ${isActive 
                    ? (currentUserRole === 'admin' 
                        ? 'bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-200/50' 
                        : 'bg-green-50 text-green-700 shadow-sm border border-green-200/50')
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? (currentUserRole === 'admin' ? 'text-emerald-700' : 'text-green-600') : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className={`ml-auto w-1.5 h-1.5 rounded-full ${currentUserRole === 'admin' ? 'bg-emerald-600' : 'bg-green-500'}`} />
                )}
              </Link>
            )
          })}
        </nav>

        <div className={`p-4 mx-4 mb-2 rounded-2xl border ${currentUserRole === 'admin' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60'}`}>
          <div className={`flex items-center gap-2 font-semibold text-xs mb-1 ${currentUserRole === 'admin' ? 'text-emerald-900' : 'text-green-800'}`}>
            <Recycle className={`w-4 h-4 ${currentUserRole === 'admin' ? 'text-emerald-700' : 'text-green-600'}`} />
            <span>Circular Economy</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${currentUserRole === 'admin' ? 'text-emerald-800' : 'text-green-700'}`}>
            Reuse · Rent · Return · Repeat. Cegah limbah event kampus bersama.
          </p>
        </div>

        {/* Bagian Profil User di Kiri Bawah */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm ${currentUserRole === 'admin' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
              {currentUserRole === 'admin' ? 'AD' : displayName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUserRole === 'admin' ? 'Admin Sarpras' : displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUserRole === 'admin' ? 'Pengelola Terpusat' : displayNim}
              </p>
            </div>
            <Link to="/login" title="Logout" className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
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
          <Link to="/login" className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${currentUserRole === 'admin' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
            {currentUserRole === 'admin' ? 'Admin' : 'Mahasiswa'}
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}