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
  const [transactions, setTransactions] = useState([
    { id: 'TXN-QRIS-789', buyerOrg: 'HMPR', itemName: 'Tenda Kerucut 3x3 Meter', amount: 195000, qrisStatus: 'Pending Admin Verification' }
  ])
  
  const [userPaymentStatus, setUserPaymentStatus] = useState(() => {
    return sessionStorage.getItem('eventloop_payment_status') || 'idle'
  })
  
  const [activeEvent, setActiveEvent] = useState(() => {
    const savedEvent = sessionStorage.getItem('eventloop_current_event')
    return savedEvent ? JSON.parse(savedEvent) : {
      name: 'INNOFAIR 2026 (SISO BEM)',
      date: '18 September 2026',
      location: 'Hadi Budiman Hall'
    }
  })

  const [activeReservation, setActiveReservation] = useState(null)
  const [returnStatus, setReturnStatus] = useState('idle')
  const [pendingReturns, setPendingReturns] = useState([])
  
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = sessionStorage.getItem('eventloop_cart_items')
    return savedCart ? JSON.parse(savedCart) : []
  })
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    sessionStorage.setItem('eventloop_user_role', currentUserRole)
    sessionStorage.setItem('eventloop_user_name', currentUserName)
  }, [currentUserRole, currentUserName])

  useEffect(() => {
    sessionStorage.setItem('eventloop_cart_items', JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    sessionStorage.setItem('eventloop_payment_status', userPaymentStatus)
  }, [userPaymentStatus])

  useEffect(() => {
    if (activeEvent) {
      sessionStorage.setItem('eventloop_current_event', JSON.stringify(activeEvent))
    }
  }, [activeEvent])

  useEffect(() => {
    if (userSession?.user && activeReservation) {
      sessionStorage.setItem(`eventloop_active_res_${userSession.user.id}`, JSON.stringify(activeReservation))
    }
  }, [activeReservation, userSession])

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

    if (!error && data && data.length > 0) {
      setTransactions(data)
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

        const { data: resData } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', session.user.id)

        if (resData && resData.length > 0) {
          setReservations(resData)
          
          const savedRes = sessionStorage.getItem(`eventloop_active_res_${session.user.id}`)
          if (savedRes) {
            setActiveReservation(JSON.parse(savedRes))
          } else {
            setActiveReservation({
              eventName: activeEvent.name,
              eventDate: activeEvent.date,
              items: resData.map(r => ({
                id: r.id,
                name: r.item_name,
                qty: r.quantity,
                price: 25000,
                circularScore: 88,
                status: r.status
              })),
              txnId: 'TXN-QRIS-789'
            })
          }
        }
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

        const { data: resData } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', session.user.id)
        
        if (resData && resData.length > 0) {
          setReservations(resData)
          const savedRes = sessionStorage.getItem(`eventloop_active_res_${session.user.id}`)
          if (savedRes) {
            setActiveReservation(JSON.parse(savedRes))
          } else {
            setActiveReservation({
              eventName: activeEvent.name,
              eventDate: activeEvent.date,
              items: resData.map(r => ({
                id: r.id,
                name: r.item_name,
                qty: r.quantity,
                price: 25000,
                circularScore: 88,
                status: r.status
              })),
              txnId: 'TXN-QRIS-789'
            })
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [currentUserRole])

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
      date: eventData.date || '18 September 2026',
      location: eventData.location || 'Kampus Utama'
    }
    setActiveEvent(newEvt)
    sessionStorage.setItem('eventloop_current_event', JSON.stringify(newEvt))
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
    const txnId = `TXN-QRIS-${Math.floor(100 + Math.random() * 900)}`
    
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
      itemName: cartItems.map(i => i.name).join(', ') || 'Reservasi Perlengkapan Event',
      amount: reservationDetails.totalAmount,
      qrisStatus: 'Pending Admin Verification'
    }
    
    // Simpan juga ke tabel transactions Supabase agar terbaca di Admin Panel
    await supabase.from('transactions').insert([
      {
        id: txnId,
        buyerOrg: reservationDetails.buyerOrg || currentUserName,
        itemName: newTxn.itemName,
        amount: reservationDetails.totalAmount,
        qrisStatus: 'Pending Admin Verification'
      }
    ])

    setTransactions(prev => [newTxn, ...prev])
    
    if (userSession?.user) {
      for (const cartItem of cartItems) {
        await supabase.from('reservations').insert([
          {
            user_id: userSession.user.id,
            item_name: cartItem.name,
            quantity: cartItem.qty,
            start_date: activeEvent.date,
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

    const updatedReservation = { 
      eventName: activeEvent.name,
      eventDate: activeEvent.date,
      items: [...cartItems], 
      txnId 
    }

    setActiveReservation(updatedReservation)
    if (userSession?.user) {
      sessionStorage.setItem(`eventloop_active_res_${userSession.user.id}`, JSON.stringify(updatedReservation))
    }

    setCartItems([])
    sessionStorage.removeItem('eventloop_cart_items')
    setUserPaymentStatus('pending_admin_approval')
  }

  const approvePaymentByAdmin = async (txnId) => {
    // Update status di Supabase transactions
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

      sessionStorage.removeItem(`eventloop_active_res_${userSession.user.id}`)
    }

    setActiveReservation(prev => {
      if (!prev || !prev.items) return null;
      const remainingItems = prev.items.filter(item => item.id !== equipmentId);
      if (remainingItems.length === 0) {
        if (userSession?.user) {
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