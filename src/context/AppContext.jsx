import React, { createContext, useContext, useState, useEffect } from 'react'
import { adminTransactions as initialTransactions } from '../data/mockData'
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
  const [transactions, setTransactions] = useState(initialTransactions)
  
  const [userPaymentStatus, setUserPaymentStatus] = useState('idle')
  const [activeReservation, setActiveReservation] = useState(null)
  const [returnStatus, setReturnStatus] = useState('idle')
  const [pendingReturns, setPendingReturns] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    sessionStorage.setItem('eventloop_user_role', currentUserRole)
    sessionStorage.setItem('eventloop_user_name', currentUserName)
  }, [currentUserRole, currentUserName])

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

  // Tarik data transaksi dari Supabase untuk Admin & User
  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('paidAt', { ascending: false })

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
          setActiveReservation({
            eventName: resData[0].item_name || 'Event Kampus',
            eventDate: resData[0].start_date,
            items: resData,
            txnId: resData[0].id
          })
          setUserPaymentStatus('pending_admin_approval')
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
        setReservations(resData || [])
      } else {
        setReservations([])
        if (currentUserRole !== 'admin') {
          setCurrentUserName('Prasmulyan')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [currentUserRole])

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
    } else {
      alert('Gagal mengunggah barang: ' + error.message)
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
    if (insertError) {
      alert('Gagal memproses persetujuan: ' + insertError.message)
      return
    }

    await supabase.from('pending_equipments').delete().eq('id', approvalId)

    await fetchEquipments()
    await fetchPendingApprovals()
  }

  const rejectEquipmentByAdmin = async (approvalId) => {
    await supabase.from('pending_equipments').delete().eq('id', approvalId)
    await fetchPendingApprovals()
  }

  // Kirim data transaksi langsung ke Supabase agar masuk ke database admin
  const submitUserQrisPayment = async (reservationDetails) => {
    const txnId = `TXN-QRIS-${Math.floor(100 + Math.random() * 900)}`
    
    // 1. Kurangi stok barang di database equipments
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

    // 2. Format data transaksi untuk tabel 'transactions' (Panel Admin)
    const newTxn = {
      id: txnId,
      buyerOrg: reservationDetails.buyerOrg || currentUserName,
      itemName: reservationDetails.itemNames || cartItems.map(i => i.name).join(', ') || 'Reservasi Perlengkapan Event',
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

    // Insert ke tabel transactions Supabase
    const { error: txnError } = await supabase.from('transactions').insert([newTxn])
    if (txnError) {
      console.error("Gagal insert ke transactions:", txnError.message)
    }
    
    await fetchTransactions()
    
    // 3. Simpan ke tabel reservations Supabase jika user login
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

    const updatedReservation = { 
      ...reservationDetails, 
      items: cartItems, 
      txnId 
    }

    setActiveReservation(updatedReservation)
    setCartItems([])
    setUserPaymentStatus('pending_admin_approval')
  }

  const approvePaymentByAdmin = async (txnId) => {
    const { error } = await supabase
      .from('transactions')
      .update({
        qrisStatus: 'Payment Approved by Admin (Lunas)',
        payoutStatus: 'Pending Transfer'
      })
      .eq('id', txnId)

    if (!error) {
      await fetchTransactions()
      setUserPaymentStatus('approved_success')
    }
  }

  const transferPayoutToOwner = async (txnId) => {
    const { error } = await supabase
      .from('transactions')
      .update({
        payoutStatus: 'Transferred',
        payoutRef: `TRF-BCA-${Math.floor(100000 + Math.random() * 900000)}`,
        transferredAt: 'Baru saja'
      })
      .eq('id', txnId)

    if (!error) {
      await fetchTransactions()
    }
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