import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useApp } from '../context/AppContext'
import { Recycle, ArrowRight, Package, BarChart3, Shield, Zap, Sparkles, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  const { sessionUser, currentUserRole, currentUserName, loadingDb, campusImpact } = useApp();
  const itemsReused = campusImpact?.itemsReused ?? 0;
  const wasteAvoidedKg = campusImpact?.wasteAvoidedKg ?? 0;
  const eventsSupported = campusImpact?.eventsSupported ?? 0;

  const targetDashboard = currentUserRole === 'admin' ? '/admin' : '/dashboard'

  // Daftar item navigasi
  const navSections = [
    { id: 'masalah', label: 'Masalah & Solusi' },
    { id: 'circular-score', label: 'Circular Score' },
    { id: 'flow', label: 'Alur Aplikasi' },
    { id: 'business-model', label: 'Model Bisnis' },
  ]

  // State untuk melacak section yang sedang dilihat (ScrollSpy)
  const [activeSection, setActiveSection] = useState('home')
  
  // Style pill hijau meluncur mulus (Sliding Pill Indicator)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })
  const itemRefs = useRef({})
  const navContainerRef = useRef(null)

  // Update posisi sliding pill hijau secara presisi saat section aktif berganti
  useEffect(() => {
    const updatePill = () => {
      if (activeSection && activeSection !== 'home' && itemRefs.current[activeSection] && navContainerRef.current) {
        const activeEl = itemRefs.current[activeSection]
        const containerRect = navContainerRef.current.getBoundingClientRect()
        const activeRect = activeEl.getBoundingClientRect()
        setPillStyle({
          left: activeRect.left - containerRect.left,
          width: activeRect.width,
          opacity: 1
        })
      } else {
        setPillStyle((prev) => ({ ...prev, opacity: 0 }))
      }
    }

    updatePill()
    window.addEventListener('resize', updatePill)
    return () => window.removeEventListener('resize', updatePill)
  }, [activeSection])

  // Efek ambient glow kursor hijau super ringan via CSS Variables (Nol Reflow & Nol Render Lag saat scrolling)
  useEffect(() => {
    let ticking = false
    const handleMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`)
          document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ScrollSpy menggunakan IntersectionObserver modern (Nol Lag, Nol Forced Reflow pada saat scroll)
  useEffect(() => {
    const sectionIds = ['masalah', 'circular-score', 'flow', 'business-model']

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-15% 0px -55% 0px',
        threshold: 0
      }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    const handleScrollTop = () => {
      if (window.scrollY < 120) {
        setActiveSection('home')
      }
    }

    window.addEventListener('scroll', handleScrollTop, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScrollTop)
    }
  }, [])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -72
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveSection(id)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6FBF8] text-slate-800 selection:bg-emerald-100 selection:text-emerald-800 font-sans relative overflow-x-hidden">
      {/* Efek Cahaya Hijau Mengikuti Gerakan Kursor - GPU Accelerated Tanpa Beban Blur Lag */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(650px circle at var(--cursor-x, -1000px) var(--cursor-y, -1000px), rgba(16, 185, 129, 0.09) 0%, rgba(5, 150, 105, 0.03) 40%, transparent 70%)'
        }}
      />

      {/* Navbar dengan Indikator Hijau Menyesuaikan Posisi yang Sedang Dilihat */}
      <nav className="fixed top-0 w-full bg-white/85 backdrop-blur-xl border-b border-emerald-100/80 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight block leading-tight">
                Event<span className="text-emerald-600">Loop</span>
              </span>
              <p className="text-[9px] text-emerald-700 font-bold tracking-widest uppercase">Reuse · Rent · Return · Repeat</p>
            </div>
          </Link>
          
          {/* MENU NAVIGASI DENGAN INDIKATOR HIJAU MELUNCUR MULUS (SLIDING PILL) */}
          <div 
            ref={navContainerRef}
            className="relative hidden md:flex items-center gap-1 bg-emerald-50/70 p-1 rounded-full border border-emerald-100/90 shadow-2xs backdrop-blur-sm"
          >
            {/* Sliding Green Pill Element */}
            <div 
              className="absolute top-1 bottom-1 bg-emerald-600 rounded-full shadow-xs shadow-emerald-700/25 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                transform: `translateX(${pillStyle.left}px)`,
                width: `${pillStyle.width}px`,
                opacity: pillStyle.opacity
              }}
            />

            {navSections.map((sec) => {
              const isActive = activeSection === sec.id
              return (
                <a 
                  key={sec.id}
                  ref={(el) => (itemRefs.current[sec.id] = el)}
                  href={`#${sec.id}`}
                  onClick={(e) => scrollToSection(e, sec.id)}
                  className={`relative z-10 text-xs px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer select-none font-semibold ${
                    isActive 
                      ? 'text-white font-bold' 
                      : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-100/40'
                  }`}
                >
                  {sec.label}
                </a>
              )
            })}

            <Link 
              to={sessionUser ? "/marketplace" : "/login"} 
              className="relative z-10 text-xs text-emerald-800 font-bold hover:text-emerald-950 transition-all bg-emerald-100/90 hover:bg-emerald-200 px-3.5 py-1.5 rounded-full border border-emerald-300/80 shadow-2xs ml-0.5"
            >
              Marketplace
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {sessionUser ? (
              <Link to={targetDashboard} className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2">
                <span>Dashboard ({currentUserName || 'Prasmulyan'})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 transition-colors">
                  Masuk
                </Link>
                <Link to="/login?tab=signup" className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2 shadow-sm shadow-emerald-600/15">
                  <span>Mulai / Buat Akun</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-[#F6FBF8] to-[#F6FBF8]">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/90 border border-emerald-200/70 text-emerald-800 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Platform Pengelolaan Perlengkapan Sirkular Kampus</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.12]">
            Reuse. Rent.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700">
              Return. Repeat.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Platform sirkular kampus untuk meminjam, menyewakan, dan mengelola perlengkapan kegiatan mahasiswa. Hentikan pembelian sekali pakai, wujudkan kampus minim limbah & hemat anggaran!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
            <Link 
              to={sessionUser ? "/marketplace" : "/login"} 
              className="btn-primary text-sm !py-3.5 !px-8 flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm shadow-emerald-600/20"
            >
              <Package className="w-4 h-4" />
              <span>Jelajahi Katalog Barang</span>
            </Link>
            <Link 
              to={sessionUser ? "/create-event" : "/login?tab=signup"} 
              className="btn-secondary text-sm !py-3.5 !px-8 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>{sessionUser ? 'Buat Rencana Event' : 'Daftar Akun Mahasiswa'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Impact Stats Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto">
            <div className="card p-5 border-emerald-100/90 bg-white/90 backdrop-blur shadow-xs text-center space-y-1">
              <div className="text-2xl mb-1">♻️</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{loadingDb ? '...' : itemsReused.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Unit Dipakai Ulang</div>
              <div className="text-xs text-slate-500">Perlengkapan aktif bersirkulasi</div>
            </div>
            <div className="card p-5 border-emerald-100/90 bg-white/90 backdrop-blur shadow-xs text-center space-y-1">
              <div className="text-2xl mb-1">🌱</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{loadingDb ? '...' : `${wasteAvoidedKg} kg`}</div>
              <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Limbah Dicegah</div>
              <div className="text-xs text-slate-500">Material sekali pakai dihindari</div>
            </div>
            <div className="card p-5 border-emerald-100/90 bg-white/90 backdrop-blur shadow-xs text-center space-y-1">
              <div className="text-2xl mb-1">🎪</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{loadingDb ? '...' : eventsSupported}</div>
              <div className="text-[11px] text-teal-700 font-bold uppercase tracking-wider">Kegiatan Didukung</div>
              <div className="text-xs text-slate-500">Seminar, Expo, Lomba & UKM</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Circular Paradigm */}
      <section id="masalah" className="py-20 px-6 bg-white border-y border-emerald-100/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-sage mb-2">Pilar Solusi Berkelanjutan</span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Mengubah Pola Linier Menjadi Sirkular
            </h3>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto mt-2">
              Kepanitiaan sering membeli perlengkapan baru setiap kali ada kegiatan, yang akhirnya menumpuk di gudang atau terbuang.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Linear Old Way */}
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-3xl p-7 relative space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">
                Pola Lama (Linier Sekali Pakai)
              </div>
              <h4 className="text-lg font-bold text-rose-950">Beli → Pakai → Buang / Menumpuk Rusak</h4>
              <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                Organisasi membeli banner PVC, backdrop sekali pakai, dan sewa terpisah dari vendor luar. Biaya membengkak puluhan juta per semester serta limbah material plastik menumpuk.
              </p>
              <div className="space-y-2 font-mono text-xs bg-white/90 p-4 rounded-2xl border border-rose-200 text-rose-700 shadow-2xs">
                <div>❌ Backdrop Vinyl: Rp500.000 (1x pakai buang)</div>
                <div>❌ Standing Banner baru: Rp250.000</div>
                <div>❌ Sewa display luar: Rp350.000</div>
                <div className="pt-2 border-t border-rose-200 font-bold text-rose-900">Total Pemborosan: &gt; Rp1.500.000 / event</div>
              </div>
            </div>

            {/* Circular EventLoop Way */}
            <div className="bg-emerald-50/60 border-2 border-emerald-300/80 rounded-3xl p-7 relative shadow-sm space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                Pola Baru (EventLoop Sirkular)
              </div>
              <h4 className="text-lg font-bold text-emerald-950">Pesan → Pakai → Pulangkan → Repeat ♻️</h4>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                Organisasi meminjam perlengkapan modular berstandar Circular Score. Barang dibersihkan, diperiksa, dan langsung siap dipinjam oleh kepanitiaan berikutnya.
              </p>
              <div className="space-y-2 font-mono text-xs bg-white/95 p-4 rounded-2xl border border-emerald-200 text-emerald-800 shadow-2xs">
                <div>✅ Modular Frame: Rp50.000 (dapat dipakai 50+ event)</div>
                <div>✅ Reusable Fabric Banner: Rp25.000</div>
                <div>✅ Inventaris Bersama Kampus: Rp20.000</div>
                <div className="pt-2 border-t border-emerald-200 font-bold text-emerald-950">Hemat Anggaran: 75% - 85% + Zero Waste!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Components */}
      <section className="py-20 px-6 bg-[#F6FBF8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-sage mb-2">Bukan Sekadar Rental Biasa</span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              3 Komponen Utama Platform
            </h3>
            <p className="text-slate-600 text-sm max-w-xl mx-auto mt-2">Didesain khusus untuk menjawab inovasi Green Tech dan Circular Economy kampus.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 border-emerald-100/90 hover:border-emerald-300 hover:shadow-sm group transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 mb-5 group-hover:scale-105 transition-transform shadow-2xs">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">1. Circular Marketplace</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Katalog perlengkapan modular terkurasi: booth display, fabric banner, standing frame, lighting LED, sound system, hingga reusable cup ramah lingkungan.
              </p>
              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 py-1 px-2.5 rounded-lg inline-block">
                Tersedia 12+ Kategori Kampus
              </div>
            </div>

            <div className="card p-6 border-emerald-100/90 hover:border-emerald-300 hover:shadow-sm group transition-all duration-300">
              <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-teal-700 mb-5 group-hover:scale-105 transition-transform shadow-2xs">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">2. Campus Inventory Tracking</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Live tracking status peminjaman, siapa yang meminjam, batas tanggal pengembalian, serta lokasi gudang penyimpanan asal barang secara real-time.
              </p>
              <div className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-100 py-1 px-2.5 rounded-lg inline-block">
                Live Location & Borrowing Status
              </div>
            </div>

            <div className="card p-6 border-emerald-100/90 hover:border-emerald-300 hover:shadow-sm group transition-all duration-300">
              <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center text-green-700 mb-5 group-hover:scale-105 transition-transform shadow-2xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">3. Circular Impact Analytics</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Metrik dampak nyata di dashboard: estimasi limbah dicegah (kg), biaya pembelian dihindari (Rp), dan circular score untuk setiap organisasi kampus.
              </p>
              <div className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-100 py-1 px-2.5 rounded-lg inline-block">
                Kalkulasi Metrik Otomatis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Circular Score Feature Deep Dive (Cozy Soft Renewable Card) */}
      <section id="circular-score" className="py-20 px-6 bg-white border-y border-emerald-100/70">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-emerald-50/95 via-green-50/75 to-teal-50/80 border border-emerald-200/70 rounded-3xl p-8 sm:p-12 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid lg:grid-cols-2 gap-10 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/90 border border-emerald-200/70 text-emerald-800 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fitur Unggulan Green Tech</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                Circular Score System (0 – 100)
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                Bukan sekadar meminjam, EventLoop secara cerdas memberi bobot circular score untuk setiap perlengkapan berdasarkan 4 indikator keberlanjutan:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white/90 border border-emerald-100/90 p-3.5 rounded-2xl shadow-2xs">
                  <div className="font-bold text-slate-900 text-xs mb-0.5">🔁 Reuse Frequency</div>
                  <div className="text-[11px] text-slate-500">Frekuensi pemakaian ulang perlengkapan di berbagai event.</div>
                </div>
                <div className="bg-white/90 border border-emerald-100/90 p-3.5 rounded-2xl shadow-2xs">
                  <div className="font-bold text-slate-900 text-xs mb-0.5">🌿 Eco Material</div>
                  <div className="text-[11px] text-slate-500">Aluminium & kain polyester vs plastik PVC sekali pakai.</div>
                </div>
                <div className="bg-white/90 border border-emerald-100/90 p-3.5 rounded-2xl shadow-2xs">
                  <div className="font-bold text-slate-900 text-xs mb-0.5">🔧 Repairability</div>
                  <div className="text-[11px] text-slate-500">Kemudahan komponen modular dirawat & diganti.</div>
                </div>
                <div className="bg-white/90 border border-emerald-100/90 p-3.5 rounded-2xl shadow-2xs">
                  <div className="font-bold text-slate-900 text-xs mb-0.5">♻️ Recyclability</div>
                  <div className="text-[11px] text-slate-500">Nilai daur ulang sirkular di akhir masa pakai barang.</div>
                </div>
              </div>
            </div>

            {/* Live Comparison Card */}
            <div className="space-y-3.5">
              <div className="bg-white border-2 border-emerald-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 inline-block">
                      Pilihan Sirkular Unggulan
                    </span>
                    <h5 className="text-base font-bold text-slate-900 mt-1.5">Reusable Fabric Banner + Stand Frame</h5>
                    <p className="text-[11px] text-slate-500">Material polyester cuci ulang · Target 40+ event</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-600">87</div>
                    <div className="text-[9px] text-emerald-700 uppercase font-semibold">Circular Score</div>
                  </div>
                </div>
                <div className="w-full bg-emerald-100/80 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: '87%' }} />
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-800">
                  <span className="flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Direkomendasikan Sistem
                  </span>
                  <span className="font-medium text-emerald-700">Hemat 92% Limbah Material</span>
                </div>
              </div>

              <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full border border-rose-200 inline-block">
                      Pola Konvensional Sekali Pakai
                    </span>
                    <h5 className="text-base font-bold text-slate-900 mt-1.5">Single-use Vinyl PVC Flexi Banner</h5>
                    <p className="text-[11px] text-slate-500">Bahan plastik PVC sintetis · Sulit terurai ratusan tahun</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-rose-600">42</div>
                    <div className="text-[9px] text-rose-700 uppercase font-semibold">Circular Score</div>
                  </div>
                </div>
                <div className="w-full bg-rose-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-400 to-orange-400 h-full rounded-full" style={{ width: '42%' }} />
                </div>
                <div className="pt-1 text-[11px] text-rose-700 flex items-center gap-1 font-medium">
                  ⚠️ Menghasilkan limbah padat tidak terurai di TPA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flow Diagram */}
      <section id="flow" className="py-20 px-6 bg-[#F6FBF8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-sage mb-2">Alur Praktis Panitia</span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Alur End-to-End di EventLoop
            </h3>
            <p className="text-slate-600 text-sm max-w-xl mx-auto mt-2">Didesain praktis untuk panitia kegiatan mahasiswa dan pengelola perlengkapan kampus.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[
              { step: '01', title: 'Login / Daftar', desc: 'Akses akun mahasiswa resmi dengan OTP Outlook.', icon: '🔐' },
              { step: '02', title: 'Buat Event', desc: 'Tentukan nama acara, tanggal, kuota, & durasi.', icon: '📅' },
              { step: '03', title: 'Pilih Barang', desc: 'Pilih perlengkapan dari katalog berdasarkan Circular Score.', icon: '🛒' },
              { step: '04', title: 'Reservasi & QRIS', desc: 'Upload bukti transfer pembayaran untuk escrow admin.', icon: '📝' },
              { step: '05', title: 'Ambil di Lokasi', desc: 'Ambil di gudang kampus sesuai lokasi asal barang.', icon: '📦' },
              { step: '06', title: 'Gunakan di Event', desc: 'Perlengkapan aktif digunakan selama kegiatan berlangsung.', icon: '🎪' },
              { step: '07', title: 'Pulangkan Barang', desc: 'Kembalikan barang ke tempat asal & upload bukti foto.', icon: '🔄' },
              { step: '08', title: 'Dampak Tercatat', desc: 'Metrik limbah & circular score otomatis bertambah!', icon: '🌱' },
            ].map((f, idx) => (
              <div key={idx} className="card p-4 border-emerald-100/80 shadow-2xs hover:shadow-sm hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">{f.step}</span>
                </div>
                <h5 className="font-bold text-slate-900 text-xs mb-1">{f.title}</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model & Sustainability */}
      <section id="business-model" className="py-20 px-6 bg-white border-y border-emerald-100/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-sage mb-2">Model Keberlanjutan Mandiri</span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Bagaimana EventLoop Menghasilkan Nilai
            </h3>
            <p className="text-slate-600 text-sm max-w-xl mx-auto mt-2">Ekosistem mandiri yang membiayai perawatan perlengkapan kampus secara sirkular.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 border-emerald-100/90 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-xl mb-4 shadow-2xs">
                💵
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">1. Biaya Sewa Mikro Terjangkau</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Biaya sewa harian yang sangat terjangkau per event (70% lebih hemat daripada vendor luar).
              </p>
              <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                Organisasi hemat, platform mandiri secara operasional.
              </div>
            </div>

            <div className="card p-6 border-emerald-100/90 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-xl mb-4 shadow-2xs">
                🎫
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">2. Kolaborasi Organisasi Kampus</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Ormawa dapat meng-upload barang milik organisasinya sendiri dan memperoleh bagi hasil sewa setiap kali dipinjam.
              </p>
              <div className="text-[11px] text-teal-700 font-semibold bg-teal-50 p-2 rounded-xl border border-teal-100">
                Memberikan pendapatan dana kas bagi organisasi pemilik.
              </div>
            </div>

            <div className="card p-6 border-emerald-100/90 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center text-xl mb-4 shadow-2xs">
                🧰
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">3. Dana Perawatan Terpadu</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Alokasi dana pemeliharaan berkala agar perlengkapan tetap awet, bersih, dan prima hingga 50+ pemakaian.
              </p>
              <div className="text-[11px] text-green-700 font-semibold bg-green-50 p-2 rounded-xl border border-green-100">
                Prinsip sirkular: memperpanjang siklus hidup aset kampus.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section (Cozy Soft Renewable Card - No Harsh Dark Block) */}
      <section className="py-20 px-6 bg-[#F6FBF8]">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-50/95 via-green-50/80 to-teal-50/85 border border-emerald-200/80 rounded-3xl p-10 sm:p-14 shadow-xs text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-white/90 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200/60 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mulai Gerakan Sirkular Kampus</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Siap Mengubah Event Kampus Jadi Zero-Waste?
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
              Mulai dari satu kegiatan, hemat anggaran dan kurangi limbah perlengkapan acara kampusmu sekarang juga bersama EventLoop.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link 
                to={sessionUser ? targetDashboard : "/login?tab=signup"} 
                className="btn-primary text-xs sm:text-sm !py-3 !px-7 flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/15"
              >
                <span>{sessionUser ? 'Buka Dashboard' : 'Mulai Sekarang / Buat Akun'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to={sessionUser ? "/marketplace" : "/login"} 
                className="btn-secondary text-xs sm:text-sm !py-3 !px-7 flex items-center justify-center gap-2"
              >
                <span>Jelajahi Katalog Perlengkapan</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Bar (Clean, Soft Renewable Footer) */}
      <footer className="bg-white border-t border-emerald-100/90 text-slate-500 py-8 px-6 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-2xs">
              <Recycle className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Event<span className="text-emerald-600">Loop</span></span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-500">Circular Campus Platform</span>
          </div>
          <div className="text-slate-400 text-center sm:text-right">
            Proyek UAS CTI • Inovasi Circular Economy & Green Tech Kampus
          </div>
        </div>
      </footer>
    </div>
  )
}
