import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { equipmentData, impactData } from '../data/mockData'

const AppContext = createContext()

export const ADMIN_DISPLAY_NAMES = {
  'ac523634@gmail.com': 'Atmin Choirul',
  'sherren1999@gmail.com': 'Xyliarenn',
  'sharren1999@gmail.com': 'Xyliarenn',
  'gabrieljason47@gmail.com': 'Prottt',
  'jasonlimsurya@gmail.com': 'Jason',
  'admin@gmail.com': 'Admin EventLoop'
}

export const ADMIN_EMAILS = Object.keys(ADMIN_DISPLAY_NAMES)

export const getAdminDisplayName = (emailStr) => {
  const lower = (emailStr || '').toLowerCase().trim()
  return ADMIN_DISPLAY_NAMES[lower] || null
}

export const isAdminEmail = (emailStr) => {
  const lower = (emailStr || '').toLowerCase().trim()
  return (
    !!ADMIN_DISPLAY_NAMES[lower] ||
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

export const PRASMUL_PRODI_MAP = {
  // SBE (School of Business and Economics)
  '1311': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'S1 Business (Bisnis)', code: 'Business' },
  '1312': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'Branding', code: 'Branding' },
  '1313': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'Finance & Banking', code: 'Finance' },
  '1314': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'International Marketing', code: 'Marketing' },
  '1316': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'Financial Technology (Fintech)', code: 'Fintech' },
  '1320': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'Accounting (Akuntansi)', code: 'Accounting' },
  '1330': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'Business Economics', code: 'Economics' },
  '1341': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'Hospitality Business', code: 'Hospitality' },
  '1342': { school: 'School of Business and Economics', shortSchool: 'SBE', name: 'Event Management', code: 'Event' },

  // STEM (School of Applied STEM)
  '2310': { school: 'School of Applied STEM', shortSchool: 'STEM', name: 'Business Mathematics', code: 'BM' },
  '2320': { school: 'School of Applied STEM', shortSchool: 'STEM', name: 'Food Business Technology', code: 'FBT' },
  '2330': { school: 'School of Applied STEM', shortSchool: 'STEM', name: 'Renewable Energy Engineering', code: 'REE' },
  '2340': { school: 'School of Applied STEM', shortSchool: 'STEM', name: 'Applied AI & Robotics', code: 'AIR' },
  '2350': { school: 'School of Applied STEM', shortSchool: 'STEM', name: 'Digital Business Technology', code: 'DBT' },
  '2360': { school: 'School of Applied STEM', shortSchool: 'STEM', name: 'Product Design Engineering', code: 'PDI' },

  // SLIS (School of Law and International Studies)
  '3310': { school: 'School of Law and International Studies', shortSchool: 'SLIS', name: 'International Business Law (Buslaw)', code: 'Buslaw' },
}

export const validateNimStructure = (nimStr) => {
  const clean = (nimStr || '').toString().trim()
  if (!/^\d{11}$/.test(clean)) {
    return {
      isValid: false,
      message: 'NIM harus terdiri dari tepat 11 digit angka.'
    }
  }

  const prodiPrefix = clean.slice(0, 4)
  const angkatanDigits = clean.slice(4, 6)
  const rawNomor = clean.slice(6)
  const nomorUrut = parseInt(rawNomor.slice(1), 10) || rawNomor

  const prodiInfo = PRASMUL_PRODI_MAP[prodiPrefix] || {
    school: clean.startsWith('1')
      ? 'School of Business and Economics'
      : clean.startsWith('2')
      ? 'School of Applied STEM'
      : 'School of Law and International Studies',
    shortSchool: clean.startsWith('1') ? 'SBE' : clean.startsWith('2') ? 'STEM' : 'SLIS',
    name: `Prodi (${prodiPrefix})`,
    code: prodiPrefix
  }

  return {
    isValid: true,
    prodi: prodiPrefix,
    prodiCode: prodiInfo.code,
    prodiName: prodiInfo.name,
    schoolName: prodiInfo.school,
    shortSchool: prodiInfo.shortSchool,
    angkatan: `20${angkatanDigits}`,
    nomor: nomorUrut,
    rawNomor,
    generatedEmail: `${clean}@student.prasetiyamulya.ac.id`
  }
}

// Helper format tanggal Indonesia singkat
export const formatIdDate = (dateObjOrStr) => {
  if (!dateObjOrStr) return ''
  const d = new Date(dateObjOrStr)
  if (isNaN(d.getTime())) return String(dateObjOrStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function AppProvider({ children }) {
  // Bersihkan sesi autentikasi permanen lama di localStorage agar sesi login murni mengikuti tab/browser (sessionStorage)
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('eventloop_sso_user')
      localStorage.removeItem('eventloop_session')
      localStorage.removeItem('eventloop_role')
      localStorage.removeItem('eventloop_user_name')
      localStorage.removeItem('eventloop_user_prodi')
      localStorage.removeItem('eventloop_mock_user')
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
          localStorage.removeItem(k)
        }
      }
    } catch (e) {}
  }

  // STATE ROLE (Admin vs User) - Disimpan di sessionStorage agar otomatis reset saat tab/browser ditutup
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    return (typeof window !== 'undefined' ? sessionStorage.getItem('eventloop_role') : null) || 'user'
  })

  // STATE USER PROFILE & SESSION - Disimpan di sessionStorage (tetap ada saat refresh, hilang saat tab ditutup)
  const [currentUserName, setCurrentUserName] = useState(() => {
    return (typeof window !== 'undefined' ? sessionStorage.getItem('eventloop_user_name') : null) || 'Prasmulyan'
  })
  const [currentUserStudyProgram, setCurrentUserStudyProgram] = useState(() => {
    return (typeof window !== 'undefined' ? sessionStorage.getItem('eventloop_user_prodi') : null) || 'Prasetiya Mulya'
  })
  const [session, setSession] = useState(null)
  const [ssoUser, setSsoUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const saved = sessionStorage.getItem('eventloop_sso_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loadingDb, setLoadingDb] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (ssoUser) {
      sessionStorage.setItem('eventloop_sso_user', JSON.stringify(ssoUser))
    } else {
      sessionStorage.removeItem('eventloop_sso_user')
    }
  }, [ssoUser])

  // Sinkronisasi status autentikasi ke sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('eventloop_role', currentUserRole)
    }
  }, [currentUserRole])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('eventloop_user_name', currentUserName)
    }
  }, [currentUserName])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('eventloop_user_prodi', currentUserStudyProgram)
    }
  }, [currentUserStudyProgram])

  // Monitor aktivitas pengguna: Jika tab ditinggal di latar belakang tanpa aktivitas selama 30 menit, sesi berakhir otomatis
  useEffect(() => {
    if (typeof window === 'undefined') return
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 menit

    const updateLastActive = () => {
      try {
        sessionStorage.setItem('eventloop_last_active', Date.now().toString())
      } catch (e) {}
    }

    const checkInactivity = () => {
      try {
        const last = sessionStorage.getItem('eventloop_last_active')
        if (last && (session || ssoUser)) {
          const diff = Date.now() - parseInt(last, 10)
          if (diff > INACTIVITY_TIMEOUT) {
            console.log('Sesi login telah kedaluwarsa karena tidak ada aktivitas di latar belakang.')
            logout()
          }
        }
      } catch (e) {}
    }

    updateLastActive()

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handleActivity = () => updateLastActive()

    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }))

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity()
        updateLastActive()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    const interval = setInterval(checkInactivity, 60 * 1000)

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [session, ssoUser])

  // One-time cleanup for active borrowings and reservations cache
  if (typeof window !== 'undefined' && localStorage.getItem('eventloop_borrowing_cleaned_v3') !== 'true') {
    localStorage.removeItem('eventloop_transactions')
    localStorage.removeItem('eventloop_active_reservation')
    localStorage.removeItem('eventloop_user_payment_status')
    localStorage.removeItem('eventloop_return_status')
    localStorage.removeItem('eventloop_pending_returns')
    localStorage.removeItem('eventloop_cart')
    localStorage.setItem('eventloop_borrowing_cleaned_v3', 'true')
  }

  const [equipments, setEquipments] = useState(() => {
    const saved = localStorage.getItem('eventloop_equipments')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch (e) {}
    }
    return equipmentData
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
    const saved = localStorage.getItem('eventloop_user_payment_status') || 'idle'
    return saved === 'approved_success' ? 'approved' : saved
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

  const [campusImpact, setCampusImpact] = useState(() => ({
    itemsReused: impactData.totalItemsReused || 1284,
    wasteAvoidedKg: Math.round(impactData.wasteAvoided) || 187,
    costAvoided: impactData.costAvoided || 18400000,
    eventsSupported: impactData.totalEventsSupported || 42,
    circularScore: 91
  }))

  const [orgImpacts, setOrgImpacts] = useState(() => 
    (impactData.topOrganizations || []).map((o, idx) => ({
      id: idx + 1,
      org_name: o.name,
      events_count: o.events,
      items_reused: o.reused,
      circular_score: o.score
    }))
  )

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('eventloop_cart')
    return saved ? JSON.parse(saved) : []
  })

  // Sinkronisasi data perlengkapan & transaksi ke Local Storage
  useEffect(() => { localStorage.setItem('eventloop_equipments', JSON.stringify(equipments)) }, [equipments])
  useEffect(() => { localStorage.setItem('eventloop_pending_approvals', JSON.stringify(pendingApprovals)) }, [pendingApprovals])
  useEffect(() => { localStorage.setItem('eventloop_transactions', JSON.stringify(transactions)) }, [transactions])
  useEffect(() => { localStorage.setItem('eventloop_user_payment_status', userPaymentStatus) }, [userPaymentStatus])
  useEffect(() => { localStorage.setItem('eventloop_active_reservation', JSON.stringify(activeReservation)) }, [activeReservation])
  useEffect(() => { localStorage.setItem('eventloop_return_status', returnStatus) }, [returnStatus])
  useEffect(() => { localStorage.setItem('eventloop_pending_returns', JSON.stringify(pendingReturns)) }, [pendingReturns])
  useEffect(() => { localStorage.setItem('eventloop_cart', JSON.stringify(cartItems)) }, [cartItems])

  // Sinkronisasi otomatis activeReservation ke Supabase reservations table saat ada perubahan
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    if (!activeReservation || !activeReservation.eventName) return

    const syncReservationToSupabase = async () => {
      try {
        const { data: existing } = await supabase
          .from('reservations')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)

        const payload = {
          user_id: userId,
          item_name: JSON.stringify({
            ...activeReservation,
            paymentStatus: userPaymentStatus
          }),
          quantity: activeReservation.items?.length || 0,
          status: userPaymentStatus || 'idle',
          start_date: activeReservation.startDate || activeReservation.startDateLabel || new Date().toISOString()
        }

        if (existing && existing.length > 0) {
          await supabase
            .from('reservations')
            .update(payload)
            .eq('id', existing[0].id)
        } else {
          await supabase
            .from('reservations')
            .insert([payload])
        }
      } catch (err) {
        console.warn('Gagal sync activeReservation ke Supabase:', err)
      }
    }

    const timer = setTimeout(syncReservationToSupabase, 800)
    return () => clearTimeout(timer)
  }, [activeReservation, userPaymentStatus, session?.user?.id])

  // Update Active Event Details Helper
  const updateActiveEventDetails = useCallback((updates) => {
    setActiveReservation(prev => ({
      ...(prev || {}),
      ...updates
    }))
  }, [])

  // --- FETCH FUNCTION DARI SUPABASE ---
  const fetchSupabaseData = useCallback(async () => {
    try {
      setLoadingDb(true)

      // 1. Session Auth & User Active Reservation dari Cloud Database
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      let currentUserId = currentSession?.user?.id || session?.user?.id
      let hasCloudReservation = false

      if (currentSession) {
        setSession(currentSession)
        const userEmail = currentSession.user?.email || ''
        const adminName = getAdminDisplayName(userEmail)

        if (isAdminEmail(userEmail)) {
          setCurrentUserRole('admin')
          setCurrentUserName(adminName || 'Admin EventLoop')
        } else {
          const metaName = currentSession.user?.user_metadata?.full_name
          const metaProdi = currentSession.user?.user_metadata?.prodi_name
          if (metaName) setCurrentUserName(metaName)
          if (metaProdi) setCurrentUserStudyProgram(metaProdi)

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nim, prodi')
            .eq('id', currentSession.user.id)
            .single()
          if (profile?.full_name) {
            setCurrentUserName(profile.full_name)
          }
          if (profile?.prodi) {
            setCurrentUserStudyProgram(profile.prodi)
          }
        }
      }

      // Ambil active reservation pengguna saat ini dari tabel reservations di Supabase
      if (currentUserId) {
        try {
          const { data: userResRows, error: userResErr } = await supabase
            .from('reservations')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(1)

          if (!userResErr && userResRows && userResRows.length > 0) {
            const userRes = userResRows[0]
            let parsedRes = null
            if (userRes.item_name && userRes.item_name.startsWith('{')) {
              try {
                parsedRes = JSON.parse(userRes.item_name)
              } catch (parseE) {
                console.warn('Gagal parse reservation item_name:', parseE)
              }
            }

            if (parsedRes) {
              hasCloudReservation = true
              setActiveReservation(parsedRes)
              try {
                localStorage.setItem('eventloop_active_reservation', JSON.stringify(parsedRes))
              } catch (e) {}
            }

            if (userRes.status) {
              setUserPaymentStatus(userRes.status)
              try {
                localStorage.setItem('eventloop_user_payment_status', userRes.status)
              } catch (e) {}
            }
          }
        } catch (resErr) {
          console.warn('Gagal fetch data reservations dari Supabase:', resErr)
        }
      }

      // 2. Fetch Equipments dari Supabase
      let normalizedEquipments = []
      const { data: eqData, error: eqErr } = await supabase
        .from('equipments')
        .select('*')
        .order('created_at', { ascending: false })

      if (!eqErr && eqData) {
        normalizedEquipments = eqData.map(item => ({
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
          reuseCount: item.reusedCount || item.reuseCount || 0,
          reusedCount: item.reusedCount || 0,
          maxReuse: item.maxReuse || 30,
          size: item.size || 'Standar',
          material: item.material || 'Material Campuran',
          condition: item.condition || 'Good',
          owner: (item.owner || 'Ormawa Kampus').replace(/sarpras/gi, 'Pengelola Kampus'),
          ownerBank: item.ownerBank || 'BCA 8012345678',
          description: item.description || '',
          lastLocation: (item.lastLocation || 'Warehouse Kampus Gedung C').replace(/sarpras/gi, 'Kampus'),
          lastStoragePhoto: item.lastStoragePhoto || null,
          uploader: item.uploader || 'Admin'
        }))
      }

      // Gabungkan base default items dari equipmentData dengan data dari Supabase equipments
      const catalogMap = new Map()
      equipmentData.forEach(item => {
        catalogMap.set(String(item.id), {
          ...item,
          reuseCount: item.reusedCount || 0,
          reusedCount: item.reusedCount || 0
        })
      })

      normalizedEquipments.forEach(item => {
        catalogMap.set(String(item.id), item)
      })

      // 3. Fetch Transactions dari Supabase
      const { data: txnData, error: txnErr } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (!txnErr && txnData) {
        // A. Ekstrak & gabungkan perlengkapan yang disetujui Admin yang tersimpan permanen di cloud transactions
        txnData.forEach(t => {
          if (t.qris_status === 'Equipment Approved by Admin') {
            try {
              let parsed = {}
              if (t.payout_status && t.payout_status.startsWith('{')) {
                parsed = JSON.parse(t.payout_status)
              }
              const approvedEq = {
                id: parsed.id || `eq-${t.id.slice(0, 8)}`,
                dbTxnId: t.id,
                name: parsed.name,
                category: parsed.category || 'General',
                price: Number(parsed.price) || Number(t.amount) || 0,
                salePrice: parsed.salePrice ? Number(parsed.salePrice) : null,
                listingType: parsed.listingType || parsed.pricingType || (parsed.salePrice ? 'sale' : 'rental'),
                available: Number(parsed.available) || Number(parsed.qty) || 1,
                total: Number(parsed.total) || Number(parsed.qty) || 1,
                image: parsed.image || (parsed.imagePreview ? '📷' : '📦'),
                imageUrl: parsed.imageUrl || parsed.imagePreview || null,
                circularScore: Number(parsed.circularScore) || 88,
                reuseCount: 0,
                reusedCount: 0,
                maxReuse: Number(parsed.maxReuse) || 30,
                size: parsed.size || 'Standar',
                material: parsed.material || 'Aluminium',
                condition: parsed.condition || 'Good',
                owner: parsed.owner || parsed.ownerOrg || t.buyer_org || 'Ormawa Kampus',
                ownerBank: parsed.ownerBank || parsed.bankInfo || 'BCA 8012345678',
                description: parsed.description || '',
                lastLocation: parsed.lastLocation || parsed.initialLocation || 'Warehouse Kampus Gedung C',
                lastStoragePhoto: parsed.lastStoragePhoto || parsed.initialStoragePhoto || null,
                uploader: parsed.uploader || t.buyer_org || 'Mahasiswa'
              }

              const alreadyExists = Array.from(catalogMap.values()).some(e => 
                String(e.id) === String(approvedEq.id) || 
                (e.name?.toLowerCase().trim() === approvedEq.name?.toLowerCase().trim() && e.uploader === approvedEq.uploader)
              )
              if (!alreadyExists && approvedEq.name) {
                catalogMap.set(String(approvedEq.id), approvedEq)
              }
            } catch (err) {
              console.warn('Gagal parse approved equipment dari transactions:', err)
            }
          }
        })

        setEquipments(Array.from(catalogMap.values()))

        // B. Pisahkan transaksi umum, return, dan permohonan barang baru
        const orderTxns = txnData.filter(t => !t.item_names?.startsWith('[RETURN_REQ]') && !t.item_names?.startsWith('[EQUIPMENT_UPLOAD]'))

        if (orderTxns.length === 0) {
          setTransactions([])
          localStorage.removeItem('eventloop_transactions')
        } else {
          setTransactions(prevLocal => {
            const normalizedTxn = orderTxns.map(t => {
              const localMatch = prevLocal.find(lt => lt.id === t.id || (lt.itemName === t.item_names && lt.amount === Number(t.amount)))
              return {
                id: t.id,
                buyerOrg: t.buyer_org || localMatch?.buyerOrg || 'BEM Prasmul',
                borrowerName: localMatch?.borrowerName || t.buyer_org || 'Mahasiswa Prasmul',
                eventName: localMatch?.eventName || 'Kegiatan Kemahasiswaan Prasmul',
                startDate: localMatch?.startDate || '03 Nov 2026',
                endDate: localMatch?.endDate || '05 Nov 2026',
                durationDays: localMatch?.durationDays || 2,
                eventLocation: localMatch?.eventLocation || 'Auditorium Kampus BSD',
                itemName: t.item_names || 'Reservasi Perlengkapan',
                borrowedItems: localMatch?.borrowedItems || [],
                amount: Number(t.amount) || 0,
                paymentProofPhoto: localMatch?.paymentProofPhoto || null,
                payoutProofPhoto: localMatch?.payoutProofPhoto || null,
                qrisStatus: t.qris_status || 'Pending Admin Verification',
                payoutStatus: t.payout_status || 'Waiting Admin Approval',
                paidAt: t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : 'Baru saja',
                bankAdminRef: `BCA-QRIS-${String(t.id).slice(0, 6)}`,
                ownerOrg: localMatch?.ownerOrg || 'Organisasi Pemilik & EventLoop',
                ownerBank: localMatch?.ownerBank || 'BCA 8012345678 a.n Owner',
                payoutAmount: Math.round((Number(t.amount) || 0) * 0.95),
                adminFee: Math.round((Number(t.amount) || 0) * 0.05),
              }
            })
            return normalizedTxn
          })
        }

        // C. SINKRONISASI REAL-TIME: Status Pembayaran User dari Database Cloud Supabase
        const latestOrderTxn = orderTxns[0]
        const clearedTxnId = (typeof window !== 'undefined') ? localStorage.getItem('eventloop_cleared_txn_id') : null

        if (!hasCloudReservation && latestOrderTxn && String(latestOrderTxn.id) !== String(clearedTxnId)) {
          const qStatus = (latestOrderTxn.qris_status || '').toLowerCase()
          if (qStatus.includes('approved') || qStatus.includes('lunas') || qStatus.includes('sukses')) {
            setUserPaymentStatus('approved')
            try { localStorage.setItem('eventloop_user_payment_status', 'approved') } catch (e) {}

            // Sinkronisasi activeReservation jika data lokal hilang saat refresh & belum ada di tabel reservations
            setActiveReservation(prev => {
              // Jika activeReservation sudah memiliki items lengkap, pertahankan
              if (prev && prev.items && prev.items.length > 0) {
                return {
                  ...prev,
                  txnId: prev.txnId || latestOrderTxn.id,
                  totalAmount: prev.totalAmount || latestOrderTxn.amount
                }
              }

              // Rekonstruksi items dari catalog berdasarkan item_names di transaksi
              const parsedItems = []
              const rawNames = latestOrderTxn.item_names?.split(',') || []
              rawNames.forEach(rn => {
                const clean = rn.replace(/\(\d+x\)/, '').trim()
                const matchEq = Array.from(catalogMap.values()).find(e => 
                  e.name.toLowerCase().includes(clean.toLowerCase()) || 
                  clean.toLowerCase().includes(e.name.toLowerCase())
                )
                if (matchEq) {
                  const qtyMatch = rn.match(/\((\d+)x\)/)?.[1]
                  parsedItems.push({
                    ...matchEq,
                    qty: qtyMatch ? parseInt(qtyMatch, 10) : 1
                  })
                }
              })

              return {
                eventName: prev?.eventName || 'Kegiatan Kampus Prasmul',
                org: prev?.org || latestOrderTxn.buyer_org || 'Prasmulyan',
                startDateLabel: prev?.startDateLabel || '04 Nov 2026',
                endDateLabel: prev?.endDateLabel || '06 Nov 2026',
                eventDate: prev?.eventDate || '04 Nov 2026 – 06 Nov 2026',
                items: parsedItems.length > 0 ? parsedItems : (prev?.items || []),
                txnId: latestOrderTxn.id,
                totalAmount: latestOrderTxn.amount
              }
            })
          } else if (qStatus.includes('pending') || qStatus.includes('menunggu')) {
            setUserPaymentStatus('pending_admin_approval')
            try { localStorage.setItem('eventloop_user_payment_status', 'pending_admin_approval') } catch (e) {}
          } else if (qStatus.includes('reject') || qStatus.includes('tolak')) {
            setUserPaymentStatus('rejected')
            try { localStorage.setItem('eventloop_user_payment_status', 'rejected') } catch (e) {}
          }
        }
      }

      // 4. Fetch Returns dari Supabase (Dual Source: dari Transactions & Returns Table)
      const pendingReturnsMap = new Map()

      // A. Ambil dari transaksi dengan status 'Pending Return Verification'
      if (!txnErr && txnData) {
        txnData.forEach(t => {
          if (t.qris_status === 'Pending Return Verification') {
            try {
              let parsed = {}
              if (t.payout_status && t.payout_status.startsWith('{')) {
                parsed = JSON.parse(t.payout_status)
              }
              const eqIdMatch = t.item_names?.match(/\[RETURN_REQ\]\s*([^:]+)/)?.[1]?.trim()
              const retItem = {
                id: parsed.returnId || parsed.id || t.id,
                returnId: parsed.returnId || parsed.id || t.id,
                dbTxnId: t.id,
                equipmentId: parsed.equipmentId || (eqIdMatch ? (!isNaN(eqIdMatch) ? Number(eqIdMatch) : eqIdMatch) : 1),
                itemName: parsed.itemName || t.buyer_org || 'Perlengkapan',
                itemCode: parsed.itemCode || `ITEM-${parsed.equipmentId || eqIdMatch || ''}`,
                returnedQty: parsed.returnedQty || t.amount || 1,
                borrower: parsed.borrower || t.buyer_org || 'Prasmulyan',
                returnLocation: parsed.returnLocation || 'Warehouse Kampus Gedung C',
                conditionPhoto: parsed.conditionPhoto || null,
                storagePhoto: parsed.storagePhoto || null,
                status: 'Pending Admin Verification',
                timestamp: parsed.timestamp || (t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : 'Baru saja')
              }
              pendingReturnsMap.set(retItem.id, retItem)
            } catch (err) {
              console.warn('Gagal parse return transaksi:', err)
            }
          }
        })
      }

      // B. Ambil juga dari tabel returns jika tabel tersebut aktif
      try {
        const { data: retData, error: retErr } = await supabase
          .from('returns')
          .select('*')
          .order('created_at', { ascending: false })

        if (!retErr && retData && retData.length > 0) {
          retData
            .filter(r => (r.status || '').toLowerCase().includes('pending'))
            .forEach(r => {
              if (!pendingReturnsMap.has(r.id)) {
                pendingReturnsMap.set(r.id, {
                  id: r.id,
                  returnId: r.id,
                  equipmentId: !isNaN(r.equipment_id) ? Number(r.equipment_id) : r.equipment_id,
                  itemName: r.item_name || 'Perlengkapan',
                  itemCode: `ITEM-${r.equipment_id}`,
                  conditionPhoto: r.condition_photo,
                  storagePhoto: r.storage_photo,
                  returnedQty: r.returned_qty || 1,
                  borrower: r.borrower || 'Prasmulyan',
                  returnLocation: r.return_location || 'Warehouse Kampus Gedung C',
                  status: r.status || 'Pending Admin Verification',
                  timestamp: r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : 'Baru saja'
                })
              }
            })
        }
      } catch (retFetchErr) {
        console.warn('Catatan tabel returns:', retFetchErr)
      }

      const mergedReturns = Array.from(pendingReturnsMap.values())
      setPendingReturns(mergedReturns)

      // 5. Fetch Pending Equipment Approvals dari Supabase
      const pendingApprovalsMap = new Map()
      if (!txnErr && txnData) {
        txnData.forEach(t => {
          if (t.qris_status === 'Pending Equipment Approval') {
            try {
              let parsed = {}
              if (t.payout_status && t.payout_status.startsWith('{')) {
                parsed = JSON.parse(t.payout_status)
              }
              const pendingItem = {
                ...parsed,
                id: parsed.id || t.id,
                dbTxnId: t.id,
                name: parsed.name || t.item_names?.replace(/\[EQUIPMENT_UPLOAD\]\s*/, '')?.split(':::')?.[0]?.trim() || 'Barang Baru',
                uploader: parsed.uploader || t.buyer_org || 'Prasmulyan',
                dateSubmitted: parsed.dateSubmitted || (t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : 'Hari ini'),
                status: 'Pending Admin Check'
              }
              pendingApprovalsMap.set(pendingItem.id, pendingItem)
            } catch (err) {
              console.warn('Gagal parse pending equipment dari transaksi:', err)
            }
          }
        })
      }
      setPendingApprovals(Array.from(pendingApprovalsMap.values()))

      // 6. Fetch Campus Impact dari Supabase atau Agregasi Dinamis Real-Time
      let loadedImpactFromDb = false
      try {
        const { data: impactRow, error: impactErr } = await supabase
          .from('campus_impact')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (!impactErr && impactRow && Number(impactRow.items_reused) > 0) {
          setCampusImpact({
            itemsReused: Number(impactRow.items_reused) || impactData.totalItemsReused,
            wasteAvoidedKg: Number(impactRow.waste_avoided_kg) || Math.round(impactData.wasteAvoided),
            costAvoided: Number(impactRow.cost_avoided) || impactData.costAvoided,
            eventsSupported: Number(impactRow.events_supported) || impactData.totalEventsSupported,
            circularScore: Number(impactRow.circular_score) || 91
          })
          loadedImpactFromDb = true
        }
      } catch (e) {
        console.warn('campus_impact fetch error:', e)
      }

      if (!loadedImpactFromDb) {
        const completedTxnCount = (txnData || []).filter(t => 
          (t.qris_status || '').toLowerCase().includes('approved') || 
          (t.qris_status || '').toLowerCase().includes('return')
        ).length

        const dynamicReused = impactData.totalItemsReused + (completedTxnCount * 3)
        const dynamicWasteKg = Math.round(impactData.wasteAvoided + (completedTxnCount * 4.5))
        const dynamicCostAvoided = impactData.costAvoided + (completedTxnCount * 150000)
        const dynamicEvents = impactData.totalEventsSupported + completedTxnCount

        setCampusImpact({
          itemsReused: dynamicReused,
          wasteAvoidedKg: dynamicWasteKg,
          costAvoided: dynamicCostAvoided,
          eventsSupported: dynamicEvents,
          circularScore: 91
        })
      }

      // 7. Fetch Organization Impact dari Supabase
      try {
        const { data: orgData, error: orgErr } = await supabase
          .from('organization_impact')
          .select('*')
          .order('circular_score', { ascending: false })

        if (!orgErr && orgData && orgData.length > 0) {
          setOrgImpacts(orgData)
        } else {
          setOrgImpacts(
            (impactData.topOrganizations || []).map((o, idx) => ({
              id: idx + 1,
              org_name: o.name,
              events_count: o.events,
              items_reused: o.reused,
              circular_score: o.score
            }))
          )
        }
      } catch (e) {
        console.warn('organization_impact fetch error:', e)
        setOrgImpacts(
          (impactData.topOrganizations || []).map((o, idx) => ({
            id: idx + 1,
            org_name: o.name,
            events_count: o.events,
            items_reused: o.reused,
            circular_score: o.score
          }))
        )
      }
    } catch (err) {
      console.warn('Gagal memuat data dari Supabase, menggunakan data lokal:', err)
    } finally {
      setLoadingDb(false)
    }
  }, [])

  useEffect(() => {
    fetchSupabaseData()

    // Realtime channel listener untuk sinkronisasi otomatis transaksi, pengembalian, perlengkapan, dan reservasi aktif
    const channel = supabase
      .channel('public:eventloop_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchSupabaseData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, () => {
        fetchSupabaseData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, () => {
        fetchSupabaseData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchSupabaseData()
      })
      .subscribe()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        const meta = newSession.user.user_metadata || {}
        const userEmail = newSession.user.email || ''
        const adminName = getAdminDisplayName(userEmail)
        const name = adminName || meta.full_name || 'Prasmulyan'
        const nim = meta.nim || ''

        setCurrentUserName(name)
        if (meta.prodi_name) setCurrentUserStudyProgram(meta.prodi_name)

        if (isAdminEmail(userEmail)) {
          setCurrentUserRole('admin')
        } else {
          setCurrentUserRole('user')
        }

        try {
          const parsedNim = validateNimStructure(nim)
          if (parsedNim.isValid) setCurrentUserStudyProgram(parsedNim.prodiName)
          // Hanya sinkronkan ke tabel profiles jika email sudah terverifikasi resmi oleh OTP / Auth
          if (newSession.user?.email_confirmed_at && (parsedNim.isValid || isAdminEmail(userEmail))) {
            await supabase.from('profiles').upsert({
              id: newSession.user.id,
              email: userEmail,
              full_name: name,
              nim: nim,
              prodi: parsedNim.isValid ? parsedNim.prodiName : (meta.prodi_name || null),
              school: parsedNim.isValid ? parsedNim.schoolName : (meta.school || null),
              updated_at: new Date().toISOString()
            })
          }
        } catch (e) {
          console.warn('Profile sync notice:', e)
        }

        // Segera mutakhirkan data peminjaman cloud untuk user saat login / refresh token
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          fetchSupabaseData()
        }
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [fetchSupabaseData])

  // --- CART ACTIONS ---
  const addToCart = (equipment, qty = 1) => {
    if (userPaymentStatus !== 'idle') return
    setCartItems(prev => {
      const existing = prev.find(item => item.id === equipment.id)
      if (existing) {
        return prev.map(item => item.id === equipment.id ? { ...item, qty: Math.min(item.available || 99, item.qty + qty) } : item)
      }
      return [...prev, { ...equipment, qty }]
    })
  }

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id))
  
  const updateCartQty = (id, newQtyOrDelta, isAbsolute = true) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const maxAvail = item.available || 99
        const target = isAbsolute ? newQtyOrDelta : item.qty + newQtyOrDelta
        if (target <= 0) return null
        return { ...item, qty: Math.max(1, Math.min(maxAvail, target)) }
      }
      return item
    }).filter(Boolean))
  }

  // --- ACTIONS UPLOAD & VERIFIKASI ---
  const uploadEquipmentByUser = async (newEquipment) => {
    const pendingId = `APV-${Date.now().toString().slice(-4)}`
    const pendingItem = {
      ...newEquipment,
      id: pendingId,
      dateSubmitted: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Pending Admin Check',
      uploader: currentUserName || 'Prasmulyan'
    }

    // Simpan ke Supabase transactions agar terbaca di portal Admin semua perangkat
    try {
      const { data, error } = await supabase.from('transactions').insert([{
        buyer_org: pendingItem.uploader,
        item_names: `[EQUIPMENT_UPLOAD] ${pendingItem.name}:::${pendingId}`,
        amount: Number(pendingItem.price) || 0,
        qris_status: 'Pending Equipment Approval',
        payout_status: JSON.stringify(pendingItem)
      }]).select()
      
      if (!error && data && data.length > 0) {
        pendingItem.dbTxnId = data[0].id
      }
    } catch (err) {
      console.warn('Gagal sync upload equipment ke Supabase:', err)
    }

    setPendingApprovals(prev => [pendingItem, ...prev.filter(p => p.id !== pendingId)])
    return pendingItem.id
  }

  const approveEquipmentByAdmin = async (approvalId) => {
    const itemToApprove = pendingApprovals.find(p => p.id === approvalId)
    if (!itemToApprove) return

    const priceVal = itemToApprove.pricingType === 'sale' ? (Number(itemToApprove.price) || 50000) : (Number(itemToApprove.price) || 20000)
    const salePriceVal = itemToApprove.pricingType === 'sale' ? (Number(itemToApprove.salePrice) || priceVal) : null

    // Objek bersih yang persis sesuai dengan skema kolom Supabase (tanpa kolom reuseCount ilegal)
    const cleanMarketplaceItem = {
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
      owner: `${itemToApprove.ownerOrg || currentUserName || 'Organisasi Mahasiswa'}`,
      ownerBank: itemToApprove.bankInfo || itemToApprove.bankAccount || 'BCA 8012345678 a.n Owner',
      description: itemToApprove.description || 'Perlengkapan organisasi kampus siap pakai.',
      lastLocation: itemToApprove.initialLocation || 'Warehouse Kampus Gedung C',
      lastStoragePhoto: itemToApprove.initialStoragePhoto || null,
      uploader: itemToApprove.uploader || currentUserName
    }

    try {
      const { data, error } = await supabase
        .from('equipments')
        .insert([cleanMarketplaceItem])
        .select()
      
      if (!error && data && data.length > 0) {
        cleanMarketplaceItem.id = data[0].id
      } else {
        console.warn('Equipments insert error in Supabase:', error)
        cleanMarketplaceItem.id = Date.now()
      }
    } catch (err) {
      console.warn('Gagal simpan ke Supabase equipments, gunakan lokal:', err)
      cleanMarketplaceItem.id = Date.now()
    }

    const approvedPayload = {
      ...cleanMarketplaceItem,
      id: cleanMarketplaceItem.id,
      dbTxnId: itemToApprove.dbTxnId || null
    }

    // Tandai status upload di database transactions sudah disetujui beserta payload perlengkapan
    try {
      if (itemToApprove.dbTxnId) {
        await supabase
          .from('transactions')
          .update({
            qris_status: 'Equipment Approved by Admin',
            payout_status: JSON.stringify(approvedPayload)
          })
          .eq('id', itemToApprove.dbTxnId)
      } else {
        const { data: insertedTx } = await supabase
          .from('transactions')
          .insert([{
            buyer_org: cleanMarketplaceItem.uploader,
            item_names: `[EQUIPMENT_UPLOAD] ${cleanMarketplaceItem.name}:::${cleanMarketplaceItem.id}`,
            amount: cleanMarketplaceItem.price,
            qris_status: 'Equipment Approved by Admin',
            payout_status: JSON.stringify(approvedPayload)
          }]).select()
        if (insertedTx && insertedTx.length > 0) {
          cleanMarketplaceItem.dbTxnId = insertedTx[0].id
        }
      }
    } catch (e) {
      console.warn('Gagal update status upload di transactions:', e)
    }

    setEquipments(prev => [cleanMarketplaceItem, ...prev.filter(e => String(e.id) !== String(cleanMarketplaceItem.id))])
    setPendingApprovals(prev => prev.filter(p => p.id !== approvalId && p.dbTxnId !== approvalId))
  }

  const rejectEquipmentByAdmin = async (approvalId) => {
    const itemToReject = pendingApprovals.find(p => p.id === approvalId)
    try {
      if (itemToReject?.dbTxnId) {
        await supabase
          .from('transactions')
          .update({ qris_status: 'Equipment Rejected by Admin' })
          .eq('id', itemToReject.dbTxnId)
      } else {
        await supabase
          .from('transactions')
          .update({ qris_status: 'Equipment Rejected by Admin' })
          .ilike('item_names', `%[EQUIPMENT_UPLOAD]%${approvalId}%`)
      }
    } catch (e) {
      console.warn('Gagal update status reject di transactions:', e)
    }
    setPendingApprovals(prev => prev.filter(p => p.id !== approvalId))
  }

  // --- ACTIONS TRANSAKSI & QRIS ---
  const submitUserQrisPayment = async (arg1, arg2) => {
    const isObjectArg = typeof arg1 === 'object' && arg1 !== null
    const totalAmount = isObjectArg ? arg1.totalAmount : Number(arg1) || 0
    const paymentProofPhoto = isObjectArg ? arg1.paymentProofPhoto : arg2 || null

    const txnId = `TXN-QRIS-${Math.floor(100 + Math.random() * 900)}`
    
    // Potong ketersediaan stok di state lokal dan sinkronkan ke database Supabase
    setEquipments(prev => prev.map(eq => {
      const reservedItem = cartItems.find(cart => cart.id === eq.id)
      if (reservedItem) {
        return { ...eq, available: Math.max(0, eq.available - reservedItem.qty) }
      }
      return eq
    }))

    for (const item of cartItems) {
      const currentEq = equipments.find(e => String(e.id) === String(item.id))
      if (currentEq) {
        const newAvail = Math.max(0, (currentEq.available || 1) - (item.qty || 1))
        try {
          if (!isNaN(item.id)) {
            await supabase
              .from('equipments')
              .update({ available: newAvail })
              .eq('id', item.id)
          }
          if (currentEq.dbTxnId) {
            const updatedPayload = { ...currentEq, available: newAvail }
            await supabase
              .from('transactions')
              .update({ payout_status: JSON.stringify(updatedPayload) })
              .eq('id', currentEq.dbTxnId)
          }
        } catch (eqErr) {
          console.warn('Gagal potong stok di Supabase:', eqErr)
        }
      }
    }

    const firstCartItem = cartItems[0]
    const detectedOwnerOrg = firstCartItem?.owner || 'Organisasi Pemilik Barang'
    const detectedOwnerBank = firstCartItem?.ownerBank || 'BCA 8012345678 a.n Owner'
    const itemNamesSummary = cartItems.map(i => `${i.name} (${i.qty}x)`).join(', ') || 'Reservasi Perlengkapan Event'

    const startDateLabel = activeReservation?.startDateLabel || activeReservation?.startDate || '04 Nov 2026'
    const endDateLabel = activeReservation?.endDateLabel || activeReservation?.endDate || '06 Nov 2026'
    const durationDays = Math.max(1, Number(activeReservation?.durationDays) || 1)

    const borrowedSnapshot = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      image: item.image || '📦',
      owner: item.owner,
      uploader: item.uploader,
      originLocation: item.lastLocation || item.initialLocation || 'Warehouse Kampus Gedung C'
    }))

    const newTxn = {
      id: txnId,
      buyerOrg: activeReservation?.org || currentUserName || 'BEM Prasetiya Mulya',
      borrowerName: currentUserName || 'Prasmulyan',
      eventName: activeReservation?.eventName || 'Kegiatan Kampus Prasmul',
      startDate: startDateLabel,
      endDate: endDateLabel,
      durationDays,
      eventLocation: activeReservation?.location || 'Auditorium Kampus BSD',
      itemName: itemNamesSummary,
      borrowedItems: borrowedSnapshot,
      amount: totalAmount,
      paymentProofPhoto,
      payoutProofPhoto: null,
      qrisStatus: 'Pending Admin Verification',
      paidAt: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      bankAdminRef: `BCA-QRIS-${Math.floor(1000000 + Math.random() * 9000000)}`,
      ownerOrg: detectedOwnerOrg,
      ownerBank: detectedOwnerBank,
      payoutStatus: 'Waiting Admin Approval',
      payoutAmount: Math.round(totalAmount * 0.95),
      adminFee: Math.round(totalAmount * 0.05),
    }

    let createdTxnId = txnId
    try {
      const { data: inserted, error: dbErr } = await supabase.from('transactions').insert([{
        buyer_org: newTxn.buyerOrg,
        item_names: newTxn.itemName,
        amount: newTxn.amount,
        qris_status: 'Pending Admin Verification',
        payout_status: 'Waiting Admin Approval'
      }]).select()

      if (!dbErr && inserted?.[0]?.id) {
        createdTxnId = inserted[0].id
        newTxn.id = createdTxnId
      }
    } catch (dbErr) {
      console.warn('Gagal sync transaksi ke Supabase:', dbErr)
    }

    setTransactions(prev => [newTxn, ...prev])
    
    const activeReservationPayload = { 
      ...(activeReservation || {}),
      eventName: activeReservation?.eventName || 'Kegiatan Kampus Prasmul',
      org: activeReservation?.org || currentUserName || 'BEM Prasetiya Mulya',
      startDateLabel,
      endDateLabel,
      eventDate: `${startDateLabel} – ${endDateLabel}`,
      durationDays,
      location: activeReservation?.location || 'Auditorium Kampus BSD',
      items: cartItems.map(item => ({
        ...item,
        lastLocation: item.lastLocation || item.initialLocation || 'Warehouse Kampus Gedung C'
      })), 
      txnId: createdTxnId,
      totalAmount,
      paymentProofPhoto,
      paymentStatus: 'pending_admin_approval'
    }

    setActiveReservation(activeReservationPayload)
    setCartItems([])
    setUserPaymentStatus('pending_admin_approval')
    try {
      localStorage.setItem('eventloop_user_payment_status', 'pending_admin_approval')
      localStorage.setItem('eventloop_active_reservation', JSON.stringify(activeReservationPayload))
      localStorage.removeItem('eventloop_cleared_txn_id')
    } catch (e) {}

    // Segera sinkronkan ke tabel reservations di cloud Supabase
    const activeUserId = session?.user?.id
    if (activeUserId) {
      try {
        const cloudRes = {
          user_id: activeUserId,
          item_name: JSON.stringify(activeReservationPayload),
          quantity: cartItems.length,
          status: 'pending_admin_approval',
          start_date: activeReservation?.startDate || activeReservation?.startDateLabel || new Date().toISOString()
        }

        const { data: existing } = await supabase
          .from('reservations')
          .select('id')
          .eq('user_id', activeUserId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (existing && existing.length > 0) {
          await supabase.from('reservations').update(cloudRes).eq('id', existing[0].id)
        } else {
          await supabase.from('reservations').insert([cloudRes])
        }
      } catch (err) {
        console.warn('Gagal sync reservation saat submit QRIS:', err)
      }
    }
  }

  const approvePaymentByAdmin = async (txnId) => {
    try {
      if (txnId) {
        const { error: updErr } = await supabase
          .from('transactions')
          .update({
            qris_status: 'Payment Approved by Admin (Lunas)',
            payout_status: 'Pending Transfer'
          })
          .eq('id', txnId)

        if (updErr) {
          console.warn('Update transaksi spesifik gagal, update status pending:', updErr)
          await supabase
            .from('transactions')
            .update({
              qris_status: 'Payment Approved by Admin (Lunas)',
              payout_status: 'Pending Transfer'
            })
            .eq('qris_status', 'Pending Admin Verification')
        }
      } else {
        await supabase
          .from('transactions')
          .update({
            qris_status: 'Payment Approved by Admin (Lunas)',
            payout_status: 'Pending Transfer'
          })
          .eq('qris_status', 'Pending Admin Verification')
      }

      // Update juga status di tabel reservations cloud
      await supabase
        .from('reservations')
        .update({ status: 'approved' })
        .eq('status', 'pending_admin_approval')
    } catch (err) {
      console.warn('Gagal update transaksi di Supabase:', err)
    }

    setTransactions(prev => prev.map(t => {
      if (t.id === txnId || !txnId) {
        return {
          ...t,
          qrisStatus: 'Payment Approved by Admin (Lunas)',
          payoutStatus: 'Pending Transfer'
        }
      }
      return t
    }))
    setUserPaymentStatus('approved')
    try { localStorage.setItem('eventloop_user_payment_status', 'approved') } catch (e) {}
  }

  const transferPayoutToOwner = async (txnId, proofPhoto = null) => {
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
          payoutProofPhoto: proofPhoto || t.payoutProofPhoto || null,
          transferredAt: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
        }
      }
      return t
    }))
  }

  // --- BATALKAN / RESET EVENT AKTIF ---
  const clearActiveEvent = async () => {
    try {
      const lastTxn = transactions[0]?.id
      if (lastTxn) {
        localStorage.setItem('eventloop_cleared_txn_id', String(lastTxn))
      }
    } catch (e) {}
    setActiveReservation(null)
    setUserPaymentStatus('idle')
    setCartItems([])
    setReturnStatus('idle')
    try {
      localStorage.removeItem('eventloop_active_reservation')
      localStorage.removeItem('eventloop_user_payment_status')
      localStorage.removeItem('eventloop_cart')
      localStorage.removeItem('eventloop_return_status')
    } catch (e) {}

    const uid = session?.user?.id
    if (uid) {
      try {
        await supabase
          .from('reservations')
          .delete()
          .eq('user_id', uid)
      } catch (err) {
        console.warn('Gagal menghapus reservation dari cloud:', err)
      }
    }
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
    try {
      if (!isNaN(id)) {
        await supabase.from('equipments').delete().eq('id', id)
      }
      await supabase.from('transactions').delete().ilike('item_names', `%${id}%`)
      await supabase.from('transactions').update({ qris_status: 'Equipment Deleted' }).ilike('item_names', `%${id}%`)
    } catch (err) {
      console.warn('Gagal hapus equipment di Supabase:', err)
    }

    setEquipments(prev => prev.filter(item => String(item.id) !== String(id)))
    setCartItems(prev => prev.filter(item => String(item.id) !== String(id)))
    return true
  }

  const deletePendingEquipment = async (id) => {
    try {
      await supabase.from('transactions').delete().ilike('item_names', `%${id}%`)
      await supabase.from('transactions').update({ qris_status: 'Equipment Deleted' }).ilike('item_names', `%${id}%`)
    } catch (err) {
      console.warn('Gagal hapus pending equipment di Supabase:', err)
    }
    setPendingApprovals(prev => prev.filter(item => String(item.id) !== String(id)))
  }

  // --- ACTIONS PENGEMBALIAN BARANG ---
  const submitUserReturnProof = async (returnData) => {
    const returnId = `RET-${Math.floor(Math.random() * 9000) + 1000}`
    const borrowerName = returnData.borrower || currentUserName || 'Prasmulyan'
    const newReturn = {
      id: returnId,
      returnId,
      ...returnData,
      borrower: borrowerName,
      timestamp: returnData.timestamp || (new Date().toLocaleString('id-ID') + ' WIB')
    }

    // 1. Dual-Sync ke Supabase:
    // Sync ke tabel transactions (yang terbukti 100% didukung RLS dan terbaca di semua perangkat admin)
    try {
      const { error: txErr } = await supabase.from('transactions').insert([{
        buyer_org: borrowerName,
        item_names: `[RETURN_REQ] ${returnData.equipmentId}:::${returnData.itemName}:::${returnData.returnedQty || 1}:::${returnId}`,
        amount: returnData.returnedQty || 1,
        qris_status: 'Pending Return Verification',
        payout_status: JSON.stringify({
          ...newReturn,
          returnId,
          dbSyncType: 'transaction_return'
        })
      }])
      if (txErr) {
        console.warn('Gagal sync return ke transactions:', txErr)
      }
    } catch (txEx) {
      console.warn('Exception sync return ke transactions:', txEx)
    }

    // 2. Sync juga ke tabel returns jika tabel tersebut aktif/sudah diperbaiki
    try {
      await supabase.from('returns').insert([{
        equipment_id: String(returnData.equipmentId || ''),
        condition_photo: returnData.conditionPhoto || null,
        storage_photo: returnData.storagePhoto || null,
        status: 'Pending Admin Verification',
        returned_qty: returnData.returnedQty || 1,
        borrower: borrowerName,
        return_location: returnData.returnLocation || null
      }])
    } catch (err) {
      console.warn('Gagal kirim bukti return ke tabel returns:', err)
    }

    setPendingReturns(prev => [newReturn, ...prev.filter(r => r.id !== returnId)])
    setReturnStatus('pending_admin_approval')
  }

  const approveReturnByAdmin = async (returnId, equipmentId, returnedQty) => {
    const returnData = pendingReturns.find(r => r.id === returnId || r.returnId === returnId)
    const targetEq = equipments.find(e => String(e.id) === String(equipmentId))
    const finalLocation = returnData?.returnLocation || targetEq?.lastLocation || targetEq?.initialLocation || 'Warehouse Kampus Gedung C'
    const qtyToAdd = Number(returnedQty) || 1

    try {
      // 1. Update di tabel transactions (tandai return sudah di-approve)
      if (returnData?.dbTxnId) {
        await supabase
          .from('transactions')
          .update({ qris_status: 'Return Approved by Admin' })
          .eq('id', returnData.dbTxnId)
      } else {
        await supabase
          .from('transactions')
          .update({ qris_status: 'Return Approved by Admin' })
          .ilike('item_names', `%${returnId}%`)
      }

      // 2. Update di tabel returns jika ada
      try {
        await supabase
          .from('returns')
          .update({ status: 'Approved' })
          .eq('id', returnId)
      } catch (e) {
        // Abaikan jika tabel returns belum sinkron
      }

      // 3. Update stok dan lokasi perlengkapan di Supabase
      if (equipmentId) {
        if (!isNaN(equipmentId) && targetEq) {
          await supabase
            .from('equipments')
            .update({ 
              available: targetEq.available + qtyToAdd,
              lastLocation: finalLocation,
              lastStoragePhoto: returnData?.storagePhoto || null
            })
            .eq('id', equipmentId)
        }
        if (targetEq?.dbTxnId) {
          const updatedPayload = {
            ...targetEq,
            available: (targetEq.available || 0) + qtyToAdd,
            lastLocation: finalLocation,
            lastStoragePhoto: returnData?.storagePhoto || targetEq.lastStoragePhoto
          }
          await supabase
            .from('transactions')
            .update({ payout_status: JSON.stringify(updatedPayload) })
            .eq('id', targetEq.dbTxnId)
        }
      }

      // 4. Update tabel reservations di Supabase jika item yang dikembalikan ada di active reservation
      try {
        const { data: allRes } = await supabase.from('reservations').select('*')
        if (allRes && allRes.length > 0) {
          for (const resRow of allRes) {
            if (resRow.item_name && resRow.item_name.startsWith('{')) {
              try {
                const parsed = JSON.parse(resRow.item_name)
                const hasItem = (parsed.items || []).some(i => String(i.id) === String(equipmentId))
                if (hasItem) {
                  const updatedItems = (parsed.items || []).filter(i => String(i.id) !== String(equipmentId))
                  await supabase
                    .from('reservations')
                    .update({
                      item_name: JSON.stringify({
                        ...parsed,
                        items: updatedItems
                      }),
                      quantity: updatedItems.length
                    })
                    .eq('id', resRow.id)
                }
              } catch (parseErr) {}
            }
          }
        }
      } catch (resErr) {
        console.warn('Gagal update reservations table saat approve return:', resErr)
      }
    } catch (err) {
      console.warn('Gagal update return status di Supabase:', err)
    }

    setPendingReturns(prev => prev.filter(r => r.id !== returnId && r.returnId !== returnId))
    setReturnStatus('approved_success')
    
    setEquipments(prev => prev.map(item => {
      if (String(item.id) === String(equipmentId)) {
        return { 
          ...item, 
          available: item.available + qtyToAdd,
          lastLocation: finalLocation,
          lastStoragePhoto: returnData?.storagePhoto || item.lastStoragePhoto,
          lastConditionPhoto: returnData?.conditionPhoto || null
        }
      }
      return item
    }))

    setActiveReservation(prev => {
      if (!prev || !prev.items) return prev
      const remainingItems = prev.items.filter(item => String(item.id) !== String(equipmentId))
      return {
        ...prev,
        items: remainingItems
      }
    })
  }

  // --- LIVE TRACKING EVENT & PEMINJAMAN KAMPUS (UNTUK DASHBOARD & BARANG SAYA) ---
  const ongoingCampusEvents = useMemo(() => {
    const list = []

    // 1. Jika user saat ini punya event aktif dan sudah memiliki item yang dipinjam/dalam proses
    if (activeReservation?.eventName && (userPaymentStatus === 'approved' || userPaymentStatus === 'pending_admin_approval')) {
      const currentItems = (cartItems && cartItems.length > 0) ? cartItems : (activeReservation.items || [])
      if (currentItems.length > 0) {
        const startLbl = activeReservation.startDateLabel || activeReservation.startDate || (activeReservation.eventDate ? activeReservation.eventDate.split('–')[0]?.trim() : '04 Nov 2026')
        const endLbl = activeReservation.endDateLabel || activeReservation.endDate || '06 Nov 2026'
        list.push({
          id: activeReservation.txnId || 'EVT-CURRENT',
          isCurrentUser: true,
          eventName: activeReservation.eventName,
          org: activeReservation.org || currentUserName || 'Organisasi Mahasiswa',
          borrowerName: currentUserName || 'Prasmulyan',
          startDate: startLbl,
          endDate: endLbl,
          durationDays: activeReservation.durationDays || 1,
          location: activeReservation.location || 'Auditorium Kampus BSD',
          status: userPaymentStatus === 'approved' ? 'Sedang Berjalan (Dipinjam)' : 'Verifikasi Pembayaran',
          items: currentItems.map(i => ({
            id: i.id,
            name: i.name,
            qty: i.qty || 1,
            image: i.image || '📦',
            originLocation: i.lastLocation || i.initialLocation || 'Warehouse Kampus Gedung C'
          }))
        })
      }
    }

    // 2. Dari transaksi aktual yang tercatat di database
    transactions.forEach((txn, idx) => {
      if (activeReservation?.txnId && txn.id === activeReservation.txnId) return
      if (txn.itemName?.startsWith('[RETURN_REQ]') || txn.itemName?.startsWith('[EQUIPMENT_UPLOAD]')) return
      const parsedItems = txn.borrowedItems && txn.borrowedItems.length > 0
        ? txn.borrowedItems
        : (txn.itemName || 'Perlengkapan Event').split(',').map((part, pIdx) => {
            const matchQty = part.match(/\((\d+)x\)/)
            const cleanName = part.replace(/\(\d+x\)/, '').trim()
            return {
              id: `txn-item-${idx}-${pIdx}`,
              name: cleanName,
              qty: matchQty ? parseInt(matchQty[1], 10) : 1,
              image: '📦',
              originLocation: 'Warehouse Kampus Gedung C'
            }
          })

      list.push({
        id: txn.id || `EVT-TXN-${idx}`,
        isCurrentUser: false,
        eventName: txn.eventName || 'Kegiatan Kemahasiswaan Prasmul',
        org: txn.buyerOrg || 'Organisasi Kampus',
        borrowerName: txn.borrowerName || txn.buyerOrg || 'Panitia Mahasiswa',
        startDate: txn.startDate || '03 Nov 2026',
        endDate: txn.endDate || '05 Nov 2026',
        durationDays: txn.durationDays || 2,
        location: txn.eventLocation || 'Atrium Gedung PMBS BSD',
        status: txn.qrisStatus?.includes('Pending') ? 'Verifikasi Pembayaran' : 'Sedang Berjalan (Dipinjam)',
        items: parsedItems
      })
    })

    return list
  }, [activeReservation, cartItems, currentUserName, userPaymentStatus, transactions])

  // Helper untuk mengecek siapa saja yang sedang meminjam suatu barang (dipakai di MyEquipment & EquipmentDetail)
  const getEquipmentBorrowings = useCallback((equipmentId, equipmentName) => {
    const matches = []
    ongoingCampusEvents.forEach(ev => {
      ev.items.forEach(it => {
        const idMatch = equipmentId !== undefined && String(it.id) === String(equipmentId)
        const nameMatch = equipmentName && it.name && it.name.toLowerCase().includes(String(equipmentName).toLowerCase())
        if (idMatch || nameMatch) {
          matches.push({
            eventId: ev.id,
            eventName: ev.eventName,
            borrowerName: ev.borrowerName,
            org: ev.org,
            startDate: ev.startDate,
            endDate: ev.endDate,
            durationDays: ev.durationDays,
            location: ev.location,
            qty: it.qty,
            status: ev.status
          })
        }
      })
    })
    return matches
  }, [ongoingCampusEvents])

  // --- LOGOUT HELPER ---
  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn(e)
    }
    setSession(null)
    setSsoUser(null)
    setCurrentUserRole('user')
    setCurrentUserName('Prasmulyan')
    setActiveReservation(null)
    setUserPaymentStatus('idle')
    setCartItems([])
    sessionStorage.removeItem('eventloop_session')
    sessionStorage.removeItem('eventloop_user_name')
    sessionStorage.removeItem('eventloop_role')
    sessionStorage.removeItem('eventloop_user_prodi')
    sessionStorage.removeItem('eventloop_sso_user')
    sessionStorage.removeItem('eventloop_last_active')
    localStorage.removeItem('eventloop_session')
    localStorage.removeItem('eventloop_user_name')
    localStorage.removeItem('eventloop_role')
    localStorage.removeItem('eventloop_user_prodi')
    localStorage.removeItem('eventloop_sso_user')
    localStorage.removeItem('eventloop_active_reservation')
    localStorage.removeItem('eventloop_user_payment_status')
    localStorage.removeItem('eventloop_cart')
    localStorage.removeItem('eventloop_return_status')
  }

  return (
    <AppContext.Provider value={{
      currentUserRole, setCurrentUserRole,
      currentUserName, setCurrentUserName,
      currentUserStudyProgram, setCurrentUserStudyProgram,
      session, ssoUser, setSsoUser, sessionUser: session?.user || ssoUser || null, 
      logout, loadingDb, refetchData: fetchSupabaseData, fetchSupabaseData,
      campusImpact, orgImpacts,
      equipments, pendingApprovals, transactions, userPaymentStatus, activeReservation, setActiveReservation, updateActiveEventDetails, clearActiveEvent, returnStatus, pendingReturns,
      ongoingCampusEvents, getEquipmentBorrowings,
      cartItems, addToCart, removeFromCart, updateCartQty,
      uploadEquipmentByUser, approveEquipmentByAdmin, rejectEquipmentByAdmin, submitUserQrisPayment, approvePaymentByAdmin,
      transferPayoutToOwner, updateEquipmentPriceAndStock, deleteEquipment, deletePendingEquipment, setUserPaymentStatus, submitUserReturnProof, approveReturnByAdmin,
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
