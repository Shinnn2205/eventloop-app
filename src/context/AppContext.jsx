import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AppContext = createContext()

export function AppProvider({ children }) {
  // STATE ROLE & AUTH USER
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    return localStorage.getItem('eventloop_role') || 'user'
  })
  const [sessionUser, setSessionUser] = useState(null)
  
  // State untuk menyimpan nama organisasi/user yang sedang login
  const [currentOrgName, setCurrentOrgName] = useState(() => {
    return localStorage.getItem('eventloop_org_name') || 'Organisasi Kampus'
  })

  const [equipments, setEquipments] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [transactions, setTransactions] = useState([])
  const [pendingReturns, setPendingReturns] = useState([])

  const [userPaymentStatus, setUserPaymentStatus] = useState(() => {
    const saved = localStorage.getItem('eventloop_user_payment_status')
    return saved || 'idle'
  })

  const [activeReservation, setActiveReservation] = useState(() => {
    const saved = localStorage.getItem('eventloop_active_reservation')
    return saved ? JSON.parse(saved) : null
  })

  const [returnStatus, setReturnStatus] = useState(() => {
    const saved = localStorage.getItem('eventloop_return_status')
    return saved || 'idle'
  })

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('eventloop_cart')
    return saved ? JSON.parse(saved) : []
  })

  // Sinkronisasi otomatis state ke Local Storage
  useEffect(() => { localStorage.setItem('eventloop_role', currentUserRole) }, [currentUserRole])
  useEffect(() => { localStorage.setItem('eventloop_org_name', currentOrgName) }, [currentOrgName])
  useEffect(() => { localStorage.setItem('eventloop_user_payment_status', userPaymentStatus) }, [userPaymentStatus])
  useEffect(() => { localStorage.setItem('eventloop_active_reservation', JSON.stringify(activeReservation)) }, [activeReservation])
  useEffect(() => { localStorage.setItem('eventloop_return_status', returnStatus) }, [returnStatus])
  useEffect(() => { localStorage.setItem('eventloop_cart', JSON.stringify(cartItems)) }, [cartItems])

  // AUTH & AMBIL DATA DARI SUPABASE SAAT PERTAMA KALI DIMUAT
  useEffect(() => {
    // 1. Cek sesi login Supabase saat aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null)
      if (session?.user) {
        const metadataName = session.user.user_metadata?.full_name
        if (metadataName) {
          setCurrentOrgName(metadataName)
        }
      }
    })

    // 2. Pantau perubahan status login auth secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null)
      if (session?.user) {
        const metadataName = session.user.user_metadata?.full_name
        if (metadataName) {
          setCurrentOrgName(metadataName)
        }
      }
    })

    // 3. Ambil data dari tabel Supabase
    fetchDataFromSupabase()

    return () => subscription.unsubscribe()
  }, [])

  const fetchDataFromSupabase = async () => {
    // Ambil data marketplace yang sudah disetujui
    const { data: eqData, error: eqError } = await supabase.from('equipments').select('*').eq('status', 'approved')
    if (!eqError && eqData) {
      setEquipments(eqData.map(item => ({
        ...item,
        salePrice: item.sale_price,
        listingType: item.listing_type,
        imageUrl: item.image_url,
        circularScore: item.circular_score,
        owner: item.owner_org,
        lastLocation: item.last_location
      })))
    }

    // Ambil data barang pending approval admin
    const { data: pendingData, error: pError } = await supabase.from('equipments').select('*').eq('status', 'pending_approval')
    if (!pError && pendingData) {
      setPendingApprovals(pendingData.map(item => ({
        ...item,
        salePrice: item.sale_price,
        listingType: item.listing_type,
        imagePreview: item.image_url,
        circularScore: item.circular_score,
        ownerOrg: item.owner_org
      })))
    }

    // Ambil data transaksi
    const { data: txnData, error: tError } = await supabase.from('transactions').select('*')
    if (!tError && txnData) {
      setTransactions(txnData.map(t => ({
        ...t,
        buyerOrg: t.buyer_org,
        itemName: t.item_names,
        qrisStatus: t.qris_status,
        payoutStatus: t.payout_status
      })))
    }

    // Ambil data pengembalian (returns)
    const { data: retData, error: rError } = await supabase.from('returns').select('*')
    if (!rError && retData) {
      setPendingReturns(retData.map(r => ({
        ...r,
        equipmentId: r.equipment_id,
        returnedQty: r.returned_qty
      })))
    }
  }

  // --- CART ACTIONS ---
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

  // --- ACTIONS UPLOAD & VERIFIKASI ---
  const uploadEquipmentByUser = async (newEquipment) => {
    const { data, error } = await supabase
      .from('equipments')
      .insert([
        {
          name: newEquipment.name,
          category: newEquipment.category,
          price: newEquipment.price,
          sale_price: newEquipment.salePrice,
          listing_type: newEquipment.pricingType || 'rental',
          available: parseInt(newEquipment.qty) || 1,
          total: parseInt(newEquipment.qty) || 1,
          image_url: newEquipment.imagePreview || null,
          circular_score: newEquipment.circularScore || 88,
          condition: newEquipment.condition || 'Good',
          owner_org: currentOrgName, // Menggunakan nama organisasi aktif yang sedang login
          last_location: newEquipment.initialLocation || 'Warehouse Kampus Gedung C',
          status: 'pending_approval'
        }
      ])
      .select()

    if (error) {
      console.error('Gagal mengupload barang:', error)
      return null
    }

    fetchDataFromSupabase()
    return data?.[0]?.id
  }

  const approveEquipmentByAdmin = async (approvalId) => {
    const { error } = await supabase
      .from('equipments')
      .update({ status: 'approved' })
      .eq('id', approvalId)

    if (error) {
      console.error('Gagal menyetujui barang:', error)
      return
    }

    fetchDataFromSupabase()
  }

  const rejectEquipmentByAdmin = async (approvalId) => {
    const { error } = await supabase
      .from('equipments')
      .delete()
      .eq('id', approvalId)

    if (!error) {
      fetchDataFromSupabase()
    }
  }

  // --- ACTIONS TRANSAKSI & QRIS ---
  const submitUserQrisPayment = async (reservationDetails) => {
    const txnId = `TXN-QRIS-${Math.floor(100 + Math.random() * 900)}`
    
    for (const cartItem of cartItems) {
      const targetEq = equipments.find(e => e.id === cartItem.id)
      if (targetEq) {
        await supabase
          .from('equipments')
          .update({ available: Math.max(0, targetEq.available - cartItem.qty) })
          .eq('id', cartItem.id)
      }
    }

    const { error } = await supabase.from('transactions').insert([
      {
        buyer_org: currentOrgName, // Menggunakan nama organisasi aktif
        item_names: reservationDetails.itemNames || 'Reservasi Perlengkapan Event',
        amount: reservationDetails.totalAmount,
        qris_status: 'Pending Admin Verification',
        payout_status: 'Waiting Admin Approval'
      }
    ])

    if (!error) {
      fetchDataFromSupabase()
    }

    setActiveReservation({ 
      ...reservationDetails, 
      items: cartItems, 
      txnId 
    })
    
    setCartItems([])
    setUserPaymentStatus('pending_admin_approval')
  }

  const approvePaymentByAdmin = async (txnId) => {
    const targetTxn = transactions.find(t => t.id === txnId)
    if (targetTxn) {
      await supabase
        .from('transactions')
        .update({
          qris_status: 'Payment Approved by Admin (Lunas)',
          payout_status: 'Pending Transfer'
        })
        .eq('buyer_org', targetTxn.buyerOrg)

      fetchDataFromSupabase()
    }
    setUserPaymentStatus('approved_success')
  }

  const transferPayoutToOwner = async (txnId) => {
    const targetTxn = transactions.find(t => t.id === txnId)
    if (targetTxn) {
      await supabase
        .from('transactions')
        .update({
          payout_status: 'Transferred'
        })
        .eq('buyer_org', targetTxn.buyerOrg)

      fetchDataFromSupabase()
    }
  }

  // --- ACTIONS ADMIN MANAGE STOK ---
  const updateEquipmentPriceAndStock = async (id, newPrice, newAvailable) => {
    if (currentUserRole !== 'admin') return
    await supabase
      .from('equipments')
      .update({
        price: parseInt(newPrice) || 0,
        available: parseInt(newAvailable) || 0
      })
      .eq('id', id)

    fetchDataFromSupabase()
  }

  const deleteEquipment = async (id) => {
    if (currentUserRole !== 'admin') return
    await supabase
      .from('equipments')
      .delete()
      .eq('id', id)

    setCartItems(prev => prev.filter(item => item.id !== id))
    fetchDataFromSupabase()
  }

  // --- ACTIONS PENGEMBALIAN BARANG ---
  const submitUserReturnProof = async (returnData) => {
    const { error } = await supabase.from('returns').insert([
      {
        equipment_id: returnData.equipmentId,
        borrower: currentOrgName,
        returned_qty: returnData.returnedQty,
        condition_photo: returnData.conditionPhoto,
        storage_photo: returnData.storagePhoto,
        status: 'pending_admin_approval'
      }
    ])

    if (!error) {
      fetchDataFromSupabase()
    }
    setReturnStatus('pending_admin_approval')
  }

  const approveReturnByAdmin = async (returnId, equipmentId, returnedQty) => {
    await supabase.from('returns').delete().eq('id', returnId)

    const targetEq = equipments.find(e => e.id === equipmentId)
    if (targetEq) {
      await supabase
        .from('equipments')
        .update({ available: targetEq.available + returnedQty })
        .eq('id', equipmentId)
    }

    fetchDataFromSupabase()
    setReturnStatus('approved_success')
    
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
      currentUserRole, setCurrentUserRole, sessionUser, currentOrgName, setCurrentOrgName,
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