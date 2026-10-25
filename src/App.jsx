import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import MyEquipment from './pages/MyEquipment' // <-- IMPORT HALAMAN BARANG SAYA
import AdminPanel from './pages/AdminPanel'
import Layout from './components/Layout'
import { AppProvider } from './context/AppContext'

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/equipment/:id" element={<EquipmentDetail />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/upload-equipment" element={<UploadEquipment />} />
            <Route path="/my-equipment" element={<MyEquipment />} /> {/* <-- RUTE BARANG SAYA */}
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