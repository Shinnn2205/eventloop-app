import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { equipmentData, impactData } from '../data/mockData'

const USER_LOCAL_STORAGE_KEYS = [
  'eventloop_active_reservation',
  'eventloop_user_payment_status',
  'eventloop_cart',
  'eventloop_return_status',
  'eventloop_pending_returns',
  'eventloop_cleared_txn_id',
  'eventloop_user_org',
  'eventloop_user_nim',
  'eventloop_user_phone',
  'eventloop_payout_bank',
  'eventloop_payout_acc_number',
  'eventloop_payout_acc_holder',
  'eventloop_user_name'
]

function clearUserLocalStorage() {
  if (typeof window === 'undefined') return
  try {
    USER_LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k))
  } catch (e) {}
}

const AppContext = createContext()

export const DEFAULT_STORAGE_LOCATION = 'Auditorium Lantai M PMBS'
export const PLATFORM_FEE_RATE = 0.05

export const isSystemMetaTxn = (itemNameStr) => /^\[(RETURN_REQ|EQUIPMENT_UPLOAD|USER_CONTACT)\]/.test(String(itemNameStr || ''))

export const formatIndonesianWaNumber = (rawPhone) => {
  let digits = String(rawPhone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  else if (digits.startsWith('8')) digits = '62' + digits
  return digits.length >= 10 ? digits : ''
}

export const buildWaLink = (rawPhone, messageText) => {
  const waNum = formatIndonesianWaNumber(rawPhone)
  const encoded = encodeURIComponent(messageText || '')
  return waNum
    ? `https://wa.me/${waNum}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
}

export const normalizeStorageLocation = (loc) => {
  const raw = String(loc || '').trim()
  if (!raw) return DEFAULT_STORAGE_LOCATION
  if (/^warehouse\s+kampus/i.test(raw) || /sarpras/i.test(raw)) {
    return DEFAULT_STORAGE_LOCATION
  }
  return raw
}

export const deriveOverallPayoutStatus = (ownerPayouts = [], fallbackStatus = 'Waiting Admin Approval') => {
  if (!Array.isArray(ownerPayouts) || ownerPayouts.length === 0) return fallbackStatus
  const statuses = ownerPayouts.map(op => op.status || fallbackStatus)
  if (statuses.every(s => s === 'Transferred' || s === 'Settled (Gratis)')) return 'Transferred'
  if (statuses.some(s => s === 'Transferred')) return 'Partial Transfer'
  if (statuses.some(s => s === 'Pending Transfer')) return 'Pending Transfer'
  if (statuses.every(s => s === 'Rejected')) return 'Rejected'
  if (statuses.every(s => s === 'Cancelled')) return 'Cancelled'
  return fallbackStatus
}

export const buildOwnerPayouts = ({
  items = [],
  durationDays = 1,
  catalogMap = null,
  defaultStatus = 'Waiting Admin Approval',
  fallbackOwnerOrg = 'Organisasi Pemilik & EventLoop',
  fallbackOwnerBank = 'BCA 8012345678 a.n Owner',
  fallbackTotalAmount = 0,
  fallbackProofPhoto = null,
  fallbackPayoutRef = null,
  fallbackTransferredAt = null
}) => {
  const days = Math.max(1, Number(durationDays) || 1)
  if (!Array.isArray(items) || items.length === 0) {
    const gross = Math.max(0, Math.round(Number(fallbackTotalAmount) || 0))
    const fee = Math.round(gross * PLATFORM_FEE_RATE)
    const net = Math.max(0, gross - fee)
    const isFree = gross === 0 && defaultStatus === 'Pending Transfer'
    return [{
      ownerKey: 'owner-0',
      ownerOrg: fallbackOwnerOrg,
      ownerBank: fallbackOwnerBank,
      uploader: fallbackOwnerOrg,
      itemsSummary: 'Perlengkapan Event',
      items: [],
      grossAmount: gross,
      adminFee: fee,
      payoutAmount: net,
      status: isFree ? 'Settled (Gratis)' : defaultStatus,
      payoutRef: fallbackPayoutRef,
      transferredAt: fallbackTransferredAt,
      payoutProofPhoto: fallbackProofPhoto
    }]
  }

  const groupMap = new Map()
  items.forEach((rawItem) => {
    const catEq = catalogMap
      ? (catalogMap.get(String(rawItem.id)) || Array.from(catalogMap.values()).find(e => e.name?.toLowerCase().trim() === rawItem.name?.toLowerCase().trim()))
      : null
    const listingType = rawItem.listingType || catEq?.listingType || 'rental'
    const unitPrice = rawItem.unitPrice !== undefined
      ? Number(rawItem.unitPrice)
      : listingType === 'free'
      ? 0
      : listingType === 'sale'
      ? Number(rawItem.salePrice ?? catEq?.salePrice ?? ((rawItem.price ?? catEq?.price ?? 0) * 5))
      : Number(rawItem.price ?? catEq?.price ?? 0)
    const qty = Math.max(1, Number(rawItem.qty) || 1)
    const dayMult = listingType === 'sale' ? 1 : days
    const itemSubtotal = rawItem.subtotal !== undefined
      ? Math.max(0, Math.round(Number(rawItem.subtotal) || 0))
      : Math.max(0, Math.round(unitPrice * qty * dayMult))

    const ownerOrg = (rawItem.owner || catEq?.owner || fallbackOwnerOrg || 'Organisasi Pemilik').trim()
    const ownerBank = (rawItem.ownerBank || catEq?.ownerBank || fallbackOwnerBank || 'BCA 8012345678 a.n Owner').trim()
    const uploader = (rawItem.uploader || catEq?.uploader || ownerOrg).trim()
    const normKey = ownerOrg.toLowerCase()

    if (!groupMap.has(normKey)) {
      groupMap.set(normKey, {
        ownerKey: `owner-${groupMap.size}-${normKey.replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        ownerOrg,
        ownerBank,
        uploader,
        items: [],
        grossAmount: 0
      })
    }
    const g = groupMap.get(normKey)
    g.items.push({
      id: rawItem.id,
      name: rawItem.name,
      qty,
      listingType,
      subtotal: itemSubtotal
    })
    g.grossAmount += itemSubtotal
  })

  const groups = Array.from(groupMap.values())
  const computedTotalGross = groups.reduce((s, g) => s + g.grossAmount, 0)

  if (computedTotalGross === 0 && Number(fallbackTotalAmount) > 0 && groups.length > 0) {
    const share = Math.round(Number(fallbackTotalAmount) / groups.length)
    groups.forEach((g, idx) => {
      g.grossAmount = idx === groups.length - 1
        ? Math.max(0, Number(fallbackTotalAmount) - share * (groups.length - 1))
        : share
    })
  }

  return groups.map((g, idx) => {
    const gross = Math.max(0, Math.round(g.grossAmount))
    const fee = Math.round(gross * PLATFORM_FEE_RATE)
    const net = Math.max(0, gross - fee)
    const itemSummary = g.items.map(i => `${i.name} (${i.qty}x)`).join(', ')
    const isFree = gross === 0 && defaultStatus === 'Pending Transfer'
    const isLegacySingleTransferred = groups.length === 1 && defaultStatus === 'Transferred'
    return {
      ownerKey: g.ownerKey || `owner-${idx}`,
      ownerOrg: g.ownerOrg,
      ownerBank: g.ownerBank,
      uploader: g.uploader,
      itemsSummary: itemSummary,
      items: g.items,
      grossAmount: gross,
      adminFee: fee,
      payoutAmount: net,
      status: isFree ? 'Settled (Gratis)' : defaultStatus,
      payoutRef: isLegacySingleTransferred ? fallbackPayoutRef : null,
      transferredAt: isLegacySingleTransferred ? fallbackTransferredAt : null,
      payoutProofPhoto: isLegacySingleTransferred ? fallbackProofPhoto : null
    }
  })
}

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

// Helper parse tanggal yang mendukung teks bulan bahasa Indonesia (Okt, Des, Mei, Agu, dll)
export const parseFlexibleDate = (input) => {
  if (!input) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input

  const str = String(input).trim()
  let d = new Date(str)
  if (!isNaN(d.getTime())) return d

  const indonesianMonths = {
    jan: 'Jan', januari: 'January',
    feb: 'Feb', februari: 'February',
    mar: 'Mar', maret: 'March',
    apr: 'Apr', april: 'April',
    mei: 'May',
    jun: 'Jun', juni: 'June',
    jul: 'Jul', juli: 'July',
    agu: 'Aug', agt: 'Aug', agustus: 'August',
    sep: 'Sep', september: 'September',
    okt: 'Oct', oktober: 'October',
    nop: 'Nov', nov: 'Nov', november: 'November',
    des: 'Dec', desember: 'December'
  }

  let normalized = str
  for (const [idMonth, enMonth] of Object.entries(indonesianMonths)) {
    const regex = new RegExp(`\\b${idMonth}\\b`, 'gi')
    if (regex.test(normalized)) {
      normalized = normalized.replace(regex, enMonth)
      break
    }
  }

  d = new Date(normalized)
  if (!isNaN(d.getTime())) return d

  const parts = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (parts) {
    const day = parseInt(parts[1], 10)
    const month = parseInt(parts[2], 10) - 1
    const year = parseInt(parts[3], 10)
    const dateObj = new Date(year, month, day)
    if (!isNaN(dateObj.getTime())) return dateObj
  }

  return null
}

// Helper format tanggal Indonesia singkat
export const formatIdDate = (dateObjOrStr) => {
  if (!dateObjOrStr) return ''
  const d = parseFlexibleDate(dateObjOrStr)
  if (!d) return String(dateObjOrStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function AppProvider({ children }) {
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
  const [currentUserOrg, setCurrentUserOrg] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('eventloop_user_org') : null) || ''
  })
  const [currentUserPhone, setCurrentUserPhone] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('eventloop_user_phone') : null) || ''
  })
  const [cloudActiveReservations, setCloudActiveReservations] = useState([])
  const [contactDirectory, setContactDirectory] = useState({ byUserId: {}, byName: {}, byOrg: {}, adminPhone: '' })
  const [session, setSession] = useState(null)
  const [ssoUser, setSsoUser] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const saved = sessionStorage.getItem('eventloop_sso_user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })
  const [loadingDb, setLoadingDb] = useState(true)

  // Refs untuk mencegah unmount UI pada background refresh, mencegah infinite sync loop, dan menghindari stale closure
  const hasCompletedInitialLoadRef = useRef(false)
  const lastSyncedResHashRef = useRef('')
  const currentUserNameRef = useRef(currentUserName)
  const currentSessionUserIdRef = useRef(null)

  useEffect(() => {
    currentUserNameRef.current = currentUserName
  }, [currentUserName])

  useEffect(() => {
    currentSessionUserIdRef.current = session?.user?.id || null
  }, [session?.user?.id])

  // Bersihkan sesi autentikasi permanen lama di localStorage sekali saat mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem('eventloop_sso_user')
      localStorage.removeItem('eventloop_session')
      localStorage.removeItem('eventloop_role')
      localStorage.removeItem('eventloop_user_prodi')
      localStorage.removeItem('eventloop_mock_user')
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
          localStorage.removeItem(k)
        }
      }
      if (localStorage.getItem('eventloop_borrowing_cleaned_v3') !== 'true') {
        localStorage.removeItem('eventloop_transactions')
        localStorage.removeItem('eventloop_active_reservation')
        localStorage.removeItem('eventloop_user_payment_status')
        localStorage.removeItem('eventloop_return_status')
        localStorage.removeItem('eventloop_pending_returns')
        localStorage.removeItem('eventloop_cart')
        localStorage.setItem('eventloop_borrowing_cleaned_v3', 'true')
      }
    } catch (e) {}
  }, [])

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

  const safeParseStorage = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : fallback
    } catch (e) {
      return fallback
    }
  }

  const [equipments, setEquipments] = useState(() => {
    const parsed = safeParseStorage('eventloop_equipments', null)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : equipmentData
  })

  const [pendingApprovals, setPendingApprovals] = useState(() => safeParseStorage('eventloop_pending_approvals', []))

  const [transactions, setTransactions] = useState(() => safeParseStorage('eventloop_transactions', []))

  const [userPaymentStatus, setUserPaymentStatus] = useState(() => {
    const saved = localStorage.getItem('eventloop_user_payment_status') || 'idle'
    return saved === 'approved_success' ? 'approved' : saved
  })

  const [activeReservation, setActiveReservation] = useState(() => safeParseStorage('eventloop_active_reservation', null))
  const [completedEventNotice, setCompletedEventNotice] = useState(null)

  const [returnStatus, setReturnStatus] = useState(() => {
    return localStorage.getItem('eventloop_return_status') || 'idle'
  })

  const [pendingReturns, setPendingReturns] = useState(() => safeParseStorage('eventloop_pending_returns', []))
  const [approvedReturns, setApprovedReturns] = useState([])

  const [campusImpact, setCampusImpact] = useState(() => ({
    itemsReused: impactData.totalItemsReused || 0,
    wasteAvoidedKg: Math.round(impactData.wasteAvoided) || 0,
    costAvoided: impactData.costAvoided || 0,
    eventsSupported: impactData.totalEventsSupported || 0,
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

  const [cartItems, setCartItems] = useState(() => safeParseStorage('eventloop_cart', []))

  // Sinkronisasi data perlengkapan & transaksi ke Local Storage
  useEffect(() => { try { localStorage.setItem('eventloop_equipments', JSON.stringify(equipments)) } catch (e) {} }, [equipments])
  useEffect(() => { try { localStorage.setItem('eventloop_pending_approvals', JSON.stringify(pendingApprovals)) } catch (e) {} }, [pendingApprovals])
  useEffect(() => { try { localStorage.setItem('eventloop_transactions', JSON.stringify(transactions)) } catch (e) {} }, [transactions])
  useEffect(() => { try { localStorage.setItem('eventloop_user_payment_status', userPaymentStatus) } catch (e) {} }, [userPaymentStatus])
  useEffect(() => { try { localStorage.setItem('eventloop_active_reservation', JSON.stringify(activeReservation)) } catch (e) {} }, [activeReservation])
  useEffect(() => { try { localStorage.setItem('eventloop_return_status', returnStatus) } catch (e) {} }, [returnStatus])
  useEffect(() => { try { localStorage.setItem('eventloop_pending_returns', JSON.stringify(pendingReturns)) } catch (e) {} }, [pendingReturns])
  useEffect(() => { try { localStorage.setItem('eventloop_cart', JSON.stringify(cartItems)) } catch (e) {} }, [cartItems])

  // Sinkronisasi otomatis activeReservation ke Supabase reservations table saat ada perubahan
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    if (!activeReservation || !activeReservation.eventName) return
    if (activeReservation.ownerUserId && activeReservation.ownerUserId !== userId) return

    const itemPayloadObj = {
      ...activeReservation,
      ownerUserId: userId,
      borrowerPhone: activeReservation.borrowerPhone || currentUserPhone || '',
      paymentStatus: userPaymentStatus
    }
    const serialized = JSON.stringify(itemPayloadObj)
    const hashKey = `${userId}:::${userPaymentStatus}:::${serialized}`
    if (lastSyncedResHashRef.current === hashKey) return

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
          item_name: serialized,
          quantity: activeReservation.items?.length || 0,
          status: userPaymentStatus || 'idle',
          start_date: activeReservation.startDate || activeReservation.startDateLabel || new Date().toISOString()
        }

        lastSyncedResHashRef.current = hashKey

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
      ownerUserId: currentSessionUserIdRef.current || prev?.ownerUserId || null,
      ...updates
    }))
  }, [])

  // --- FETCH FUNCTION DARI SUPABASE ---
  const fetchSupabaseData = useCallback(async () => {
    try {
      // Hanya tampilkan loading full-screen pada inisialisasi pertama kali agar form/halaman user tidak ter-reset saat sync latar belakang
      if (!hasCompletedInitialLoadRef.current) {
        setLoadingDb(true)
      }

      // 1. Session Auth & User Active Reservation dari Cloud Database
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      let currentUserId = currentSession?.user?.id || currentSessionUserIdRef.current
      let resolvedUserName = currentUserNameRef.current
      let hasCloudReservation = false

      if (currentUserId && typeof window !== 'undefined') {
        try {
          const prevUid = localStorage.getItem('eventloop_last_user_id')
          if (prevUid && prevUid !== currentUserId) {
            clearUserLocalStorage()
            lastSyncedResHashRef.current = ''
            setActiveReservation(null)
            setUserPaymentStatus('idle')
            setCartItems([])
            setReturnStatus('idle')
            setCurrentUserOrg('')
            setCurrentUserPhone('')
          }
          localStorage.setItem('eventloop_last_user_id', currentUserId)
        } catch (e) {}
      }

      if (currentSession) {
        setSession(currentSession)
        currentSessionUserIdRef.current = currentSession.user?.id || null
        const userEmail = currentSession.user?.email || ''
        const adminName = getAdminDisplayName(userEmail)
        const sessionMeta = currentSession.user?.user_metadata || {}

        if (sessionMeta.org_name) {
          setCurrentUserOrg(sessionMeta.org_name)
          try { localStorage.setItem('eventloop_user_org', sessionMeta.org_name) } catch (e) {}
        }
        if (sessionMeta.phone) {
          setCurrentUserPhone(sessionMeta.phone)
          try { localStorage.setItem('eventloop_user_phone', sessionMeta.phone) } catch (e) {}
        }

        if (isAdminEmail(userEmail)) {
          setCurrentUserRole('admin')
          resolvedUserName = adminName || 'Admin EventLoop'
          setCurrentUserName(resolvedUserName)
        } else {
          setCurrentUserRole('user')
          const metaName = sessionMeta.full_name
          const metaProdi = sessionMeta.prodi_name
          const metaNim = sessionMeta.nim
          if (metaName) {
            resolvedUserName = metaName
            setCurrentUserName(metaName)
          }
          if (metaProdi) setCurrentUserStudyProgram(metaProdi)
          if (metaNim) {
            const nimParsed = validateNimStructure(metaNim)
            if (nimParsed.isValid && !metaProdi) setCurrentUserStudyProgram(nimParsed.prodiName)
          }

          // Hanya select kolom valid pada tabel profiles (id, full_name, nim, email)
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nim, email')
            .eq('id', currentSession.user.id)
            .maybeSingle()

          if (profile?.full_name) {
            resolvedUserName = profile.full_name
            setCurrentUserName(profile.full_name)
          }
          if (profile?.nim) {
            const nimParsed = validateNimStructure(profile.nim)
            if (nimParsed.isValid) {
              setCurrentUserStudyProgram(nimParsed.prodiName)
            }
          }
        }
      }

      // Ambil active reservation pengguna saat ini dari tabel reservations di Supabase (ketat per user_id)
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
              if (Array.isArray(parsedRes.items)) {
                parsedRes = {
                  ...parsedRes,
                  items: parsedRes.items.map(i => ({
                    ...i,
                    lastLocation: normalizeStorageLocation(i.lastLocation || i.initialLocation)
                  }))
                }
              }
              hasCloudReservation = true
              const normalizedStatus = userRes.status || parsedRes.paymentStatus || 'idle'
              const remainingRented = (parsedRes.items || []).filter(i => i.listingType !== 'sale')
              const isCycleFinished =
                normalizedStatus === 'completed' ||
                (normalizedStatus === 'approved' && remainingRented.length === 0 && (parsedRes.items || []).length === 0)

              if (isCycleFinished) {
                // Otomatis akhiri siklus saat semua barang sudah kembali & diverifikasi admin (tanpa memaksa klik "Selesaikan Siklus")
                lastSyncedResHashRef.current = ''
                setActiveReservation(null)
                setUserPaymentStatus('idle')
                try {
                  localStorage.removeItem('eventloop_active_reservation')
                  localStorage.setItem('eventloop_user_payment_status', 'idle')
                  if (parsedRes.txnId) {
                    localStorage.setItem('eventloop_cleared_txn_id', String(parsedRes.txnId))
                  }
                  const dismissedId = sessionStorage.getItem('eventloop_dismissed_completed_id')
                  if (dismissedId !== String(userRes.id) && parsedRes.eventName) {
                    setCompletedEventNotice({
                      id: String(userRes.id),
                      eventName: parsedRes.eventName
                    })
                  }
                } catch (e) {}

                if (userRes.status !== 'completed') {
                  try {
                    await supabase
                      .from('reservations')
                      .update({ status: 'completed' })
                      .eq('id', userRes.id)
                  } catch (e) {}
                }
              } else {
                setCompletedEventNotice(null)
                const resWithOwner = {
                  ...parsedRes,
                  ownerUserId: currentUserId
                }
                const serializedCloud = JSON.stringify({
                  ...resWithOwner,
                  paymentStatus: normalizedStatus
                })
                lastSyncedResHashRef.current = `${currentUserId}:::${normalizedStatus}:::${serializedCloud}`

                setActiveReservation(prev => {
                  if (prev && JSON.stringify(prev) === JSON.stringify(resWithOwner)) return prev
                  return resWithOwner
                })
                try {
                  localStorage.setItem('eventloop_active_reservation', JSON.stringify(resWithOwner))
                } catch (e) {}

                setUserPaymentStatus(normalizedStatus)
                try {
                  localStorage.setItem('eventloop_user_payment_status', normalizedStatus)
                } catch (e) {}
              }
            }
          }
        } catch (resErr) {
          console.warn('Gagal fetch data reservations dari Supabase:', resErr)
        }
      }

      // Fallback cross-device hanya jika tidak ada session user_id (mode SSO lokal), dan HARUS cocok persis nama penggunanya (jangan pernah mencuri reservasi user lain)
      if (!hasCloudReservation && !currentUserId && resolvedUserName && resolvedUserName !== 'Prasmulyan') {
        try {
          const { data: fallbackResRows } = await supabase
            .from('reservations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

          if (fallbackResRows && fallbackResRows.length > 0) {
            const matchedRes = fallbackResRows.find(r => {
              if (r.item_name && r.item_name.startsWith('{')) {
                try {
                  const p = JSON.parse(r.item_name)
                  const bName = (p.borrowerName || '').toLowerCase().trim()
                  const uLow = resolvedUserName.toLowerCase().trim()
                  return bName === uLow
                } catch (e) {
                  return false
                }
              }
              return false
            })

            if (matchedRes && matchedRes.item_name && matchedRes.item_name.startsWith('{')) {
              try {
                const parsed = JSON.parse(matchedRes.item_name)
                hasCloudReservation = true
                const fbStatus = matchedRes.status || parsed.paymentStatus || 'idle'
                const fbRemainingRented = (parsed.items || []).filter(i => i.listingType !== 'sale')
                const fbFinished =
                  fbStatus === 'completed' ||
                  (fbStatus === 'approved' && fbRemainingRented.length === 0 && (parsed.items || []).length === 0)

                if (fbFinished) {
                  lastSyncedResHashRef.current = ''
                  setActiveReservation(null)
                  setUserPaymentStatus('idle')
                  try {
                    localStorage.removeItem('eventloop_active_reservation')
                    localStorage.setItem('eventloop_user_payment_status', 'idle')
                    const dismissedId = sessionStorage.getItem('eventloop_dismissed_completed_id')
                    if (dismissedId !== String(matchedRes.id) && parsed.eventName) {
                      setCompletedEventNotice({
                        id: String(matchedRes.id),
                        eventName: parsed.eventName
                      })
                    }
                  } catch (e) {}
                } else {
                  setCompletedEventNotice(null)
                  setActiveReservation(prev => (prev && JSON.stringify(prev) === JSON.stringify(parsed)) ? prev : parsed)
                  try { localStorage.setItem('eventloop_active_reservation', JSON.stringify(parsed)) } catch (e) {}
                  if (matchedRes.status) {
                    setUserPaymentStatus(matchedRes.status)
                    try { localStorage.setItem('eventloop_user_payment_status', matchedRes.status) } catch (e) {}
                  }
                }
              } catch (pe) {}
            }
          }
        } catch (fbErr) {
          console.warn('Catatan fallback reservations sync:', fbErr)
        }
      }

      // 2. Fetch Equipments dari Supabase
      let normalizedEquipments = []
      const { data: eqData, error: eqErr } = await supabase
        .from('equipments')
        .select('*')
        .order('created_at', { ascending: false })

      if (!eqErr && eqData) {
        normalizedEquipments = eqData.map(item => {
          const totalCount = Math.max(1, Number(item.total) || 1)
          const availCount = Math.min(totalCount, Math.max(0, Number(item.available) ?? 0))
          return {
            id: item.id,
            name: item.name,
            category: item.category || 'General',
            price: Number(item.price) || 0,
            salePrice: item.salePrice ? Number(item.salePrice) : null,
            listingType: item.listingType || (item.salePrice ? 'sale' : 'rental'),
            available: availCount,
            total: totalCount,
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
            lastLocation: normalizeStorageLocation(item.lastLocation),
            lastStoragePhoto: item.lastStoragePhoto || null,
            uploader: item.uploader || 'Admin'
          }
        })
      }

      // Gabungkan base default items dari equipmentData dengan data dari Supabase equipments
      const catalogMap = new Map()
      equipmentData.forEach(item => {
        catalogMap.set(String(item.id), {
          ...item,
          lastLocation: normalizeStorageLocation(item.lastLocation),
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
              const totalCount = Math.max(1, Number(parsed.total) || Number(parsed.qty) || 1)
              const availCount = Math.min(totalCount, Math.max(0, Number(parsed.available ?? parsed.qty ?? 1)))
              const approvedEq = {
                id: parsed.id || `eq-${t.id.slice(0, 8)}`,
                dbTxnId: t.id,
                name: parsed.name,
                category: parsed.category || 'General',
                price: Number(parsed.price) ?? Number(t.amount) ?? 0,
                salePrice: parsed.salePrice ? Number(parsed.salePrice) : null,
                listingType: parsed.listingType || parsed.pricingType || (parsed.salePrice ? 'sale' : 'rental'),
                available: availCount,
                total: totalCount,
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
                ownerPhone: parsed.ownerPhone || '',
                ownerUserId: parsed.ownerUserId || null,
                description: parsed.description || '',
                lastLocation: normalizeStorageLocation(parsed.lastLocation || parsed.initialLocation),
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

        // A2. Bangun Direktori Kontak WhatsApp lintas akun dari [USER_CONTACT] di transactions
        const nextContactDir = { byUserId: {}, byName: {}, byOrg: {}, adminPhone: '' }
        txnData.forEach(t => {
          if (t.item_names?.startsWith('[USER_CONTACT]')) {
            try {
              const c = (t.payout_status && t.payout_status.startsWith('{')) ? JSON.parse(t.payout_status) : null
              const waNum = formatIndonesianWaNumber(c?.phone)
              if (c && waNum) {
                if (c.userId && !nextContactDir.byUserId[c.userId]) nextContactDir.byUserId[c.userId] = c.phone
                const nLow = (c.fullName || '').toLowerCase().trim()
                if (nLow && !nextContactDir.byName[nLow]) nextContactDir.byName[nLow] = c.phone
                const oLow = (c.orgName || '').toLowerCase().trim()
                if (oLow && !nextContactDir.byOrg[oLow]) nextContactDir.byOrg[oLow] = c.phone
                if (c.role === 'admin' && !nextContactDir.adminPhone) nextContactDir.adminPhone = c.phone

                if (currentUserId && c.userId === currentUserId) {
                  setCurrentUserPhone(prev => prev || c.phone)
                  if (c.orgName) setCurrentUserOrg(prev => prev || c.orgName)
                  try {
                    if (c.phone) localStorage.setItem('eventloop_user_phone', c.phone)
                    if (c.orgName) localStorage.setItem('eventloop_user_org', c.orgName)
                  } catch (e) {}
                }
              }
            } catch (e) {}
          }
        })
        setContactDirectory(nextContactDir)

        // Pasangkan nomor WA pemilik barang dari direktori kontak ke katalog jika belum ada
        catalogMap.forEach((eqItem, key) => {
          if (!eqItem.ownerPhone) {
            const byUid = eqItem.ownerUserId ? nextContactDir.byUserId[eqItem.ownerUserId] : ''
            const byUploader = eqItem.uploader ? nextContactDir.byName[String(eqItem.uploader).toLowerCase().trim()] : ''
            const byOwnerName = eqItem.owner ? nextContactDir.byName[String(eqItem.owner).toLowerCase().trim()] : ''
            const byOwnerOrg = eqItem.owner ? nextContactDir.byOrg[String(eqItem.owner).toLowerCase().trim()] : ''
            const resolvedPhone = byUid || byUploader || byOwnerName || byOwnerOrg || ''
            if (resolvedPhone) {
              catalogMap.set(key, { ...eqItem, ownerPhone: resolvedPhone })
            }
          }
        })

        setEquipments(Array.from(catalogMap.values()))

        // B. Pisahkan transaksi umum, return, permohonan barang baru, dan direktori kontak
        const orderTxns = txnData.filter(t => !isSystemMetaTxn(t.item_names))

        if (orderTxns.length === 0) {
          setTransactions([])
          try { localStorage.removeItem('eventloop_transactions') } catch (e) {}
        } else {
          setTransactions(prevLocal => {
            const normalizedTxn = orderTxns.map(t => {
              let meta = {}
              if (t.payout_status && t.payout_status.startsWith('{')) {
                try {
                  meta = JSON.parse(t.payout_status)
                } catch (e) {}
              }
              const payoutStr = typeof meta.status === 'string'
                ? meta.status
                : (!t.payout_status?.startsWith('{') ? (t.payout_status || 'Waiting Admin Approval') : 'Waiting Admin Approval')

              const localMatch = prevLocal.find(lt => lt.id === t.id || (lt.itemName === t.item_names && lt.amount === Number(t.amount)))
              const resolvedBorrowed = meta.borrowedItems || localMatch?.borrowedItems || []
              const resolvedDuration = meta.durationDays || localMatch?.durationDays || 1
              const resolvedOwnerOrg = meta.ownerOrg || localMatch?.ownerOrg || 'Organisasi Pemilik & EventLoop'
              const resolvedOwnerBank = meta.ownerBank || localMatch?.ownerBank || 'BCA 8012345678 a.n Owner'

              let resolvedOwnerPayouts = []
              if (Array.isArray(meta.ownerPayouts) && meta.ownerPayouts.length > 0) {
                resolvedOwnerPayouts = meta.ownerPayouts.map((op, idx) => {
                  const gross = Math.max(0, Math.round(Number(op.grossAmount) || 0))
                  const fee = op.adminFee !== undefined ? Math.round(Number(op.adminFee)) : Math.round(gross * PLATFORM_FEE_RATE)
                  const net = op.payoutAmount !== undefined ? Math.round(Number(op.payoutAmount)) : Math.max(0, gross - fee)
                  return {
                    ...op,
                    ownerKey: op.ownerKey || `owner-${idx}`,
                    grossAmount: gross,
                    adminFee: fee,
                    payoutAmount: net,
                    status: op.status || payoutStr
                  }
                })
              } else {
                // Rekonstruksi pembagian payout per-pemilik secara otomatis untuk transaksi multi-pemilik lama
                let itemsForSplit = resolvedBorrowed
                if ((!itemsForSplit || itemsForSplit.length === 0) && t.item_names) {
                  itemsForSplit = t.item_names.split(',').map((part) => {
                    const mQty = part.match(/\((\d+)x\)/)
                    const cleanName = part.replace(/\(\d+x\)/, '').trim()
                    const foundEq = Array.from(catalogMap.values()).find(e => e.name?.toLowerCase().trim() === cleanName.toLowerCase())
                    return {
                      id: foundEq?.id || cleanName,
                      name: cleanName,
                      qty: mQty ? parseInt(mQty[1], 10) : 1,
                      listingType: foundEq?.listingType || 'rental',
                      price: foundEq?.price || 0,
                      salePrice: foundEq?.salePrice || null,
                      owner: foundEq?.owner || resolvedOwnerOrg,
                      ownerBank: foundEq?.ownerBank || resolvedOwnerBank,
                      uploader: foundEq?.uploader || foundEq?.owner || resolvedOwnerOrg
                    }
                  })
                }
                resolvedOwnerPayouts = buildOwnerPayouts({
                  items: itemsForSplit,
                  durationDays: resolvedDuration,
                  catalogMap,
                  defaultStatus: payoutStr,
                  fallbackOwnerOrg: resolvedOwnerOrg,
                  fallbackOwnerBank: resolvedOwnerBank,
                  fallbackTotalAmount: Number(t.amount) || 0,
                  fallbackProofPhoto: meta.payoutProofPhoto || localMatch?.payoutProofPhoto || null,
                  fallbackPayoutRef: meta.payoutRef || localMatch?.payoutRef || null,
                  fallbackTransferredAt: meta.transferredAt || localMatch?.transferredAt || null
                })
              }

              const totalAdminFee = resolvedOwnerPayouts.reduce((s, op) => s + (op.adminFee || 0), 0)
              const totalNetPayout = resolvedOwnerPayouts.reduce((s, op) => s + (op.payoutAmount || 0), 0)
              const derivedStatus = deriveOverallPayoutStatus(resolvedOwnerPayouts, payoutStr)
              const combinedOwnerNames = resolvedOwnerPayouts.map(op => op.ownerOrg).join(' & ') || resolvedOwnerOrg

              return {
                id: t.id,
                userId: meta.userId || localMatch?.userId || null,
                buyerOrg: t.buyer_org || meta.buyerOrg || localMatch?.buyerOrg || 'BEM Prasmul',
                borrowerName: meta.borrowerName || localMatch?.borrowerName || t.buyer_org || 'Mahasiswa Prasmul',
                eventName: meta.eventName || localMatch?.eventName || 'Kegiatan Kemahasiswaan Prasmul',
                startDate: meta.startDate || localMatch?.startDate || '03 Nov 2026',
                endDate: meta.endDate || localMatch?.endDate || '05 Nov 2026',
                durationDays: resolvedDuration,
                eventLocation: meta.eventLocation || localMatch?.eventLocation || 'Auditorium Kampus BSD',
                itemName: t.item_names || 'Reservasi Perlengkapan',
                borrowedItems: resolvedBorrowed,
                amount: Number(t.amount) || 0,
                paymentProofPhoto: meta.paymentProofPhoto || localMatch?.paymentProofPhoto || null,
                payoutProofPhoto: meta.payoutProofPhoto || localMatch?.payoutProofPhoto || null,
                payoutRef: meta.payoutRef || localMatch?.payoutRef || null,
                transferredAt: meta.transferredAt || localMatch?.transferredAt || null,
                qrisStatus: t.qris_status || 'Pending Admin Verification',
                payoutStatus: derivedStatus,
                ownerPayouts: resolvedOwnerPayouts,
                paidAt: t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : 'Baru saja',
                bankAdminRef: `BCA-QRIS-${String(t.id).slice(0, 6)}`,
                ownerOrg: combinedOwnerNames,
                ownerBank: resolvedOwnerPayouts[0]?.ownerBank || resolvedOwnerBank,
                payoutAmount: totalNetPayout,
                adminFee: totalAdminFee,
                cycleCompleted: Boolean(meta.cycleCompleted),
                createdAt: t.created_at || null
              }
            })
            return normalizedTxn
          })
        }

        // C. SINKRONISASI REAL-TIME: Sinkronkan HANYA jika transaksi order milik pengguna saat ini (via activeReservation.txnId atau userId)
        const clearedTxnId = (typeof window !== 'undefined') ? localStorage.getItem('eventloop_cleared_txn_id') : null
        let matchedUserTxn = null
        if (hasCloudReservation) {
          // Ambil txnId dari reservation cloud jika ada untuk update status terkini
          const localResRaw = typeof window !== 'undefined' ? localStorage.getItem('eventloop_active_reservation') : null
          let cloudTxnId = null
          try {
            cloudTxnId = localResRaw ? JSON.parse(localResRaw)?.txnId : null
          } catch (e) {}
          if (cloudTxnId) {
            matchedUserTxn = orderTxns.find(t => String(t.id) === String(cloudTxnId))
          }
        } else if (currentUserId) {
          matchedUserTxn = orderTxns.find(t => {
            if (String(t.id) === String(clearedTxnId)) return false
            if (t.payout_status && t.payout_status.startsWith('{')) {
              try {
                const m = JSON.parse(t.payout_status)
                return m.userId && m.userId === currentUserId
              } catch (e) {}
            }
            return false
          })
        }

        if (matchedUserTxn && String(matchedUserTxn.id) !== String(clearedTxnId)) {
          const qStatus = (matchedUserTxn.qris_status || '').toLowerCase()
          if (qStatus.includes('approved') || qStatus.includes('lunas') || qStatus.includes('sukses')) {
            setUserPaymentStatus('approved')
            try { localStorage.setItem('eventloop_user_payment_status', 'approved') } catch (e) {}

            // Jika cloud reservation belum terbentuk saat transaksi terjadi, rekonstruksi dari matchedUserTxn milik user tersebut
            if (!hasCloudReservation) {
              setActiveReservation(prev => {
                if (prev && prev.items && prev.items.length > 0 && (!prev.ownerUserId || prev.ownerUserId === currentUserId)) {
                  return {
                    ...prev,
                    txnId: prev.txnId || matchedUserTxn.id,
                    totalAmount: prev.totalAmount || matchedUserTxn.amount
                  }
                }

                const approvedReturnEqIds = new Set()
                txnData.forEach(t => {
                  const isRetReq = (t.item_names || '').startsWith('[RETURN_REQ]')
                  const isApproved = (t.qris_status || '').toLowerCase().includes('approved')
                  if (isRetReq && isApproved) {
                    const parts = (t.item_names || '').replace(/\[RETURN_REQ\]\s*/, '').split(':::')
                    let retMeta = {}
                    if (t.payout_status?.startsWith('{')) {
                      try { retMeta = JSON.parse(t.payout_status) } catch (e) {}
                    }
                    const matchesOwner = !retMeta.userId || !currentUserId || retMeta.userId === currentUserId
                    if (parts[0] && matchesOwner) approvedReturnEqIds.add(String(parts[0]))
                  }
                })

                const parsedItems = []
                const rawNames = matchedUserTxn.item_names?.split(',') || []
                rawNames.forEach(rn => {
                  const clean = rn.replace(/\(\d+x\)/, '').trim()
                  const matchEq = Array.from(catalogMap.values()).find(e => 
                    e.name.toLowerCase().includes(clean.toLowerCase()) || 
                    clean.toLowerCase().includes(e.name.toLowerCase())
                  )
                  if (matchEq && !approvedReturnEqIds.has(String(matchEq.id))) {
                    const qtyMatch = rn.match(/\((\d+)x\)/)?.[1]
                    parsedItems.push({
                      ...matchEq,
                      qty: qtyMatch ? parseInt(qtyMatch, 10) : 1
                    })
                  }
                })

                const remainingRented = parsedItems.filter(i => i.listingType !== 'sale')
                if (remainingRented.length === 0 && parsedItems.length === 0) {
                  setUserPaymentStatus('idle')
                  try {
                    localStorage.removeItem('eventloop_active_reservation')
                    localStorage.setItem('eventloop_user_payment_status', 'idle')
                    localStorage.setItem('eventloop_cleared_txn_id', String(matchedUserTxn.id))
                  } catch (e) {}
                  return null
                }

                let m = {}
                if (matchedUserTxn.payout_status?.startsWith('{')) {
                  try { m = JSON.parse(matchedUserTxn.payout_status) } catch (e) {}
                }

                if (m.cycleCompleted) {
                  setUserPaymentStatus('idle')
                  try {
                    localStorage.removeItem('eventloop_active_reservation')
                    localStorage.setItem('eventloop_user_payment_status', 'idle')
                    localStorage.setItem('eventloop_cleared_txn_id', String(matchedUserTxn.id))
                  } catch (e) {}
                  return null
                }

                return {
                  ownerUserId: currentUserId || null,
                  eventName: m.eventName || prev?.eventName || 'Kegiatan Kampus Prasmul',
                  org: matchedUserTxn.buyer_org || prev?.org || 'Prasmulyan',
                  borrowerName: m.borrowerName || resolvedUserName || 'Prasmulyan',
                  startDateLabel: m.startDate || prev?.startDateLabel || formatIdDate(new Date()),
                  endDateLabel: m.endDate || prev?.endDateLabel || formatIdDate(new Date()),
                  eventDate: (m.startDate && m.endDate) ? `${m.startDate} – ${m.endDate}` : (prev?.eventDate || formatIdDate(new Date())),
                  durationDays: m.durationDays || prev?.durationDays || 1,
                  location: m.eventLocation || prev?.location || 'Auditorium Kampus BSD',
                  items: parsedItems,
                  txnId: matchedUserTxn.id,
                  totalAmount: matchedUserTxn.amount
                }
              })
            }
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

      // A. Ambil dari transaksi dengan tag [RETURN_REQ] dan status Pending
      if (!txnErr && txnData) {
        txnData.forEach(t => {
          const isReturnReq = (t.item_names || '').startsWith('[RETURN_REQ]')
          const isPendingReturn = t.qris_status === 'Pending Return Verification' || 
            (isReturnReq && (t.qris_status || '').toLowerCase().includes('pending'))

          if (isPendingReturn) {
            try {
              let parsed = {}
              if (t.payout_status && t.payout_status.startsWith('{')) {
                parsed = JSON.parse(t.payout_status)
              }
              const parts = (t.item_names || '').replace(/\[RETURN_REQ\]\s*/, '').split(':::')
              const parsedEqId = parsed.equipmentId || (parts[0] ? (!isNaN(parts[0]) ? Number(parts[0]) : parts[0]) : 1)
              const parsedName = parsed.itemName || parts[1] || t.buyer_org || 'Perlengkapan'
              const parsedQty = parsed.returnedQty || (parts[2] ? Number(parts[2]) : t.amount) || 1
              const parsedRetId = parsed.returnId || parsed.id || parts[3] || t.id

              const retItem = {
                id: parsedRetId,
                returnId: parsedRetId,
                dbTxnId: t.id,
                userId: parsed.userId || null,
                equipmentId: parsedEqId,
                itemName: parsedName,
                itemCode: parsed.itemCode || `ITEM-${parsedEqId}`,
                returnedQty: parsedQty,
                borrower: parsed.borrower || t.buyer_org || 'Prasmulyan',
                returnLocation: normalizeStorageLocation(parsed.returnLocation),
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
                  userId: null,
                  equipmentId: !isNaN(r.equipment_id) ? Number(r.equipment_id) : r.equipment_id,
                  itemName: r.item_name || 'Perlengkapan',
                  itemCode: `ITEM-${r.equipment_id}`,
                  conditionPhoto: r.condition_photo,
                  storagePhoto: r.storage_photo,
                  returnedQty: r.returned_qty || 1,
                  borrower: r.borrower || 'Prasmulyan',
                  returnLocation: normalizeStorageLocation(r.return_location),
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

      // Sinkronisasi status pengembalian pengguna saat ini
      const currentUserPending = mergedReturns.some(r => {
        if (currentUserId && r.userId) return r.userId === currentUserId
        if (resolvedUserName && resolvedUserName !== 'Prasmulyan' && r.borrower) {
          return (
            r.borrower.toLowerCase() === resolvedUserName.toLowerCase() ||
            resolvedUserName.toLowerCase().includes(r.borrower.toLowerCase()) ||
            r.borrower.toLowerCase().includes(resolvedUserName.toLowerCase())
          )
        }
        return false
      })

      if (!currentUserPending) {
        setReturnStatus(prev => (prev === 'pending_admin_approval' ? 'idle' : prev))
        try { localStorage.setItem('eventloop_return_status', 'idle') } catch (e) {}
      } else {
        setReturnStatus('pending_admin_approval')
        try { localStorage.setItem('eventloop_return_status', 'pending_admin_approval') } catch (e) {}
      }

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

      // 6. Hitung Campus Impact Secara Real-Time (Opsi 1: Baseline = 0, Murni Transaksi Riil Database)
      const approvedOrderTxns = (txnData || []).filter(t => 
        !isSystemMetaTxn(t.item_names) &&
        ((t.qris_status || '').toLowerCase().includes('approved') || 
         (t.qris_status || '').toLowerCase().includes('lunas') ||
         (t.qris_status || '').toLowerCase().includes('sukses'))
      )

      const approvedReturnTxns = (txnData || []).filter(t => 
        t.item_names?.startsWith('[RETURN_REQ]') && 
        (t.qris_status || '').toLowerCase().includes('approved')
      )

      const parsedApprovedReturns = approvedReturnTxns.map(t => {
        let meta = {}
        if (t.payout_status && t.payout_status.startsWith('{')) {
          try { meta = JSON.parse(t.payout_status) } catch (e) {}
        }
        const parts = (t.item_names || '').replace(/\[RETURN_REQ\]\s*/, '').split(':::')
        return {
          id: t.id,
          userId: meta.userId || null,
          borrower: meta.borrower || t.buyer_org || '',
          equipmentId: meta.equipmentId || parts[0] || '',
          itemName: meta.itemName || parts[1] || '',
          returnedQty: Number(meta.returnedQty || parts[2] || t.amount) || 1,
          createdAt: t.created_at || null
        }
      })
      setApprovedReturns(parsedApprovedReturns)

      let totalOrderUnits = 0
      approvedOrderTxns.forEach(t => {
        const matches = [...(t.item_names || '').matchAll(/\((\d+)x\)/g)]
        if (matches.length > 0) {
          matches.forEach(m => { totalOrderUnits += parseInt(m[1], 10) })
        } else {
          totalOrderUnits += (t.amount > 0 && t.amount <= 10 ? t.amount : 1)
        }
      })

      // Unit bersirkulasi murni dari barang yang disewa + barang yang dipulangkan ke penyimpanan
      const dynamicReused = totalOrderUnits + approvedReturnTxns.length
      const dynamicEvents = approvedOrderTxns.length
      const dynamicWasteKg = Math.round(dynamicReused * 1.6)
      const dynamicCostAvoided = (approvedOrderTxns.reduce((sum, t) => sum + (t.amount || 0), 0) * 4) || (dynamicReused * 75000)

      setCampusImpact({
        itemsReused: dynamicReused,
        wasteAvoidedKg: dynamicWasteKg,
        costAvoided: dynamicCostAvoided,
        eventsSupported: dynamicEvents,
        circularScore: 91
      })

      // 7. Agregasi Kontributor Sirkular secara dinamis dari transaksi disetujui di database
      const orgAggMap = new Map()
      approvedOrderTxns.forEach(t => {
        const orgLabel = (t.buyer_org || 'Organisasi Kampus').trim()
        const matches = [...(t.item_names || '').matchAll(/\((\d+)x\)/g)]
        const units = matches.length > 0
          ? matches.reduce((s, m) => s + parseInt(m[1], 10), 0)
          : 1
        const prevOrg = orgAggMap.get(orgLabel) || { org_name: orgLabel, events_count: 0, items_reused: 0 }
        prevOrg.events_count += 1
        prevOrg.items_reused += units
        orgAggMap.set(orgLabel, prevOrg)
      })

      const realOrgImpacts = Array.from(orgAggMap.values())
        .sort((a, b) => b.items_reused - a.items_reused || b.events_count - a.events_count)
        .slice(0, 5)
        .map((o, idx) => ({
          id: idx + 1,
          org_name: o.org_name,
          events_count: o.events_count,
          items_reused: o.items_reused,
          circular_score: Math.min(98, 84 + Math.min(14, o.items_reused * 2 + o.events_count))
        }))

      setOrgImpacts(
        realOrgImpacts.length > 0
          ? realOrgImpacts
          : (impactData.topOrganizations || []).map((o, idx) => ({
              id: idx + 1,
              org_name: o.name,
              events_count: o.events,
              items_reused: o.reused,
              circular_score: o.score
            }))
      )
      // 8. Fetch semua reservasi AKTIF kampus dari tabel reservations untuk Live Tracking yang akurat (otomatis hilang saat sudah dikembalikan)
      try {
        const { data: allCloudRes, error: allResErr } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (!allResErr && Array.isArray(allCloudRes)) {
          const txnStatusById = new Map()
          ;(txnData || []).forEach(t => {
            let meta = {}
            if (t.payout_status && t.payout_status.startsWith('{')) {
              try { meta = JSON.parse(t.payout_status) } catch (e) {}
            }
            txnStatusById.set(String(t.id), {
              qrisStatus: (t.qris_status || '').toLowerCase(),
              cycleCompleted: Boolean(meta.cycleCompleted),
              borrowerPhone: meta.borrowerPhone || ''
            })
          })

          const todayStart = new Date()
          todayStart.setHours(0, 0, 0, 0)
          const seenUsers = new Set()
          const liveList = []

          for (const r of allCloudRes) {
            const uKey = r.user_id || r.id
            if (seenUsers.has(uKey)) continue
            seenUsers.add(uKey)

            const st = String(r.status || '').toLowerCase()
            if (st !== 'approved' && st !== 'pending_admin_approval') continue
            if (!r.item_name || !r.item_name.startsWith('{')) continue

            try {
              const p = JSON.parse(r.item_name)
              const rented = (p.items || []).filter(i => i.listingType !== 'sale')
              if (rented.length === 0) continue

              const linkedTxn = p.txnId ? txnStatusById.get(String(p.txnId)) : null
              if (linkedTxn) {
                if (linkedTxn.cycleCompleted) continue
                if (
                  linkedTxn.qrisStatus.includes('reject') ||
                  linkedTxn.qrisStatus.includes('tolak') ||
                  linkedTxn.qrisStatus.includes('cancel') ||
                  linkedTxn.qrisStatus.includes('batal')
                ) continue
              } else if (String(p.txnId || '').startsWith('TXN-QRIS-')) {
                // Abaikan baris reservasi uji coba lama yang tanggal akhirnya sudah lewat & seluruh stoknya sudah penuh kembali
                const endParsed = parseFlexibleDate(p.endDateLabel || p.endDate)
                const allStockFull = rented.every(it => {
                  const cat = catalogMap.get(String(it.id))
                  return cat && (Number(cat.available) || 0) >= (Number(cat.total) || 1)
                })
                if (endParsed && endParsed < todayStart && allStockFull) continue
              }

              liveList.push({
                id: p.txnId || r.id,
                resRowId: r.id,
                userId: r.user_id || p.ownerUserId || null,
                eventName: p.eventName || 'Kegiatan Kampus Prasmul',
                org: p.org || 'Organisasi Mahasiswa',
                borrowerName: p.borrowerName || p.org || 'Panitia Mahasiswa',
                borrowerPhone: p.borrowerPhone || linkedTxn?.borrowerPhone || '',
                startDate: p.startDateLabel || p.startDate || formatIdDate(new Date()),
                endDate: p.endDateLabel || p.endDate || formatIdDate(new Date()),
                durationDays: p.durationDays || 1,
                location: p.location || 'Auditorium Kampus BSD',
                status: st === 'pending_admin_approval' ? 'Verifikasi Pembayaran' : 'Sedang Berjalan (Dipinjam)',
                items: rented.map(it => ({
                  id: it.id,
                  name: it.name,
                  qty: it.qty || 1,
                  image: it.image || '📦',
                  originLocation: normalizeStorageLocation(it.lastLocation || it.initialLocation)
                }))
              })
            } catch (pe) {}
          }

          setCloudActiveReservations(liveList)
        }
      } catch (liveResErr) {
        console.warn('Gagal fetch live reservations kampus:', liveResErr)
      }
    } catch (err) {
      console.warn('Gagal memuat data dari Supabase, menggunakan data lokal:', err)
    } finally {
      hasCompletedInitialLoadRef.current = true
      setLoadingDb(false)
    }
  }, [])

  useEffect(() => {
    fetchSupabaseData()

    let realtimeTimer = null
    const scheduleRealtimeSync = () => {
      if (realtimeTimer) clearTimeout(realtimeTimer)
      realtimeTimer = setTimeout(() => {
        fetchSupabaseData()
      }, 400)
    }

    // Realtime channel listener untuk sinkronisasi otomatis transaksi, pengembalian, perlengkapan, dan reservasi aktif
    const channel = supabase
      .channel('public:eventloop_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, scheduleRealtimeSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, scheduleRealtimeSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, scheduleRealtimeSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, scheduleRealtimeSync)
      .subscribe()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      currentSessionUserIdRef.current = newSession?.user?.id || null

      if (newSession?.user) {
        const meta = newSession.user.user_metadata || {}
        const userEmail = newSession.user.email || ''
        const adminName = getAdminDisplayName(userEmail)
        const name = adminName || meta.full_name || 'Prasmulyan'
        const nim = meta.nim || ''

        setCurrentUserName(name)
        if (meta.prodi_name) setCurrentUserStudyProgram(meta.prodi_name)
        if (meta.org_name) {
          setCurrentUserOrg(meta.org_name)
          try { localStorage.setItem('eventloop_user_org', meta.org_name) } catch (e) {}
        }
        if (meta.phone) {
          setCurrentUserPhone(meta.phone)
          try { localStorage.setItem('eventloop_user_phone', meta.phone) } catch (e) {}
        }

        if (isAdminEmail(userEmail)) {
          setCurrentUserRole('admin')
        } else {
          setCurrentUserRole('user')
        }

        try {
          const parsedNim = validateNimStructure(nim)
          if (parsedNim.isValid) setCurrentUserStudyProgram(parsedNim.prodiName)
          // Hanya sinkronkan kolom valid tabel profiles (id, email, full_name, nim, updated_at)
          if (newSession.user?.email_confirmed_at && (parsedNim.isValid || isAdminEmail(userEmail))) {
            await supabase.from('profiles').upsert({
              id: newSession.user.id,
              email: userEmail,
              full_name: name,
              nim: nim,
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
      if (realtimeTimer) clearTimeout(realtimeTimer)
      authListener?.subscription?.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [fetchSupabaseData])

  // --- CART ACTIONS ---
  const addToCart = (equipment, qty = 1) => {
    const isLocked = Boolean(
      activeReservation?.eventName && (
        userPaymentStatus === 'pending_admin_approval' ||
        (userPaymentStatus === 'approved' && (activeReservation.items || []).some(i => i.listingType !== 'sale'))
      )
    )
    if (isLocked) return
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
      uploader: currentUserName || 'Prasmulyan',
      ownerPhone: newEquipment.ownerPhone || currentUserPhone || '',
      ownerUserId: session?.user?.id || null
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

    const isFree = itemToApprove.pricingType === 'free'
    const isSale = itemToApprove.pricingType === 'sale'
    const priceVal = isFree ? 0 : (isSale ? (Number(itemToApprove.price) || 50000) : (Number(itemToApprove.price) || 20000))
    const salePriceVal = isSale ? (Number(itemToApprove.salePrice) || priceVal) : null

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
      lastLocation: normalizeStorageLocation(itemToApprove.initialLocation),
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
      dbTxnId: itemToApprove.dbTxnId || null,
      ownerPhone: itemToApprove.ownerPhone || '',
      ownerUserId: itemToApprove.ownerUserId || null
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
          .ilike('item_names', `%[EQUIPMENT_UPLOAD]%:::${approvalId}%`)
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
    const itemsToCheckout = cartItems.length > 0 ? cartItems : (activeReservation?.items || [])
    if (itemsToCheckout.length === 0) return

    const txnId = `TXN-QRIS-${Math.floor(100 + Math.random() * 900)}`
    
    // Potong ketersediaan stok di state lokal dan sinkronkan ke database Supabase
    setEquipments(prev => prev.map(eq => {
      const reservedItem = itemsToCheckout.find(cart => String(cart.id) === String(eq.id))
      if (reservedItem) {
        return { ...eq, available: Math.max(0, (eq.available ?? 0) - reservedItem.qty) }
      }
      return eq
    }))

    for (const item of itemsToCheckout) {
      const currentEq = equipments.find(e => String(e.id) === String(item.id))
      if (currentEq) {
        const newAvail = Math.max(0, (currentEq.available ?? 0) - (item.qty || 1))
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

    const itemNamesSummary = itemsToCheckout.map(i => `${i.name} (${i.qty}x)`).join(', ') || 'Reservasi Perlengkapan Event'

    const todayLabel = formatIdDate(new Date())
    const startDateLabel = activeReservation?.startDateLabel || activeReservation?.startDate || todayLabel
    const endDateLabel = activeReservation?.endDateLabel || activeReservation?.endDate || todayLabel
    const durationDays = Math.max(1, Number(activeReservation?.durationDays) || 1)
    const activeUserId = session?.user?.id || null

    const borrowedSnapshot = itemsToCheckout.map(item => {
      const unitPrice = item.listingType === 'free'
        ? 0
        : item.listingType === 'sale'
        ? Number(item.salePrice || (item.price || 0) * 5)
        : Number(item.price || 0)
      const dayMult = item.listingType === 'sale' ? 1 : durationDays
      const qtyNum = Math.max(1, Number(item.qty) || 1)
      return {
        id: item.id,
        name: item.name,
        qty: qtyNum,
        listingType: item.listingType || 'rental',
        unitPrice,
        subtotal: Math.max(0, Math.round(unitPrice * qtyNum * dayMult)),
        image: item.image || '📦',
        owner: item.owner || 'Organisasi Pemilik Barang',
        ownerBank: item.ownerBank || 'BCA 8012345678 a.n Owner',
        uploader: item.uploader || item.owner || 'Organisasi Pemilik Barang',
        originLocation: normalizeStorageLocation(item.lastLocation || item.initialLocation)
      }
    })

    // Kelompokkan pembayaran & potongan fee 5% secara terpisah untuk masing-masing pemilik barang
    const ownerPayouts = buildOwnerPayouts({
      items: borrowedSnapshot,
      durationDays,
      defaultStatus: 'Waiting Admin Approval',
      fallbackTotalAmount: totalAmount
    })
    const detectedOwnerOrg = ownerPayouts.map(op => op.ownerOrg).join(' & ') || 'Organisasi Pemilik Barang'
    const detectedOwnerBank = ownerPayouts[0]?.ownerBank || 'BCA 8012345678 a.n Owner'
    const totalAdminFee = ownerPayouts.reduce((s, op) => s + (op.adminFee || 0), 0)
    const totalNetPayout = ownerPayouts.reduce((s, op) => s + (op.payoutAmount || 0), 0)

    const cloudMetaPayload = {
      status: 'Waiting Admin Approval',
      userId: activeUserId,
      buyerOrg: activeReservation?.org || currentUserOrg || currentUserName || 'BEM Prasetiya Mulya',
      borrowerName: currentUserName || 'Prasmulyan',
      borrowerPhone: activeReservation?.borrowerPhone || currentUserPhone || '',
      eventName: activeReservation?.eventName || 'Kegiatan Kampus Prasmul',
      startDate: startDateLabel,
      endDate: endDateLabel,
      durationDays,
      eventLocation: activeReservation?.location || 'Auditorium Kampus BSD',
      borrowedItems: borrowedSnapshot,
      ownerOrg: detectedOwnerOrg,
      ownerBank: detectedOwnerBank,
      ownerPayouts,
      paymentProofPhoto: paymentProofPhoto || null,
      payoutProofPhoto: null
    }

    const newTxn = {
      id: txnId,
      userId: activeUserId,
      buyerOrg: cloudMetaPayload.buyerOrg,
      borrowerName: cloudMetaPayload.borrowerName,
      eventName: cloudMetaPayload.eventName,
      startDate: startDateLabel,
      endDate: endDateLabel,
      durationDays,
      eventLocation: cloudMetaPayload.eventLocation,
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
      ownerPayouts,
      payoutStatus: 'Waiting Admin Approval',
      payoutAmount: totalNetPayout,
      adminFee: totalAdminFee,
    }

    let createdTxnId = txnId
    try {
      const { data: inserted, error: dbErr } = await supabase.from('transactions').insert([{
        buyer_org: newTxn.buyerOrg,
        item_names: newTxn.itemName,
        amount: newTxn.amount,
        qris_status: 'Pending Admin Verification',
        payout_status: JSON.stringify(cloudMetaPayload)
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
      ownerUserId: activeUserId,
      eventName: activeReservation?.eventName || 'Kegiatan Kampus Prasmul',
      org: activeReservation?.org || currentUserOrg || currentUserName || 'BEM Prasetiya Mulya',
      borrowerName: currentUserName || 'Prasmulyan',
      borrowerPhone: activeReservation?.borrowerPhone || currentUserPhone || '',
      startDateLabel,
      endDateLabel,
      eventDate: `${startDateLabel} – ${endDateLabel}`,
      durationDays,
      location: activeReservation?.location || 'Auditorium Kampus BSD',
      items: itemsToCheckout.map(item => ({
        ...item,
        lastLocation: normalizeStorageLocation(item.lastLocation || item.initialLocation)
      })), 
      txnId: createdTxnId,
      totalAmount,
      paymentProofPhoto,
      paymentStatus: 'pending_admin_approval'
    }

    if (activeUserId) {
      lastSyncedResHashRef.current = `${activeUserId}:::pending_admin_approval:::${JSON.stringify(activeReservationPayload)}`
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
    if (activeUserId) {
      try {
        const cloudRes = {
          user_id: activeUserId,
          item_name: JSON.stringify(activeReservationPayload),
          quantity: itemsToCheckout.length,
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
    const localTxn = transactions.find(t => String(t.id) === String(txnId))
    const buildApprovedOwners = (list = []) => list.map(op => {
      if (op.status === 'Transferred' || op.status === 'Settled (Gratis)') return op
      return {
        ...op,
        status: (Number(op.grossAmount) || 0) === 0 ? 'Settled (Gratis)' : 'Pending Transfer'
      }
    })

    let nextLocalOwnerPayouts = localTxn?.ownerPayouts ? buildApprovedOwners(localTxn.ownerPayouts) : null
    let nextOverallStatus = nextLocalOwnerPayouts
      ? deriveOverallPayoutStatus(nextLocalOwnerPayouts, 'Pending Transfer')
      : 'Pending Transfer'

    try {
      if (txnId) {
        // Ambil payout_status sebelumnya agar bukti bayar & metadata tidak terhapus
        let nextPayoutStatus = nextOverallStatus
        try {
          const { data: existingRow } = await supabase
            .from('transactions')
            .select('payout_status')
            .eq('id', txnId)
            .maybeSingle()

          if (existingRow?.payout_status && existingRow.payout_status.startsWith('{')) {
            const parsedMeta = JSON.parse(existingRow.payout_status)
            const sourceOwners = (Array.isArray(parsedMeta.ownerPayouts) && parsedMeta.ownerPayouts.length > 0)
              ? parsedMeta.ownerPayouts
              : (localTxn?.ownerPayouts || [])
            const updatedOwners = sourceOwners.length > 0 ? buildApprovedOwners(sourceOwners) : undefined
            const derived = updatedOwners ? deriveOverallPayoutStatus(updatedOwners, 'Pending Transfer') : 'Pending Transfer'
            nextOverallStatus = derived
            if (updatedOwners) nextLocalOwnerPayouts = updatedOwners
            nextPayoutStatus = JSON.stringify({
              ...parsedMeta,
              status: derived,
              ...(updatedOwners ? { ownerPayouts: updatedOwners } : {})
            })
          }
        } catch (e) {}

        const { error: updErr } = await supabase
          .from('transactions')
          .update({
            qris_status: 'Payment Approved by Admin (Lunas)',
            payout_status: nextPayoutStatus
          })
          .eq('id', txnId)

        if (updErr) {
          console.warn('Update transaksi spesifik gagal:', updErr)
        }

        // Update HANYA row reservations yang terhubung ke txnId ini (tidak memengaruhi user lain)
        const { data: matchingRes } = await supabase
          .from('reservations')
          .select('id, item_name')
          .ilike('item_name', `%${txnId}%`)

        if (matchingRes && matchingRes.length > 0) {
          for (const row of matchingRes) {
            let nextItemName = row.item_name
            try {
              const p = JSON.parse(row.item_name)
              nextItemName = JSON.stringify({ ...p, paymentStatus: 'approved' })
            } catch (e) {}
            await supabase
              .from('reservations')
              .update({ status: 'approved', item_name: nextItemName })
              .eq('id', row.id)
          }
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
    } catch (err) {
      console.warn('Gagal update transaksi di Supabase:', err)
    }

    setTransactions(prev => prev.map(t => {
      if (t.id === txnId || !txnId) {
        const updatedOwners = nextLocalOwnerPayouts || (t.ownerPayouts ? buildApprovedOwners(t.ownerPayouts) : t.ownerPayouts)
        const derived = updatedOwners ? deriveOverallPayoutStatus(updatedOwners, 'Pending Transfer') : nextOverallStatus
        return {
          ...t,
          qrisStatus: 'Payment Approved by Admin (Lunas)',
          payoutStatus: derived,
          ownerPayouts: updatedOwners
        }
      }
      return t
    }))
    if (activeReservation?.txnId && (!txnId || String(activeReservation.txnId) === String(txnId))) {
      setUserPaymentStatus('approved')
      try { localStorage.setItem('eventloop_user_payment_status', 'approved') } catch (e) {}
    }
  }

  const rejectPaymentByAdmin = async (txnId, reason = '') => {
    const targetTxn = transactions.find(t => String(t.id) === String(txnId))
    try {
      if (txnId) {
        let nextPayoutStatus = 'Rejected'
        try {
          const { data: existingRow } = await supabase
            .from('transactions')
            .select('payout_status')
            .eq('id', txnId)
            .maybeSingle()

          if (existingRow?.payout_status && existingRow.payout_status.startsWith('{')) {
            const parsedMeta = JSON.parse(existingRow.payout_status)
            const rejectedOwners = Array.isArray(parsedMeta.ownerPayouts)
              ? parsedMeta.ownerPayouts.map(op => ({ ...op, status: 'Rejected' }))
              : undefined
            nextPayoutStatus = JSON.stringify({
              ...parsedMeta,
              status: 'Rejected',
              ...(rejectedOwners ? { ownerPayouts: rejectedOwners } : {}),
              rejectReason: reason || 'Bukti pembayaran tidak sesuai / ditolak Admin'
            })
          }
        } catch (e) {}

        await supabase
          .from('transactions')
          .update({
            qris_status: 'Payment Rejected by Admin (Ditolak)',
            payout_status: nextPayoutStatus
          })
          .eq('id', txnId)

        // Pulihkan stok barang yang sempat terpotong saat mahasiswa mengirim bukti pembayaran
        const itemsToRestore = targetTxn?.borrowedItems || []
        for (const item of itemsToRestore) {
          const currentEq = equipments.find(e => String(e.id) === String(item.id))
          if (currentEq) {
            const nextAvail = Math.min(Number(currentEq.total) || 99, (Number(currentEq.available) || 0) + (Number(item.qty) || 1))
            if (!isNaN(item.id)) {
              await supabase.from('equipments').update({ available: nextAvail }).eq('id', item.id)
            }
            if (currentEq.dbTxnId) {
              await supabase.from('transactions').update({ payout_status: JSON.stringify({ ...currentEq, available: nextAvail }) }).eq('id', currentEq.dbTxnId)
            }
          }
        }

        const { data: matchingRes } = await supabase
          .from('reservations')
          .select('id, item_name')
          .ilike('item_name', `%${txnId}%`)

        if (matchingRes && matchingRes.length > 0) {
          for (const row of matchingRes) {
            let nextItemName = row.item_name
            try {
              const p = JSON.parse(row.item_name)
              nextItemName = JSON.stringify({ ...p, paymentStatus: 'rejected' })
            } catch (e) {}
            await supabase
              .from('reservations')
              .update({ status: 'rejected', item_name: nextItemName })
              .eq('id', row.id)
          }
        }
      }
    } catch (err) {
      console.warn('Gagal menolak pembayaran di Supabase:', err)
    }

    if (targetTxn?.borrowedItems?.length > 0) {
      setEquipments(prev => prev.map(eq => {
        const match = targetTxn.borrowedItems.find(it => String(it.id) === String(eq.id))
        if (!match) return eq
        return {
          ...eq,
          available: Math.min(Number(eq.total) || 99, (Number(eq.available) || 0) + (Number(match.qty) || 1))
        }
      }))
    }

    setTransactions(prev => prev.map(t => (
      String(t.id) === String(txnId)
        ? {
            ...t,
            qrisStatus: 'Payment Rejected by Admin (Ditolak)',
            payoutStatus: 'Rejected',
            ownerPayouts: Array.isArray(t.ownerPayouts) ? t.ownerPayouts.map(op => ({ ...op, status: 'Rejected' })) : t.ownerPayouts
          }
        : t
    )))

    if (activeReservation?.txnId && String(activeReservation.txnId) === String(txnId)) {
      setUserPaymentStatus('rejected')
      try { localStorage.setItem('eventloop_user_payment_status', 'rejected') } catch (e) {}
    }
  }

  const transferPayoutToOwner = async (txnId, proofPhoto = null, ownerKey = null) => {
    const payoutRef = `TRF-BCA-${Math.floor(100000 + Math.random() * 900000)}`
    const transferredAt = `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
    const targetTxn = transactions.find(t => String(t.id) === String(txnId))

    const applyOwnerTransfer = (ownersList = []) => {
      if (!Array.isArray(ownersList) || ownersList.length === 0) return []
      return ownersList.map((op, idx) => {
        const isMatch = ownerKey
          ? (String(op.ownerKey) === String(ownerKey) || op.ownerOrg === ownerKey)
          : idx === 0
        if (!isMatch) return op
        return {
          ...op,
          status: 'Transferred',
          payoutRef,
          transferredAt,
          payoutProofPhoto: proofPhoto || op.payoutProofPhoto || null
        }
      })
    }

    let updatedOwnersFinal = targetTxn?.ownerPayouts ? applyOwnerTransfer(targetTxn.ownerPayouts) : []
    let overallStatusFinal = deriveOverallPayoutStatus(updatedOwnersFinal, 'Transferred')

    try {
      if (txnId) {
        let nextPayoutPayload = overallStatusFinal
        try {
          const { data: existingRow } = await supabase
            .from('transactions')
            .select('payout_status')
            .eq('id', txnId)
            .maybeSingle()

          const baseMeta = (existingRow?.payout_status && existingRow.payout_status.startsWith('{'))
            ? JSON.parse(existingRow.payout_status)
            : {}

          const baseOwners = (Array.isArray(baseMeta.ownerPayouts) && baseMeta.ownerPayouts.length > 0)
            ? baseMeta.ownerPayouts
            : (targetTxn?.ownerPayouts || [])

          const nextOwners = baseOwners.length > 0 ? applyOwnerTransfer(baseOwners) : []
          const derived = nextOwners.length > 0 ? deriveOverallPayoutStatus(nextOwners, 'Transferred') : 'Transferred'
          updatedOwnersFinal = nextOwners.length > 0 ? nextOwners : updatedOwnersFinal
          overallStatusFinal = derived

          nextPayoutPayload = JSON.stringify({
            ...baseMeta,
            status: derived,
            ...(nextOwners.length > 0 ? { ownerPayouts: nextOwners } : {}),
            ...(nextOwners.length <= 1 ? {
              payoutRef,
              transferredAt,
              payoutProofPhoto: proofPhoto || baseMeta.payoutProofPhoto || null
            } : {})
          })
        } catch (e) {}

        await supabase
          .from('transactions')
          .update({ payout_status: nextPayoutPayload })
          .eq('id', txnId)
      }
    } catch (err) {
      console.warn('Gagal update payout di Supabase:', err)
    }

    setTransactions(prev => prev.map(t => {
      if (String(t.id) === String(txnId)) {
        const nextOwners = updatedOwnersFinal.length > 0
          ? updatedOwnersFinal
          : applyOwnerTransfer(t.ownerPayouts || [])
        const derived = nextOwners.length > 0 ? deriveOverallPayoutStatus(nextOwners, 'Transferred') : overallStatusFinal
        return {
          ...t,
          payoutStatus: derived,
          ownerPayouts: nextOwners,
          ...(nextOwners.length <= 1 ? {
            payoutRef,
            payoutProofPhoto: proofPhoto || t.payoutProofPhoto || null,
            transferredAt
          } : {})
        }
      }
      return t
    }))
  }

  // --- BATALKAN / RESET EVENT AKTIF ---
  const clearActiveEvent = async () => {
    const pendingCancelTxnId = (userPaymentStatus === 'pending_admin_approval' && activeReservation?.txnId)
      ? activeReservation.txnId
      : null
    const itemsToRestore = pendingCancelTxnId ? (activeReservation?.items || []) : []

    if (pendingCancelTxnId) {
      try {
        await supabase
          .from('transactions')
          .update({ qris_status: 'Payment Cancelled by User (Dibatalkan)' })
          .eq('id', pendingCancelTxnId)

        for (const item of itemsToRestore) {
          const currentEq = equipments.find(e => String(e.id) === String(item.id))
          if (currentEq) {
            const nextAvail = Math.min(Number(currentEq.total) || 99, (Number(currentEq.available) || 0) + (Number(item.qty) || 1))
            if (!isNaN(item.id)) {
              await supabase.from('equipments').update({ available: nextAvail }).eq('id', item.id)
            }
            if (currentEq.dbTxnId) {
              await supabase.from('transactions').update({ payout_status: JSON.stringify({ ...currentEq, available: nextAvail }) }).eq('id', currentEq.dbTxnId)
            }
          }
        }
      } catch (cancelErr) {
        console.warn('Gagal membatalkan transaksi pending di Supabase:', cancelErr)
      }

      if (itemsToRestore.length > 0) {
        setEquipments(prev => prev.map(eq => {
          const match = itemsToRestore.find(it => String(it.id) === String(eq.id))
          if (!match) return eq
          return {
            ...eq,
            available: Math.min(Number(eq.total) || 99, (Number(eq.available) || 0) + (Number(match.qty) || 1))
          }
        }))
      }
      setTransactions(prev => prev.map(t => (
        String(t.id) === String(pendingCancelTxnId)
          ? { ...t, qrisStatus: 'Payment Cancelled by User (Dibatalkan)', payoutStatus: 'Cancelled' }
          : t
      )))
    }

    try {
      const orderTxns = (transactions || []).filter(t => 
        !isSystemMetaTxn(t.item_names) && !isSystemMetaTxn(t.itemName)
      )
      const targetOrderTxnId = activeReservation?.txnId || orderTxns[0]?.id || transactions[0]?.id
      if (targetOrderTxnId) {
        localStorage.setItem('eventloop_cleared_txn_id', String(targetOrderTxnId))
      }
    } catch (e) {}
    lastSyncedResHashRef.current = ''
    setActiveReservation(null)
    setCompletedEventNotice(null)
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
    const targetEq = equipments.find(item => String(item.id) === String(id))
    try {
      if (!isNaN(id)) {
        await supabase.from('equipments').delete().eq('id', id)
      }
      // Hapus / tandai baris upload barang berdasarkan dbTxnId atau pola item_names
      if (targetEq?.dbTxnId) {
        await supabase.from('transactions').delete().eq('id', targetEq.dbTxnId)
        await supabase.from('transactions').update({ qris_status: 'Equipment Deleted' }).eq('id', targetEq.dbTxnId)
      } else {
        await supabase.from('transactions').delete().ilike('item_names', `[EQUIPMENT_UPLOAD]%:::${id}%`)
        await supabase.from('transactions').update({ qris_status: 'Equipment Deleted' }).ilike('item_names', `[EQUIPMENT_UPLOAD]%:::${id}%`)
      }
    } catch (err) {
      console.warn('Gagal hapus equipment di Supabase:', err)
    }

    setEquipments(prev => prev.filter(item => String(item.id) !== String(id)))
    setCartItems(prev => prev.filter(item => String(item.id) !== String(id)))
    return true
  }

  const deletePendingEquipment = async (id) => {
    try {
      const target = pendingApprovals.find(item => String(item.id) === String(id))
      if (target?.dbTxnId) {
        await supabase.from('transactions').delete().eq('id', target.dbTxnId)
      } else {
        await supabase.from('transactions').delete().ilike('item_names', `[EQUIPMENT_UPLOAD]%:::${id}%`)
      }
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
      userId: session?.user?.id || null,
      ...returnData,
      borrower: borrowerName,
      status: 'Pending Admin Verification',
      timestamp: returnData.timestamp || (new Date().toLocaleString('id-ID') + ' WIB')
    }

    // 1. Dual-Sync ke Supabase:
    // Sync ke tabel transactions (terbukti 100% didukung RLS dan terbaca di semua perangkat admin)
    try {
      const { data: insertedTxn, error: txErr } = await supabase
        .from('transactions')
        .insert([{
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
        .select('id')

      if (txErr) {
        console.warn('Gagal sync return ke transactions:', txErr)
      } else if (insertedTxn && insertedTxn[0]?.id) {
        newReturn.dbTxnId = insertedTxn[0].id
      }
    } catch (txEx) {
      console.warn('Exception sync return ke transactions:', txEx)
    }

    // 2. Sync ke tabel returns jika equipmentId valid UUID (Postgres UUID type constraint)
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(String(returnData.equipmentId || ''))
    if (isUuid) {
      try {
        await supabase.from('returns').insert([{
          equipment_id: String(returnData.equipmentId),
          condition_photo: returnData.conditionPhoto || null,
          storage_photo: returnData.storagePhoto || null,
          status: 'Pending Admin Verification',
          returned_qty: returnData.returnedQty || 1,
          borrower: borrowerName
        }])
      } catch (err) {
        console.warn('Catatan tabel returns sync:', err)
      }
    }

    setPendingReturns(prev => [newReturn, ...prev.filter(r => r.id !== returnId)])
    setReturnStatus('pending_admin_approval')
    try { localStorage.setItem('eventloop_return_status', 'pending_admin_approval') } catch (e) {}

    // Segera refresh Supabase data agar antrean langsung muncul di sisi Admin
    try {
      fetchSupabaseData()
    } catch (e) {}

    return { success: true, returnId, dbTxnId: newReturn.dbTxnId }
  }

  const approveReturnByAdmin = async (returnId, equipmentId, returnedQty) => {
    const returnData = pendingReturns.find(r => r.id === returnId || r.returnId === returnId)
    const targetEq = equipments.find(e => String(e.id) === String(equipmentId))
    const finalLocation = normalizeStorageLocation(returnData?.returnLocation || targetEq?.lastLocation || targetEq?.initialLocation)
    const qtyToAdd = Number(returnedQty) || 1
    const cappedNextAvail = targetEq
      ? Math.min(Number(targetEq.total) || 99, (Number(targetEq.available) || 0) + qtyToAdd)
      : qtyToAdd
    const nextReusedCount = (Number(targetEq?.reusedCount) || 0) + qtyToAdd

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
          .ilike('item_names', `%:::${returnId}%`)
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

      // 3. Update stok, reuse count, dan lokasi perlengkapan di Supabase (terbatas tidak melebihi total)
      if (equipmentId) {
        if (!isNaN(equipmentId) && targetEq) {
          await supabase
            .from('equipments')
            .update({ 
              available: cappedNextAvail,
              reusedCount: nextReusedCount,
              lastLocation: finalLocation,
              lastStoragePhoto: returnData?.storagePhoto || null
            })
            .eq('id', equipmentId)
        }
        if (targetEq?.dbTxnId) {
          const updatedPayload = {
            ...targetEq,
            available: cappedNextAvail,
            reusedCount: nextReusedCount,
            lastLocation: finalLocation,
            lastStoragePhoto: returnData?.storagePhoto || targetEq.lastStoragePhoto
          }
          await supabase
            .from('transactions')
            .update({ payout_status: JSON.stringify(updatedPayload) })
            .eq('id', targetEq.dbTxnId)
        }
      }

      // 4. Update tabel reservations HANYA untuk pengguna/peminjam yang mengajukan return ini
      try {
        const { data: allRes } = await supabase.from('reservations').select('*')
        if (allRes && allRes.length > 0) {
          const returnBorrowerLow = (returnData?.borrower || '').toLowerCase().trim()
          for (const resRow of allRes) {
            if (resRow.item_name && resRow.item_name.startsWith('{')) {
              try {
                const parsed = JSON.parse(resRow.item_name)
                const matchesUser = returnData?.userId
                  ? resRow.user_id === returnData.userId
                  : (returnBorrowerLow && (
                      (parsed.borrowerName || '').toLowerCase().trim() === returnBorrowerLow ||
                      (parsed.org || '').toLowerCase().trim() === returnBorrowerLow
                    ))

                if (!matchesUser) continue

                const hasItem = (parsed.items || []).some(i => String(i.id) === String(equipmentId))
                if (hasItem) {
                  const updatedItems = (parsed.items || []).filter(i => String(i.id) !== String(equipmentId))
                  const remainingRentedCount = updatedItems.filter(i => i.listingType !== 'sale').length
                  const nextCloudStatus = remainingRentedCount === 0 ? 'completed' : resRow.status

                  await supabase
                    .from('reservations')
                    .update({
                      item_name: JSON.stringify({
                        ...parsed,
                        items: updatedItems,
                        paymentStatus: nextCloudStatus
                      }),
                      quantity: updatedItems.length,
                      status: nextCloudStatus
                    })
                    .eq('id', resRow.id)

                  if (remainingRentedCount === 0 && parsed.txnId) {
                    try {
                      const { data: orderRow } = await supabase
                        .from('transactions')
                        .select('payout_status')
                        .eq('id', parsed.txnId)
                        .maybeSingle()
                      if (orderRow?.payout_status && orderRow.payout_status.startsWith('{')) {
                        const orderMeta = JSON.parse(orderRow.payout_status)
                        await supabase
                          .from('transactions')
                          .update({ payout_status: JSON.stringify({ ...orderMeta, cycleCompleted: true }) })
                          .eq('id', parsed.txnId)
                      }
                    } catch (ordErr) {}
                  }
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

    // Segera perbarui daftar Live Tracking lokal agar barang/event yang sudah dikembalikan langsung hilang tanpa menunggu polling
    setCloudActiveReservations(prev => prev.map(ev => {
      const sameUser = (returnData?.userId && ev.userId)
        ? ev.userId === returnData.userId
        : (returnData?.borrower && (
            (ev.borrowerName || '').toLowerCase().trim() === returnData.borrower.toLowerCase().trim() ||
            (ev.org || '').toLowerCase().trim() === returnData.borrower.toLowerCase().trim()
          ))
      if (!sameUser) return ev
      const remaining = (ev.items || []).filter(i => String(i.id) !== String(equipmentId))
      return { ...ev, items: remaining }
    }).filter(ev => (ev.items || []).length > 0))
    
    setEquipments(prev => prev.map(item => {
      if (String(item.id) === String(equipmentId)) {
        return { 
          ...item, 
          available: Math.min(Number(item.total) || 99, (Number(item.available) || 0) + qtyToAdd),
          reuseCount: (Number(item.reuseCount) || 0) + qtyToAdd,
          reusedCount: (Number(item.reusedCount) || 0) + qtyToAdd,
          lastLocation: finalLocation,
          lastStoragePhoto: returnData?.storagePhoto || item.lastStoragePhoto,
          lastConditionPhoto: returnData?.conditionPhoto || null
        }
      }
      return item
    }))

    // Hapus dari activeReservation lokal hanya jika milik peminjam yang return-nya baru disetujui.
    // Jika seluruh barang sewa telah kembali, otomatis tutup siklus event tanpa memaksa klik tombol manual!
    const matchesLocalOwner = !returnData?.userId || !session?.user?.id || returnData.userId === session.user.id
    if (matchesLocalOwner && activeReservation?.items) {
      const remainingItems = activeReservation.items.filter(item => String(item.id) !== String(equipmentId))
      const remainingRented = remainingItems.filter(item => item.listingType !== 'sale')
      if (remainingRented.length === 0) {
        const finishedEventName = activeReservation.eventName || returnData?.itemName || 'Kegiatan Kampus'
        lastSyncedResHashRef.current = ''
        if (activeReservation.txnId) {
          try { localStorage.setItem('eventloop_cleared_txn_id', String(activeReservation.txnId)) } catch (e) {}
        }
        setActiveReservation(null)
        setUserPaymentStatus('idle')
        setCompletedEventNotice({
          id: String(activeReservation.txnId || returnId),
          eventName: finishedEventName
        })
        try {
          localStorage.removeItem('eventloop_active_reservation')
          localStorage.setItem('eventloop_user_payment_status', 'idle')
        } catch (e) {}
      } else {
        setActiveReservation(prev => (prev ? { ...prev, items: remainingItems } : prev))
      }
    }
  }

  const dismissCompletedEventNotice = useCallback(() => {
    setCompletedEventNotice(prev => {
      if (prev?.id) {
        try { sessionStorage.setItem('eventloop_dismissed_completed_id', String(prev.id)) } catch (e) {}
      }
      return null
    })
  }, [])

  // Status pembayaran efektif terpusat khusus untuk event aktif pengguna saat ini
  const activeOrderTxn = useMemo(() => {
    if (!activeReservation?.txnId) return null
    return (transactions || []).find(t => String(t.id) === String(activeReservation.txnId)) || null
  }, [transactions, activeReservation?.txnId])

  const effectivePaymentStatus = useMemo(() => {
    if (userPaymentStatus === 'idle' && !activeReservation?.txnId) return 'idle'
    if (activeOrderTxn) {
      const q = (activeOrderTxn.qrisStatus || '').toLowerCase()
      if (q.includes('approved') || q.includes('lunas') || q.includes('sukses')) return 'approved'
      if (q.includes('pending') || q.includes('menunggu')) return 'pending_admin_approval'
      if (q.includes('reject') || q.includes('tolak')) return 'rejected'
    }
    return userPaymentStatus
  }, [userPaymentStatus, activeOrderTxn, activeReservation?.txnId])

  // Benar-benar terkunci hanya jika masih menunggu ACC bayar atau masih ada barang sewa yang belum kembali
  const hasOngoingRental = useMemo(() => {
    if (!activeReservation?.eventName) return false
    if (effectivePaymentStatus === 'pending_admin_approval') return true
    if (effectivePaymentStatus === 'approved') {
      const rented = (activeReservation.items || []).filter(i => i.listingType !== 'sale')
      return rented.length > 0
    }
    return false
  }, [activeReservation, effectivePaymentStatus])

  const isMyPendingReturn = useCallback((ret) => {
    if (!ret) return false
    const uid = session?.user?.id
    if (uid && ret.userId) return ret.userId === uid
    const uName = (activeReservation?.borrowerName || currentUserName || '').toLowerCase().trim()
    const rBorrower = (ret.borrower || '').toLowerCase().trim()
    if (uName && uName !== 'prasmulyan' && rBorrower) {
      return rBorrower === uName || rBorrower.includes(uName) || uName.includes(rBorrower)
    }
    return false
  }, [session?.user?.id, activeReservation?.borrowerName, currentUserName])

  const resolveContactPhone = useCallback(({ userId, name, org, fallbackPhone } = {}) => {
    if (formatIndonesianWaNumber(fallbackPhone)) return fallbackPhone
    if (userId && contactDirectory.byUserId[userId]) return contactDirectory.byUserId[userId]
    const nLow = String(name || '').toLowerCase().trim()
    if (nLow && contactDirectory.byName[nLow]) return contactDirectory.byName[nLow]
    const oLow = String(org || '').toLowerCase().trim()
    if (oLow && contactDirectory.byOrg[oLow]) return contactDirectory.byOrg[oLow]
    return ''
  }, [contactDirectory])

  const saveUserContactToDirectory = useCallback(async ({ userId, fullName, orgName, phone, role = 'user' }) => {
    const cleanPhone = String(phone || '').trim()
    const cleanOrg = String(orgName || '').trim()
    const cleanName = String(fullName || '').trim()

    if (cleanPhone) {
      setCurrentUserPhone(cleanPhone)
      try { localStorage.setItem('eventloop_user_phone', cleanPhone) } catch (e) {}
    }
    if (cleanOrg) {
      setCurrentUserOrg(cleanOrg)
      try { localStorage.setItem('eventloop_user_org', cleanOrg) } catch (e) {}
    }

    const uid = userId || session?.user?.id || null
    const waDigits = formatIndonesianWaNumber(cleanPhone)
    if (!waDigits) return

    setContactDirectory(prev => {
      const next = {
        byUserId: { ...prev.byUserId },
        byName: { ...prev.byName },
        byOrg: { ...prev.byOrg },
        adminPhone: prev.adminPhone
      }
      if (uid) next.byUserId[uid] = cleanPhone
      if (cleanName) next.byName[cleanName.toLowerCase()] = cleanPhone
      if (cleanOrg) next.byOrg[cleanOrg.toLowerCase()] = cleanPhone
      if (role === 'admin') next.adminPhone = cleanPhone
      return next
    })

    const tagKey = `[USER_CONTACT] ${uid || cleanName || cleanOrg}`
    const payloadStr = JSON.stringify({
      userId: uid,
      fullName: cleanName,
      orgName: cleanOrg,
      phone: cleanPhone,
      role,
      updatedAt: new Date().toISOString()
    })

    try {
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('item_names', tagKey)
        .limit(1)

      if (existing && existing.length > 0) {
        await supabase
          .from('transactions')
          .update({
            buyer_org: cleanOrg || cleanName || 'Prasmulyan',
            payout_status: payloadStr
          })
          .eq('id', existing[0].id)
      } else {
        await supabase
          .from('transactions')
          .insert([{
            buyer_org: cleanOrg || cleanName || 'Prasmulyan',
            item_names: tagKey,
            amount: 0,
            qris_status: 'Contact Directory',
            payout_status: payloadStr
          }])
      }
    } catch (err) {
      console.warn('Gagal menyimpan kontak WA ke direktori cloud:', err)
    }
  }, [session?.user?.id])

  // Wajib melengkapi profil (Nama, Organisasi, & Nomor WhatsApp aktif) bagi akun mahasiswa sebelum menggunakan fitur utama
  const isProfileComplete = useMemo(() => {
    if (currentUserRole === 'admin') return true
    const hasName = Boolean(currentUserName && currentUserName.trim() && currentUserName.trim() !== 'Prasmulyan')
    const hasOrg = Boolean(currentUserOrg && currentUserOrg.trim())
    const hasValidWa = Boolean(formatIndonesianWaNumber(currentUserPhone))
    return hasName && hasOrg && hasValidWa
  }, [currentUserRole, currentUserName, currentUserOrg, currentUserPhone])

  // --- LIVE TRACKING EVENT & PEMINJAMAN KAMPUS (BERBASIS RESERVATIONS AKTIF - OTOMATIS HILANG SAAT BARANG DIKEMBALIKAN) ---
  const ongoingCampusEvents = useMemo(() => {
    const list = []
    const myUid = session?.user?.id || null

    // 1. Event aktif milik pengguna saat ini (hanya barang sewa yang belum dikembalikan)
    if (activeReservation?.eventName && (effectivePaymentStatus === 'approved' || effectivePaymentStatus === 'pending_admin_approval')) {
      const currentItems = ((cartItems && cartItems.length > 0) ? cartItems : (activeReservation.items || []))
        .filter(i => i.listingType !== 'sale')
      if (currentItems.length > 0) {
        const startLbl = activeReservation.startDateLabel || activeReservation.startDate || formatIdDate(new Date())
        const endLbl = activeReservation.endDateLabel || activeReservation.endDate || formatIdDate(new Date())
        list.push({
          id: activeReservation.txnId || 'EVT-CURRENT',
          userId: myUid,
          isCurrentUser: true,
          eventName: activeReservation.eventName,
          org: activeReservation.org || currentUserOrg || currentUserName || 'Organisasi Mahasiswa',
          borrowerName: currentUserName || 'Prasmulyan',
          borrowerPhone: activeReservation.borrowerPhone || currentUserPhone || resolveContactPhone({ userId: myUid, name: currentUserName, org: activeReservation.org }),
          startDate: startLbl,
          endDate: endLbl,
          durationDays: activeReservation.durationDays || 1,
          location: activeReservation.location || 'Auditorium Kampus BSD',
          status: effectivePaymentStatus === 'approved' ? 'Sedang Berjalan (Dipinjam)' : 'Verifikasi Pembayaran',
          items: currentItems.map(i => ({
            id: i.id,
            name: i.name,
            qty: i.qty || 1,
            image: i.image || '📦',
            originLocation: normalizeStorageLocation(i.lastLocation || i.initialLocation)
          }))
        })
      }
    }

    // 2. Event aktif pengguna lain langsung dari tabel reservations yang belum selesai/dikembalikan
    cloudActiveReservations.forEach((ev) => {
      if (myUid && ev.userId && ev.userId === myUid) return
      if (activeReservation?.txnId && String(ev.id) === String(activeReservation.txnId)) return
      if (!ev.items || ev.items.length === 0) return

      list.push({
        ...ev,
        isCurrentUser: false,
        borrowerPhone: resolveContactPhone({
          userId: ev.userId,
          name: ev.borrowerName,
          org: ev.org,
          fallbackPhone: ev.borrowerPhone
        })
      })
    })

    return list
  }, [activeReservation, cartItems, cloudActiveReservations, currentUserName, currentUserOrg, currentUserPhone, effectivePaymentStatus, resolveContactPhone, session?.user?.id])

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
            userId: ev.userId || null,
            eventName: ev.eventName,
            borrowerName: ev.borrowerName,
            borrowerPhone: ev.borrowerPhone || '',
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
    lastSyncedResHashRef.current = ''
    currentSessionUserIdRef.current = null
    setSession(null)
    setSsoUser(null)
    setCurrentUserRole('user')
    setCurrentUserName('Prasmulyan')
    setCurrentUserStudyProgram('Prasetiya Mulya')
    setCurrentUserOrg('')
    setCurrentUserPhone('')
    setActiveReservation(null)
    setCompletedEventNotice(null)
    setUserPaymentStatus('idle')
    setCartItems([])
    setReturnStatus('idle')
    sessionStorage.removeItem('eventloop_session')
    sessionStorage.removeItem('eventloop_user_name')
    sessionStorage.removeItem('eventloop_role')
    sessionStorage.removeItem('eventloop_user_prodi')
    sessionStorage.removeItem('eventloop_sso_user')
    sessionStorage.removeItem('eventloop_last_active')
    sessionStorage.removeItem('eventloop_dismissed_completed_id')
    localStorage.removeItem('eventloop_session')
    localStorage.removeItem('eventloop_role')
    localStorage.removeItem('eventloop_user_prodi')
    localStorage.removeItem('eventloop_sso_user')
    localStorage.removeItem('eventloop_last_user_id')
    clearUserLocalStorage()
  }

  return (
    <AppContext.Provider value={{
      currentUserRole, setCurrentUserRole,
      currentUserName, setCurrentUserName,
      currentUserStudyProgram, setCurrentUserStudyProgram,
      currentUserOrg, setCurrentUserOrg,
      currentUserPhone, setCurrentUserPhone,
      isProfileComplete, contactDirectory, adminWaPhone: contactDirectory.adminPhone || '',
      resolveContactPhone, saveUserContactToDirectory,
      session, ssoUser, setSsoUser, sessionUser: session?.user || ssoUser || null, 
      logout, loadingDb, refetchData: fetchSupabaseData, fetchSupabaseData,
      campusImpact, orgImpacts,
      equipments, pendingApprovals, transactions, userPaymentStatus, effectivePaymentStatus, activeOrderTxn, hasOngoingRental,
      activeReservation, setActiveReservation, updateActiveEventDetails, clearActiveEvent,
      completedEventNotice, dismissCompletedEventNotice,
      returnStatus, pendingReturns, isMyPendingReturn,
      ongoingCampusEvents, getEquipmentBorrowings,
      cartItems, addToCart, removeFromCart, updateCartQty,
      uploadEquipmentByUser, approveEquipmentByAdmin, rejectEquipmentByAdmin, submitUserQrisPayment, approvePaymentByAdmin, rejectPaymentByAdmin,
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
