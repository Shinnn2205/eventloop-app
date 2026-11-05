import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import EquipmentDetail from './pages/EquipmentDetail'
import CreateEvent from './pages/CreateEvent'
import Reservation from './pages/Reservation'
import ReturnPage from './pages/ReturnPage'
import ImpactDashboard from './pages/ImpactDashboard'
import UploadEquipment from './pages/UploadEquipment'
import MyEquipment from './pages/MyEquipment'
import ProfilePage from './pages/ProfilePage'
import AdminPanel from './pages/AdminPanel'
import Layout from './components/Layout'
import { AppProvider, useApp } from './context/AppContext'

// Komponen penangkap sesi untuk otomatis melempar ke dashboard jika user SUDAH login saat membuka halaman /login atau klik link email
function AuthHandler() {
  const { sessionUser, currentUserRole } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Jangan otomatis redirect jika pengguna sedang dalam proses verifikasi kode OTP (pendaftaran atau reset password)
    const isPendingOtp = Boolean(typeof window !== 'undefined' && (
      sessionStorage.getItem('eventloop_pending_signup_otp') ||
      sessionStorage.getItem('eventloop_pending_forgot_otp')
    ))
    if (isPendingOtp) return

    // Jika link email magic link diklik (membawa access_token di URL hash)
    if (location.hash && location.hash.includes('access_token')) {
      setTimeout(() => {
        if (currentUserRole === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }, 500)
      return
    }

    if (sessionUser && location.pathname === '/login') {
      if (currentUserRole === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [sessionUser, currentUserRole, location, navigate])

  return null
}

// Protected Route: Mengharuskan pengguna untuk Login / Buat Akun terlebih dahulu sebelum membuka halaman dalam aplikasi
function ProtectedRoute({ children, adminOnly = false }) {
  const { sessionUser, currentUserRole, loadingDb } = useApp()
  const location = useLocation()

  if (loadingDb) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        <p className="text-xs text-gray-500 font-medium">Memverifikasi sesi EventLoop...</p>
      </div>
    )
  }

  // Jika belum login, lempar ke halaman login
  if (!sessionUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Jika halaman khusus admin tapi yang login bukan admin
  if (adminOnly && currentUserRole !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AuthHandler />
        <Routes>
          {/* Rute Publik */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login?tab=signup" replace />} />
          <Route path="/signup" element={<Navigate to="/login?tab=signup" replace />} />

          {/* Rute Aplikasi yang Diproteksi (Wajib Login) */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/equipment/:id" element={<EquipmentDetail />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/upload-equipment" element={<UploadEquipment />} />
            <Route path="/my-equipment" element={<MyEquipment />} />
            <Route path="/reservation" element={<Reservation />} />
            <Route path="/return" element={<ReturnPage />} />
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  )
}

export default App
