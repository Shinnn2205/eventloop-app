import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    return sessionStorage.getItem('eventloop_user_role') || 'user'
  })
  const [currentUserName, setCurrentUserName] = useState(() => {
    return sessionStorage.getItem('eventloop_user_name') || 'Prasmulyan'
  })

  const [userSession, setUserSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [equipments, setEquipments] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [transactions, setTransactions] = useState([])
  
  // Status pembayaran & event unik per user session
  const [userPaymentStatus, setUserPaymentStatus] = useState('idle')
  
  const [activeEvent, setActiveEvent] = useState({
    name: 'Event Organisasi Kampus',
    date: '2026-09-18',
    location: 'Hadi Budiman Hall'
  })

  const [activeReservation, setActiveReservation] = useState(null)
  const [returnStatus, setReturnStatus] = useState('idle')
  const [pendingReturns, setPendingReturns] = useState([])
  
  const [cartItems, setCartItems] = useState([])
  const [reservations, setReservations] = useState([])

  // Load data spesifik begitu user login / ganti akun
  useEffect(() => {
    async function loadUserData(userId) {
      const savedCart = sessionStorage.getItem(`eventloop_cart_${userId}`)
      if (savedCart) setCartItems(JSON.parse(savedCart))

      const savedStatus = sessionStorage.getItem(`eventloop_payment_status_${userId}`)
      if (savedStatus) setUserPaymentStatus(savedStatus)

      const savedEvent = sessionStorage.getItem(`eventloop_event_${userId}`)
      if (savedEvent) setActiveEvent(JSON.parse(savedEvent))

      const savedRes = sessionStorage.getItem(`eventloop_active_res_${userId}`)
      if (savedRes) setActiveReservation(JSON.parse(savedRes))
    }

    async function initSessionAndData() {
      const { data: { session } } = await supabase.auth.getSession()
      setUserSession(session)

      if (session?.user) {
        const metadata = session.user.user_metadata
        if (metadata?.full_name && currentUserRole !== 'admin') {
          setCurrentUserName(metadata.full_name)
        }
        await loadUserData(session.user.id)
      }

      await fetchEquipments()
      await fetchPendingApprovals()
      await fetchTransactions()
      setLoading(false)
    }

    initSessionAndData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUserSession(session)
      if (session?.user) {
        const metadata = session.user.user_metadata
        if (metadata?.full_name && currentUserRole !== 'admin') {
          setCurrentUserName(metadata.full_name)
        }
        // Reset state atau load data milik akun baru ini
        setCartItems([])
        setUserPaymentStatus('idle')
        setActiveReservation(null)
        await loadUserData(session.user.id)
      } else {
        // Jika logout, bersihkan state
        setCartItems([])
        setUserPaymentStatus('idle')
        setActiveReservation(null)
      }
      await fetchTransactions()
    })

    return () => subscription.unsubscribe()
  }, [currentUserRole])

  // Simpan cart unik per user
  useEffect(() => {
    if (userSession?.user?.id) {
      sessionStorage.setItem(`eventloop_cart_${userSession.user.id}`, JSON.stringify(cartItems))
    }
  }, [cartItems, userSession])

  // Simpan payment status unik per user
  useEffect(() => {
    if (userSession?.user?.id) {
      sessionStorage.setItem(`eventloop_payment_status_${userSession.user.id}`, userPaymentStatus)
    }
  }, [userPaymentStatus, userSession])

  // Simpan active event unik per user
  useEffect(() => {
    if (userSession?.user?.id && activeEvent) {
      sessionStorage.setItem(`eventloop_event_${userSession.user.id}`, JSON.stringify(activeEvent))
    }
  }, [activeEvent, userSession])

  async function fetchEquipments() {
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .order('id', { ascending: false })

    if (!error && data) {
      const formattedData = data.map(item => ({
        ...item,
        image: item.imageUrl ? '📷' : '📦',
      }))
      setEquipments(formattedData)
    }
  }

  async function fetchPendingApprovals() {
    const { data, error } = await supabase
      .from('pending_equipments')
      .select('*')

    if (!error && data) {
      setPendingApprovals(data)
    }
  }

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTransactions(data)
    } else {
      setTransactions([])
    }
  }

  const addToCart = (equipment, qty = 1) => {
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

  const createNewEvent = (eventData) => {
    const newEvt = {
      name: eventData.name || 'Event Organisasi Kampus',
      date: eventData.date || '2026-09-18',
      location: eventData.location || 'Kampus Utama'
    }
    setActiveEvent(newEvt)
    if (userSession?.user?.id) {
      sessionStorage.setItem(`eventloop_event_${userSession.user.id}`, JSON.stringify(newEvt))
    }
  }

  const uploadEquipmentByUser = async (newEquipment) => {
    const pendingId = `APV-${Date.now().toString().slice(-4)}`
    const pendingItem = {
      ...newEquipment,
      id: pendingId,
      dateSubmitted: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Pending Admin Check',
      uploader: userSession?.user?.id || 'currentUser'
    }

    const { error } = await supabase.from('pending_equipments').insert([pendingItem])
    if (!error) {
      await fetchPendingApprovals()
    }
    return pendingId
  }

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

    const { error: insertError } = await supabase.from('equipments').insert([newItemPayload])
    if (!insertError) {
      await supabase.from('pending_equipments').delete().eq('id', approvalId)
      await fetchEquipments()
      await fetchPendingApprovals()
    }
  }

  const rejectEquipmentByAdmin = async (approvalId) => {
    await supabase.from('pending_equipments').delete().eq('id', approvalId)
    await fetchPendingApprovals()
  }

  const submitUserQrisPayment = async (reservationDetails) => {
    const txnId = `TXN-QRIS-${Math.floor(1000 + Math.random() * 9000)}`
    const totalAmount = reservationDetails.totalAmount || 0
    
    const adminFee = totalAmount * 0.05
    const netPayout = totalAmount - adminFee

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

    const itemNames = cartItems.map(i => `${i.qty || 1}x ${i.name}`).join(', ') || 'Reservasi Perlengkapan Event'
    const ownerOrgName = cartItems[0]?.owner || currentUserName
    const ownerAccount = cartItems[0]?.ownerBank || 'BCA 8012345678 a.n Owner Organisasi'

    const newTxn = {
      id: txnId,
      buyerOrg: reservationDetails.buyerOrg || activeEvent.name,
      itemName: itemNames,
      amount: totalAmount,
      payoutAmount: netPayout,
      adminFee: adminFee,
      ownerOrg: ownerOrgName,
      ownerBank: ownerAccount,
      qrisStatus: 'Pending Admin Verification',
      payoutStatus: 'Pending Transfer',
      paidAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    await supabase.from('transactions').insert([newTxn])
    setTransactions(prev => [newTxn, ...prev])

    const updatedReservation = { 
      eventName: activeEvent.name,
      eventDate: activeEvent.date,
      items: [...cartItems], 
      txnId 
    }

    setActiveReservation(updatedReservation)
    if (userSession?.user?.id) {
      sessionStorage.setItem(`eventloop_active_res_${userSession.user.id}`, JSON.stringify(updatedReservation))
    }

    setCartItems([])
    if (userSession?.user?.id) {
      sessionStorage.removeItem(`eventloop_cart_${userSession.user.id}`)
    }
    setUserPaymentStatus('pending_admin_approval')
  }

  const approvePaymentByAdmin = async (txnId) => {
    await supabase
      .from('transactions')
      .update({ qrisStatus: 'Payment Approved by Admin (Lunas)' })
      .eq('id', txnId)

    await fetchTransactions()
    setUserPaymentStatus('approved_success')
  }

  const transferPayoutToOwner = async (txnId) => {
    await supabase
      .from('transactions')
      .update({ payoutStatus: 'Transferred' })
      .eq('id', txnId)

    await fetchTransactions()
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
    setPendingReturns(prev => prev.filter(r => r.id !== returnId))
    setReturnStatus('approved_success')
    
    const targetItem = equipments.find(e => e.id === equipmentId)
    if (targetItem) {
      const restoredAvailable = targetItem.available + returnedQty
      await supabase
        .from('equipments')
        .update({ available: restoredAvailable })
        .eq('id', equipmentId)
      await fetchEquipments()
    }

    setActiveReservation(prev => {
      if (!prev || !prev.items) return null;
      const remainingItems = prev.items.filter(item => item.id !== equipmentId);
      if (remainingItems.length === 0) {
        if (userSession?.user?.id) {
          sessionStorage.removeItem(`eventloop_active_res_${userSession.user.id}`)
        }
        return null;
      }
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
      cartItems, activeEvent, createNewEvent,
      addToCart, removeFromCart, updateCartQty,
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