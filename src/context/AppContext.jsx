import React, { createContext, useContext, useState, useEffect } from 'react'
import { adminTransactions as initialTransactions, pendingApprovalEquipments as initialPending } from '../data/mockData'
import { supabase } from '../lib/supabaseClient'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [currentUserRole, setCurrentUserRole] = useState('user')
  const [currentUserName, setCurrentUserName] = useState('Prasmulyan')
  const [userSession, setUserSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // State utama ditarik dari database Supabase
  const [equipments, setEquipments] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState(initialPending)
  const [transactions, setTransactions] = useState(initialTransactions)
  
  const [userPaymentStatus, setUserPaymentStatus] = useState('idle')
  const [activeReservation, setActiveReservation] = useState(null)
  const [returnStatus, setReturnStatus] = useState('idle')
  const [pendingReturns, setPendingReturns] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [reservations, setReservations] = useState([])

  // Fungsi untuk mengambil data katalog barang dari tabel Supabase
  async function fetchEquipments() {
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .order('id', { ascending: false })

    if (!error && data) {
      // Format ulang data agar sesuai dengan struktur UI komponen frontend
      const formattedData = data.map(item => ({
        ...item,
        image: item.imageUrl ? '📷' : '📦',
      }))
      setEquipments(formattedData)
    }
  }

  // Ambil sesi login aktif dan data dari Supabase saat aplikasi dimuat
  useEffect(() => {
    async function initSessionAndData() {
      const { data: { session } } = await supabase.auth.getSession()
      setUserSession(session)

      if (session?.user) {
        const metadata = session.user.user_metadata
        if (metadata?.full_name) {
          setCurrentUserName(metadata.full_name)
        }

        // Ambil reservasi user ini
        const { data: resData } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', session.user.id)

        if (resData) setReservations(resData)
      }

      // Ambil katalog barang
      await fetchEquipments()
      setLoading(false)
    }

    initSessionAndData()

    // Listener perubahan status auth (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUserSession(session)
      if (session?.user) {
        const metadata = session.user.user_metadata
        if (metadata?.full_name) {
          setCurrentUserName(metadata.full_name)
        }

        const { data: resData } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', session.user.id)
        setReservations(resData || [])
      } else {
        setReservations([])
        setCurrentUserName('Prasmulyan')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const addToCart = (equipment, qty = 1) => {
    if (userPaymentStatus !== 'idle') {
      setUserPaymentStatus('idle')
    }
    setCartItems(prev => {
      const existing = prev.find(item => item.id === equipment.id)
      if (existing) {
        return prev.map(item => item.id === equipment.id ? { ...item, qty: Math.min(item.available, item.qty + qty) } : item)
      }
      return [...prev, { ...equipment, qty }]
    })
  }

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id))
  
  const updateCartQty = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.available, item.qty + delta))
        return { ...item, qty: newQty }
      }
      return item
    }))
  }

  const uploadEquipmentByUser = (newEquipment) => {
    const pendingItem = {
      ...newEquipment,
      id: `APV-${Date.now().toString().slice(-4)}`,
      dateSubmitted: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Pending Admin Check',
      uploader: userSession?.user?.id || 'currentUser'
    }
    setPendingApprovals(prev => [pendingItem, ...prev])
    return pendingItem.id
  }

  // Fungsi saat Admin menyetujui barang masuk (langsung simpan ke tabel Supabase `equipments`)
  const approveEquipmentByAdmin = async (approvalId) => {
    const itemToApprove = pendingApprovals.find(p => p.id === approvalId)
    if (!itemToApprove) return

    const newItemPayload = {
      name: itemToApprove.name,
      category: itemToApprove.category,
      price: itemToApprove.pricingType === 'sale' ? (itemToApprove.price || 50000) : (itemToApprove.price || 20000),
      salePrice: itemToApprove.pricingType === 'sale' ? (itemToApprove.salePrice || itemToApprove.price) : null,
      listingType: itemToApprove.pricingType || 'rental',
      available: parseInt(itemToApprove.qty) || 1,
      total: parseInt(itemToApprove.qty) || 1,
      imageUrl: itemToApprove.imagePreview || null,
      circularScore: itemToApprove.circularScore || 88,
      reusedCount: 0,
      maxReuse: parseInt(itemToApprove.maxReuse) || 30,
      size: itemToApprove.size || 'Standar',
      material: itemToApprove.material || 'Aluminium',
      condition: itemToApprove.condition || 'Good',
      owner: `${itemToApprove.ownerOrg || currentUserName} (Verified by Admin)`,
      ownerBank: itemToApprove.bankAccount || 'BCA 8012345678 a.n Owner',
      description: itemToApprove.description || 'Perlengkapan organisasi kampus siap pakai.',
      lastLocation: itemToApprove.initialLocation || 'Warehouse Kampus Gedung C',
      lastStoragePhoto: itemToApprove.initialStoragePhoto || null,
      uploader: itemToApprove.uploader,
    }

    const { error } = await supabase.from('equipments').insert([newItemPayload])

    if (error) {
      alert('Gagal menambahkan barang ke database: ' + error.message)
    } else {
      await fetchEquipments() // Ambil data terbaru dari server
      setPendingApprovals(prev => prev.filter(p => p.id !== approvalId))
    }
  }

  const rejectEquipmentByAdmin = (approvalId) => {
    setPendingApprovals(prev => prev.filter(p => p.id !== approvalId))
  }

  const submitUserQrisPayment = async (reservationDetails) => {
    const txnId = `TXN-QRIS-${Math.floor(100 + Math.random() * 900)}`
    
    // Update stok di database Supabase
    for (const reservedItem of cartItems) {
      const targetItem = equipments.find(e => e.id === reservedItem.id)
      if (targetItem) {
        const newAvailable = Math.max(0, targetItem.available - reservedItem.qty)
        await supabase
          .from('equipments')
          .update({ available: newAvailable })
          .eq('id', reservedItem.id)
      }
    }
    await fetchEquipments()

    const newTxn = {
      id: txnId,
      buyerOrg: reservationDetails.buyerOrg || currentUserName,
      itemName: reservationDetails.itemNames || 'Reservasi Perlengkapan Event',
      amount: reservationDetails.totalAmount,
      qrisStatus: 'Pending Admin Verification',
      paidAt: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      bankAdminRef: `BCA-QRIS-${Math.floor(1000000 + Math.random() * 9000000)}`,
      ownerOrg: 'Organisasi Pemilik & Sarpras',
      ownerBank: 'BCA 8012345678 a.n Owner',
      payoutStatus: 'Waiting Admin Approval',
      payoutAmount: Math.round(reservationDetails.totalAmount * 0.95),
      adminFee: Math.round(reservationDetails.totalAmount * 0.05),
    }

    setTransactions(prev => [newTxn, ...prev])
    
    // Simpan reservasi ke database Supabase
    if (userSession?.user) {
      for (const cartItem of cartItems) {
        await supabase.from('reservations').insert([
          {
            user_id: userSession.user.id,
            item_name: cartItem.name,
            quantity: cartItem.qty,
            start_date: reservationDetails.startDate || new Date().toISOString().split('T')[0],
            status: 'Sedang Berjalan'
          }
        ])
      }

      const { data } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userSession.user.id)
      if (data) setReservations(data)
    }

    setActiveReservation({ 
      ...reservationDetails, 
      items: cartItems, 
      txnId 
    })
    
    setCartItems([])
    setUserPaymentStatus('pending_admin_approval')
  }

  const approvePaymentByAdmin = (txnId) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === txnId) {
        return {
          ...t,
          qrisStatus: 'Payment Approved by Admin (Lunas)',
          payoutStatus: 'Pending Transfer'
        }
      }
      return t
    }))
    setUserPaymentStatus('approved_success')
  }

  const transferPayoutToOwner = (txnId) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === txnId) {
        return {
          ...t,
          payoutStatus: 'Transferred',
          payoutRef: `TRF-BCA-${Math.floor(100000 + Math.random() * 900000)}`,
          transferredAt: 'Baru saja'
        }
      }
      return t
    }))
  }

  const updateEquipmentPriceAndStock = async (id, newPrice, newAvailable) => {
    if (currentUserRole !== 'admin') return

    const { error } = await supabase
      .from('equipments')
      .update({
        price: parseInt(newPrice),
        available: parseInt(newAvailable)
      })
      .eq('id', id)

    if (!error) {
      await fetchEquipments()
    }
  }

  const deleteEquipment = async (id) => {
    if (currentUserRole !== 'admin') return

    const { error } = await supabase
      .from('equipments')
      .delete()
      .eq('id', id)

    if (!error) {
      setEquipments(prev => prev.filter(item => item.id !== id))
      setCartItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const submitUserReturnProof = (returnData) => {
    const newReturn = {
      id: `RET-${Math.floor(Math.random() * 9000) + 1000}`,
      ...returnData,
      borrower: currentUserName,
      timestamp: new Date().toLocaleString('id-ID')
    }
    setPendingReturns(prev => [newReturn, ...prev])
    setReturnStatus('pending_admin_approval')
  }

  const approveReturnByAdmin = async (returnId, equipmentId, returnedQty) => {
    const returnData = pendingReturns.find(r => r.id === returnId)
    
    setPendingReturns(prev => prev.filter(r => r.id !== returnId))
    setReturnStatus('approved_success')
    
    // Kembalikan stok di database Supabase
    const targetItem = equipments.find(e => e.id === equipmentId)
    if (targetItem) {
      const restoredAvailable = targetItem.available + returnedQty
      await supabase
        .from('equipments')
        .update({ available: restoredAvailable })
        .eq('id', equipmentId)
      await fetchEquipments()
    }

    // Hapus data dari tabel reservations Supabase
    if (userSession?.user) {
      await supabase
        .from('reservations')
        .delete()
        .eq('user_id', userSession.user.id)

      const { data } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userSession.user.id)
      if (data) setReservations(data)
    }

    setActiveReservation(prev => {
      if (!prev || !prev.items) return prev;
      const remainingItems = prev.items.filter(item => item.id !== equipmentId);
      return {
        ...prev,
        items: remainingItems
      }
    })
  }

  return (
    <AppContext.Provider value={{
      currentUserRole, setCurrentUserRole,
      currentUserName, setCurrentUserName,
      userSession, reservations, loading,
      equipments, pendingApprovals, transactions, userPaymentStatus, activeReservation, returnStatus, pendingReturns,
      cartItems, addToCart, removeFromCart, updateCartQty,
      uploadEquipmentByUser, approveEquipmentByAdmin, rejectEquipmentByAdmin, submitUserQrisPayment, approvePaymentByAdmin,
      transferPayoutToOwner, updateEquipmentPriceAndStock, deleteEquipment, setUserPaymentStatus, submitUserReturnProof, approveReturnByAdmin,
      setReturnStatus
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}