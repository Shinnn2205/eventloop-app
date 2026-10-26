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
  
  // Transaksi disinkronkan dengan sessionStorage agar admin langsung melihat data masuk
  const [transactions, setTransactions] = useState(() => {
    const saved = sessionStorage.getItem('eventloop_transactions')
    return saved ? JSON.parse(saved) : []
  })
  
  const [userPaymentStatus, setUserPaymentStatus] = useState(() => {
    return sessionStorage.getItem('eventloop_payment_status') || 'idle'
  })
  
  const [activeEvent, setActiveEvent] = useState({
    name: 'Event Organisasi Kampus',
    date: '2026-09-18',
    location: 'Hadi Budiman Hall'
  })

  const [activeReservation, setActiveReservation] = useState(() => {
    const savedRes = sessionStorage.getItem('eventloop_active_reservation')
    return savedRes ? JSON.parse(savedRes) : null
  })

  const [returnStatus, setReturnStatus] = useState('idle')
  const [pendingReturns, setPendingReturns] = useState([])
  
  const [cartItems, setCartItems] = useState([])
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    sessionStorage.setItem('eventloop_transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    sessionStorage.setItem('eventloop_payment_status', userPaymentStatus)
  }, [userPaymentStatus])

  useEffect(() => {
    if (activeReservation) {
      sessionStorage.setItem('eventloop_active_reservation', JSON.stringify(activeReservation))
    } else {
      sessionStorage.removeItem('eventloop_active_reservation')
    }
  }, [activeReservation])

  async function fetchUserReservations(userId) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)

    if (!error && data) {
      setReservations(data)
    }
  }

  useEffect(() => {
    async function initSessionAndData() {
      const { data: { session } } = await supabase.auth.getSession()
      setUserSession(session)

      if (session?.user) {
        const metadata = session.user.user_metadata
        if (metadata?.full_name && currentUserRole !== 'admin') {
          setCurrentUserName(metadata.full_name)
        }
        await fetchUserReservations(session.user.id)
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
        await fetchUserReservations(session.user.id)
      } else {
        setCartItems([])
        setReservations([])
        setActiveReservation(null)
        setUserPaymentStatus('idle')
      }
      await fetchTransactions()
    })

    return () => subscription.unsubscribe()
  }, [currentUserRole])

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

    if (!error && data && data.length > 0) {
      setTransactions(data)
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

    // Simpan ke Supabase & state lokal agar langsung tampil
    await supabase.from('transactions').insert([newTxn])
    setTransactions(prev => [newTxn, ...prev])

    // Simpan data reservasi aktif agar tidak hilang saat di-refresh
    const reservationPayload = {
      eventName: reservationDetails.buyerOrg || activeEvent.name,
      eventDate: activeEvent.date,
      items: [...cartItems],
      txnId,
      totalAmount
    }
    setActiveReservation(reservationPayload)

    if (userSession?.user?.id) {
      for (const cartItem of cartItems) {
        await supabase.from('reservations').insert([
          {
            user_id: userSession.user.id,
            item_name: cartItem.name,
            quantity: cartItem.qty || 1,
            price: cartItem.listingType === 'sale' ? (cartItem.salePrice || cartItem.price) : (cartItem.price || 50000),
            listing_type: cartItem.listingType || 'rental',
            start_date: activeEvent.date,
            status: 'Sedang Berjalan'
          }
        ])
      }
      await fetchUserReservations(userSession.user.id)
    }

    setCartItems([])
    setUserPaymentStatus('pending_admin_approval')
  }

  const approvePaymentByAdmin = async (txnId) => {
    await supabase
      .from('transactions')
      .update({ qrisStatus: 'Payment Approved by Admin (Lunas)' })
      .eq('id', txnId)

    setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, qrisStatus: 'Payment Approved by Admin (Lunas)' } : t))
    setUserPaymentStatus('approved_success')
  }

  const transferPayoutToOwner = async (txnId) => {
    await supabase
      .from('transactions')
      .update({ payoutStatus: 'Transferred' })
      .eq('id', txnId)

    setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, payoutStatus: 'Transferred' } : t))
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

    if (userSession?.user?.id) {
      await supabase.from('reservations').delete().eq('user_id', userSession.user.id)
      await fetchUserReservations(userSession.user.id)
    }
    setActiveReservation(null)
    setUserPaymentStatus('idle')
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