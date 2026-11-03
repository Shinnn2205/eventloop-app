import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AppContext = createContext()

export const ADMIN_EMAILS = [
  'gabrieljason47@gmail.com',
  'sherren1999@gmail.com',
  'ac523634@gmail.com',
  'jasonlimsurya@gmail.com',
  'admin@gmail.com'
]

export const isAdminEmail = (emailStr) => {
  const lower = (emailStr || '').toLowerCase().trim()
  return (
    ADMIN_EMAILS.includes(lower) ||
    lower.includes('admin') ||
    lower.includes('sarpras')
  )
}

export const isCampusEmail = (emailStr) => {
  const lower = (emailStr || '').toLowerCase().trim()
  return (
    lower.endsWith('@prasetiyamulya.ac.id') ||
    lower.endsWith('@student.prasetiyamulya.ac.id') ||
    lower.endsWith('.prasetiyamulya.ac.id') ||
    isAdminEmail(lower)
  )
}

export const validateNimStructure = (nimStr) => {
  const clean = (nimStr || '').toString().trim()
  if (!/^\d{11}$/.test(clean)) {
    return {
      isValid: false,
      message: 'NIM harus terdiri dari tepat 11 digit angka (3 digit Jurusan + 2 digit Angkatan + 6 digit No. Urut).'
    }
  }
  const prodi = clean.slice(0, 3)
  const angkatan = clean.slice(3, 5)
  const nomor = clean.slice(5, 11)
  
  const angkatanNum = parseInt(angkatan, 10)
  if (isNaN(angkatanNum) || angkatanNum < 15 || angkatanNum > 30) {
    return {
      isValid: false,
      message: `Tahun angkatan (digit ke-4 & 5: "${angkatan}") tidak valid.`
    }
  }

  return {
    isValid: true,
    prodi,
    angkatan: `20${angkatan}`,
    nomor,
    generatedEmail: `${clean}@student.prasetiyamulya.ac.id`
  }
}

export function AppProvider({ children }) {
  // STATE ROLE (Admin vs User)
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    return localStorage.getItem('eventloop_role') || 'user'
  })

  // STATE USER PROFILE & SESSION
  const [currentUserName, setCurrentUserName] = useState(() => {
    return localStorage.getItem('eventloop_user_name') || 'Prasmulyan'
  })
  const [session, setSession] = useState(null)
  const [loadingDb, setLoadingDb] = useState(true)

  const [equipments, setEquipments] = useState(() => {
    const saved = localStorage.getItem('eventloop_equipments')
    return saved ? JSON.parse(saved) : []
  })

  const [pendingApprovals, setPendingApprovals] = useState(() => {
    const saved = localStorage.getItem('eventloop_pending_approvals')
    return saved ? JSON.parse(saved) : []
  })

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('eventloop_transactions')
    return saved ? JSON.parse(saved) : []
  })

  const [userPaymentStatus, setUserPaymentStatus] = useState(() => {
    return localStorage.getItem('eventloop_user_payment_status') || 'idle'
  })

  const [activeReservation, setActiveReservation] = useState(() => {
    const saved = localStorage.getItem('eventloop_active_reservation')
    return saved ? JSON.parse(saved) : null
  })

  const [returnStatus, setReturnStatus] = useState(() => {
    return localStorage.getItem('eventloop_return_status') || 'idle'
  })

  const [pendingReturns, setPendingReturns] = useState(() => {
    const saved = localStorage.getItem('eventloop_pending_returns')
    return saved ? JSON.parse(saved) : []
  })

  const [campusImpact, setCampusImpact] = useState({
    itemsReused: 0,
    wasteAvoidedKg: 0,
    costAvoided: 0,
    eventsSupported: 0,
    circularScore: 0
  })

  const [orgImpacts, setOrgImpacts] = useState([])

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('eventloop_cart')
    return saved ? JSON.parse(saved) : []
  })

  // Sinkronisasi otomatis ke Local Storage sebagai backup/cache
  useEffect(() => { localStorage.setItem('eventloop_role', currentUserRole) }, [currentUserRole])
  useEffect(() => { localStorage.setItem('eventloop_user_name', currentUserName) }, [currentUserName])
  useEffect(() => { localStorage.setItem('eventloop_equipments', JSON.stringify(equipments)) }, [equipments])
  useEffect(() => { localStorage.setItem('eventloop_pending_approvals', JSON.stringify(pendingApprovals)) }, [pendingApprovals])
  useEffect(() => { localStorage.setItem('eventloop_transactions', JSON.stringify(transactions)) }, [transactions])
  useEffect(() => { localStorage.setItem('eventloop_user_payment_status', userPaymentStatus) }, [userPaymentStatus])
  useEffect(() => { localStorage.setItem('eventloop_active_reservation', JSON.stringify(activeReservation)) }, [activeReservation])
  useEffect(() => { localStorage.setItem('eventloop_return_status', returnStatus) }, [returnStatus])
  useEffect(() => { localStorage.setItem('eventloop_pending_returns', JSON.stringify(pendingReturns)) }, [pendingReturns])
  useEffect(() => { localStorage.setItem('eventloop_cart', JSON.stringify(cartItems)) }, [cartItems])

  // --- FETCH FUNCTION DARI SUPABASE ---
  const fetchSupabaseData = useCallback(async () => {
    try {
      setLoadingDb(true)

      // 1. Session Auth
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession) {
        setSession(currentSession)
        const userEmail = currentSession.user?.email || ''
        const metaName = currentSession.user?.user_metadata?.full_name
        if (metaName) setCurrentUserName(metaName)

        if (isAdminEmail(userEmail)) {
          setCurrentUserRole('admin')
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, nim')
          .eq('id', currentSession.user.id)
          .single()
        if (profile?.full_name) {
          setCurrentUserName(profile.full_name)
        }
      }

      // 2. Fetch Equipments dari Supabase
      const { data: eqData, error: eqErr } = await supabase
        .from('equipments')
        .select('*')
        .order('created_at', { ascending: false })

      if (!eqErr && eqData) {
        const normalizedEquipments = eqData.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || 'General',
          price: Number(item.price) || 0,
          salePrice: item.salePrice ? Number(item.salePrice) : null,
          listingType: item.listingType || (item.salePrice ? 'sale' : 'rental'),
          available: Number(item.available) || 0,
          total: Number(item.total) || 1,
          image: item.image || '📦',
          imageUrl: item.imageUrl || null,
          circularScore: item.circularScore || 85,
          reusedCount: item.reusedCount || 0,
          maxReuse: item.maxReuse || 30,
          size: item.size || 'Standar',
          material: item.material || 'Material Campuran',
          condition: item.condition || 'Good',
          owner: item.owner || 'Sarpras / Prasmul Org',
          ownerBank: item.ownerBank || 'BCA 8012345678',
          description: item.description || '',
          lastLocation: item.lastLocation || 'Warehouse Kampus Gedung C',
          lastStoragePhoto: item.lastStoragePhoto || null,
          uploader: item.uploader || 'Admin'
        }))
        setEquipments(normalizedEquipments)
      } else if (!eqErr) {
        setEquipments([])
      }

      // 3. Fetch Transactions dari Supabase
      const { data: txnData, error: txnErr } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (!txnErr && txnData) {
        const normalizedTxn = txnData.map(t => ({
          id: t.id,
          buyerOrg: t.buyer_org || 'SISO Prasmulyan',
          itemName: t.item_names || 'Reservasi Perlengkapan',
          amount: Number(t.amount) || 0,
          qrisStatus: t.qris_status || 'Pending Admin Verification',
          payoutStatus: t.payout_status || 'Waiting Admin Approval',
          paidAt: t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : 'Baru saja',
          bankAdminRef: `BCA-QRIS-${String(t.id).slice(0, 6)}`,
          ownerOrg: 'Organisasi Pemilik & Sarpras',
          ownerBank: 'BCA 8012345678 a.n Owner',
          payoutAmount: Math.round((Number(t.amount) || 0) * 0.95),
          adminFee: Math.round((Number(t.amount) || 0) * 0.05),
        }))
        setTransactions(normalizedTxn)
      } else if (!txnErr) {
        setTransactions([])
      }

      // 4. Fetch Returns dari Supabase
      const { data: retData, error: retErr } = await supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false })

      if (!retErr && retData) {
        const normalizedRet = retData.map(r => ({
          id: r.id,
          equipmentId: r.equipment_id,
          conditionPhoto: r.condition_photo,
          storagePhoto: r.storage_photo,
          returnedQty: r.returned_qty || 1,
          borrower: r.borrower || 'SISO Prasmulyan',
          status: r.status || 'Pending Admin Verification',
          timestamp: r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : 'Baru saja'
        }))
        setPendingReturns(normalizedRet)
      } else if (!retErr) {
        setPendingReturns([])
      }

      // 5. Fetch Campus Impact dari Supabase tabel 'campus_impact'
      try {
        const { data: impactRow, error: impactErr } = await supabase
          .from('campus_impact')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (!impactErr && impactRow) {
          setCampusImpact({
            itemsReused: Number(impactRow.items_reused) || 0,
            wasteAvoidedKg: Number(impactRow.waste_avoided_kg) || 0,
            costAvoided: Number(impactRow.cost_avoided) || 0,
            eventsSupported: Number(impactRow.events_supported) || 0,
            circularScore: Number(impactRow.circular_score) || 0
          })
        } else {
          // Jika belum ada tabel/data campus_impact, hitung dari transaksi nyata yang approved
          const approvedTxn = (txnData || []).filter(t => 
            (t.qris_status || '').toLowerCase().includes('approved') || 
            (t.qris_status || '').toLowerCase().includes('lunas') ||
            (t.qris_status || '').toLowerCase().includes('paid')
          )
          const approvedRet = (retData || []).filter(r => 
            (r.status || '').toLowerCase().includes('approved')
          )
          const calculatedReused = approvedRet.reduce((sum, r) => sum + (r.returned_qty || 1), 0)
          const calculatedCost = approvedTxn.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
          const calculatedWaste = Math.round(calculatedReused * 0.15 * 10) / 10

          setCampusImpact({
            itemsReused: calculatedReused,
            wasteAvoidedKg: calculatedWaste,
            costAvoided: calculatedCost,
            eventsSupported: approvedTxn.length,
            circularScore: eqData && eqData.length > 0 
              ? Math.round(eqData.reduce((s, e) => s + (e.circularScore || 0), 0) / eqData.length) 
              : 0
          })
        }
      } catch (e) {
        console.warn('campus_impact fetch error:', e)
      }

      // 6. Fetch Organization Impact dari Supabase tabel 'organization_impact'
      try {
        const { data: orgData, error: orgErr } = await supabase
          .from('organization_impact')
          .select('*')
          .order('circular_score', { ascending: false })

        if (!orgErr && orgData && orgData.length > 0) {
          setOrgImpacts(orgData)
        } else {
          setOrgImpacts([])
        }
      } catch (e) {
        console.warn('organization_impact fetch error:', e)
      }
    } catch (err) {
      console.warn('Gagal memuat data dari Supabase, menggunakan data lokal:', err)
    } finally {
      setLoadingDb(false)
    }
  }, [])

  useEffect(() => {
    fetchSupabaseData()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        const name = newSession.user.user_metadata?.full_name || 'Prasmulyan'
        setCurrentUserName(name)
        const userEmail = newSession.user.email || ''
        if (isAdminEmail(userEmail)) {
          setCurrentUserRole('admin')
        }
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [fetchSupabaseData])

  // --- CART ACTIONS ---
  const addToCart = (equipment, qty = 1) => {
    if (userPaymentStatus !== 'idle') {
      setUserPaymentStatus('idle')
    }
    setCartItems(prev => {
      const existing = prev.find(item => item.id === equipment.id)
      if (existing) {
        return prev.map(item => item.id === equipment.id ? { ...item, qty: Math.min(item.available || 99, item.qty + qty) } : item)
      }
      return [...prev, { ...equipment, qty }]
    })
  }

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id))
  
  const updateCartQty = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const maxAvail = item.available || 99
        const newQty = Math.max(1, Math.min(maxAvail, item.qty + delta))
        return { ...item, qty: newQty }
      }
      return item
    }))
  }

  // --- ACTIONS UPLOAD & VERIFIKASI ---
  const uploadEquipmentByUser = (newEquipment) => {
    const pendingItem = {
      ...newEquipment,
      id: `APV-${Date.now().toString().slice(-4)}`,
      dateSubmitted: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Pending Admin Check',
      uploader: currentUserName || 'Prasmulyan'
    }
    setPendingApprovals(prev => [pendingItem, ...prev])
    return pendingItem.id
  }

  const approveEquipmentByAdmin = async (approvalId) => {
    const itemToApprove = pendingApprovals.find(p => p.id === approvalId)
    if (!itemToApprove) return

    const priceVal = itemToApprove.pricingType === 'sale' ? (Number(itemToApprove.price) || 50000) : (Number(itemToApprove.price) || 20000)
    const salePriceVal = itemToApprove.pricingType === 'sale' ? (Number(itemToApprove.salePrice) || priceVal) : null

    const newMarketplaceItem = {
      name: itemToApprove.name,
      category: itemToApprove.category,
      price: priceVal,
      salePrice: salePriceVal,
      listingType: itemToApprove.pricingType || 'rental',
      available: parseInt(itemToApprove.qty) || 1,
      total: parseInt(itemToApprove.qty) || 1,
      image: itemToApprove.imagePreview ? '📷' : '📦',
      imageUrl: itemToApprove.imagePreview || null,
      circularScore: itemToApprove.circularScore || 88,
      reusedCount: 0,
      maxReuse: parseInt(itemToApprove.maxReuse) || 30,
      size: itemToApprove.size || 'Standar',
      material: itemToApprove.material || 'Aluminium',
      condition: itemToApprove.condition || 'Good',
      owner: `${itemToApprove.ownerOrg || 'Prasmulyan Organization'} (Verified by Admin)`,
      ownerBank: itemToApprove.bankAccount || 'BCA 8012345678 a.n Owner',
      description: itemToApprove.description || 'Perlengkapan organisasi kampus siap pakai.',
      lastLocation: itemToApprove.initialLocation || 'Warehouse Kampus Gedung C',
      lastStoragePhoto: itemToApprove.initialStoragePhoto || null,
      uploader: itemToApprove.uploader || currentUserName
    }

    try {
      const { data, error } = await supabase
        .from('equipments')
        .insert([newMarketplaceItem])
        .select()
      
      if (!error && data && data.length > 0) {
        newMarketplaceItem.id = data[0].id
      } else {
        newMarketplaceItem.id = Date.now()
      }
    } catch (err) {
      console.warn('Gagal simpan ke Supabase equipments, gunakan lokal:', err)
      newMarketplaceItem.id = Date.now()
    }

    setEquipments(prev => [newMarketplaceItem, ...prev])
    setPendingApprovals(prev => prev.filter(p => p.id !== approvalId))
  }

  const rejectEquipmentByAdmin = (approvalId) => {
    setPendingApprovals(prev => prev.filter(p => p.id !== approvalId))
  }

  // --- ACTIONS TRANSAKSI & QRIS ---
  const submitUserQrisPayment = async (reservationDetails) => {
    const txnId = `TXN-QRIS-${Math.floor(100 + Math.random() * 900)}`
    
    // Potong ketersediaan stok
    setEquipments(prev => prev.map(eq => {
      const reservedItem = cartItems.find(cart => cart.id === eq.id)
      if (reservedItem) {
        return { ...eq, available: Math.max(0, eq.available - reservedItem.qty) }
      }
      return eq
    }))

    const newTxn = {
      id: txnId,
      buyerOrg: reservationDetails.buyerOrg || currentUserName || 'SISO Prasmulyan',
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

    try {
      await supabase.from('transactions').insert([{
        buyer_org: newTxn.buyerOrg,
        item_names: newTxn.itemName,
        amount: newTxn.amount,
        qris_status: 'Pending Admin Verification',
        payout_status: 'Waiting Admin Approval'
      }])

      if (session?.user?.id) {
        await supabase.from('reservations').insert([{
          user_id: session.user.id,
          item_name: newTxn.itemName,
          quantity: cartItems.reduce((acc, c) => acc + (c.qty || 1), 0),
          status: 'Pending Verification'
        }])
      }
    } catch (dbErr) {
      console.warn('Gagal sync transaksi ke Supabase:', dbErr)
    }

    setTransactions(prev => [newTxn, ...prev])
    
    setActiveReservation({ 
      ...reservationDetails, 
      items: cartItems, 
      txnId,
      totalAmount: reservationDetails.totalAmount
    })
    
    setCartItems([])
    setUserPaymentStatus('pending_admin_approval')
  }

  const approvePaymentByAdmin = async (txnId) => {
    try {
      await supabase
        .from('transactions')
        .update({
          qris_status: 'Payment Approved by Admin (Lunas)',
          payout_status: 'Pending Transfer'
        })
        .ilike('buyer_org', '%')
    } catch (err) {
      console.warn('Gagal update transaksi di Supabase:', err)
    }

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

  const transferPayoutToOwner = async (txnId) => {
    try {
      await supabase
        .from('transactions')
        .update({ payout_status: 'Transferred' })
        .ilike('buyer_org', '%')
    } catch (err) {
      console.warn('Gagal update payout di Supabase:', err)
    }

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

  // --- ACTIONS ADMIN MANAGE STOK ---
  const updateEquipmentPriceAndStock = async (id, newPrice, newAvailable) => {
    if (currentUserRole !== 'admin') return

    try {
      await supabase
        .from('equipments')
        .update({
          price: parseInt(newPrice) || 0,
          available: parseInt(newAvailable) || 0
        })
        .eq('id', id)
    } catch (err) {
      console.warn('Gagal update stok di Supabase:', err)
    }

    setEquipments(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          price: parseInt(newPrice) || item.price,
          salePrice: item.listingType === 'sale' ? parseInt(newPrice) : item.salePrice,
          available: parseInt(newAvailable) || item.available
        }
      }
      return item
    }))
  }

  const deleteEquipment = async (id) => {
    if (currentUserRole !== 'admin') return

    try {
      await supabase.from('equipments').delete().eq('id', id)
    } catch (err) {
      console.warn('Gagal hapus equipment di Supabase:', err)
    }

    setEquipments(prev => prev.filter(item => item.id !== id))
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  // --- ACTIONS PENGEMBALIAN BARANG ---
  const submitUserReturnProof = async (returnData) => {
    const returnId = `RET-${Math.floor(Math.random() * 9000) + 1000}`
    const newReturn = {
      id: returnId,
      ...returnData,
      borrower: currentUserName || 'SISO Prasmulyan',
      timestamp: new Date().toLocaleString('id-ID')
    }

    try {
      await supabase.from('returns').insert([{
        equipment_id: returnData.equipmentId || 1,
        condition_photo: returnData.conditionPhoto || null,
        storage_photo: returnData.storagePhoto || null,
        status: 'Pending Admin Verification',
        returned_qty: returnData.returnedQty || 1,
        borrower: currentUserName || 'SISO Prasmulyan'
      }])
    } catch (err) {
      console.warn('Gagal kirim bukti return ke Supabase:', err)
    }

    setPendingReturns(prev => [newReturn, ...prev])
    setReturnStatus('pending_admin_approval')
  }

  const approveReturnByAdmin = async (returnId, equipmentId, returnedQty) => {
    const returnData = pendingReturns.find(r => r.id === returnId)
    
    try {
      await supabase.from('returns').update({ status: 'Approved' }).ilike('borrower', '%')
      if (equipmentId) {
        const targetEq = equipments.find(e => e.id === equipmentId)
        if (targetEq) {
          await supabase
            .from('equipments')
            .update({ 
              available: targetEq.available + returnedQty,
              lastLocation: 'Warehouse Kampus Gedung C (Rak B-04)'
            })
            .eq('id', equipmentId)
        }
      }
    } catch (err) {
      console.warn('Gagal update return status di Supabase:', err)
    }

    setPendingReturns(prev => prev.filter(r => r.id !== returnId))
    setReturnStatus('approved_success')
    
    setEquipments(prev => prev.map(item => {
      if (item.id === equipmentId) {
        return { 
          ...item, 
          available: item.available + returnedQty,
          lastLocation: 'Warehouse Kampus Gedung C (Rak B-04)',
          lastStoragePhoto: returnData?.storagePhoto || item.lastStoragePhoto,
          lastConditionPhoto: returnData?.conditionPhoto || null
        }
      }
      return item
    }))

    setActiveReservation(prev => {
      if (!prev || !prev.items) return prev;
      const remainingItems = prev.items.filter(item => item.id !== equipmentId);
      return {
        ...prev,
        items: remainingItems
      }
    })
  }

  // --- LOGOUT HELPER ---
  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn(e)
    }
    setSession(null)
    setCurrentUserRole('user')
    setCurrentUserName('Prasmulyan')
    localStorage.removeItem('eventloop_session')
    localStorage.removeItem('eventloop_user_name')
    localStorage.removeItem('eventloop_role')
  }

  return (
    <AppContext.Provider value={{
      currentUserRole, setCurrentUserRole,
      currentUserName, setCurrentUserName, 
      session, sessionUser: session?.user || null, 
      logout, loadingDb, refetchData: fetchSupabaseData,
      campusImpact, orgImpacts,
      equipments, pendingApprovals, transactions, userPaymentStatus, activeReservation, setActiveReservation, returnStatus, pendingReturns,
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
