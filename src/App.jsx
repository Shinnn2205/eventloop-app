import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
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
import AdminPanel from './pages/AdminPanel'
import Layout from './components/Layout'
import { AppProvider, useApp } from './context/AppContext'

// Komponen penangkap sesi untuk otomatis melempar ke dashboard jika sudah login
function AuthHandler() {
  const { sessionUser } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Jika user sudah login dan sedang berada di halaman landing (/) atau login (/login)
    if (sessionUser && (location.pathname === '/' || location.pathname === '/login')) {
      navigate('/dashboard', { replace: true })
    }
  }, [sessionUser, location, navigate])

  return null
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AuthHandler />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/equipment/:id" element={<EquipmentDetail />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/upload-equipment" element={<UploadEquipment />} />
            <Route path="/my-equipment" element={<MyEquipment />} />
            <Route path="/reservation" element={<Reservation />} />
            <Route path="/return" element={<ReturnPage />} />
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  )
}

export default App