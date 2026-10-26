import { Link } from 'react-router-dom'
import { Recycle, ArrowRight, Package, BarChart3, Shield, Zap, Sparkles, CheckCircle2, ChevronRight, Layers } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-green-100 selection:text-green-800">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">EventLoop</h1>
              <p className="text-[9px] text-green-600 font-bold tracking-widest uppercase">Reuse · Rent · Return · Repeat</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#masalah" className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">Masalah & Solusi</a>
            <a href="#flow" className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">Flow Aplikasi</a>
            <a href="#circular-score" className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">Circular Score</a>
            <a href="#business-model" className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">Model Bisnis</a>
            <Link to="/marketplace" className="text-sm text-green-700 font-semibold hover:text-green-800 transition-colors">
              Marketplace
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-block text-sm font-semibold text-gray-700 hover:text-green-600 px-4 py-2">
              Masuk
            </Link>
            <Link to="/dashboard" className="btn-primary text-sm !py-2.5 !px-5 flex items-center gap-2">
              Buka App
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-b from-green-50/50 via-white to-white">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-green-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-green-100/80 border border-green-200 text-green-800 text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-green-600" />
            Circular Event Management Platform for Campus
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.15]">
            Reuse. Rent.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
              Return. Repeat.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Platform sirkular kampus untuk meminjam, menyewakan, dan mengelola perlengkapan kegiatan mahasiswa. Stop sekali pakai, wujudkan kampus minim sampah & hemat anggaran!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/marketplace" className="btn-primary text-base !py-3.5 !px-8 flex items-center justify-center gap-2 w-full sm:w-auto shadow-green-600/25">
              <Package className="w-5 h-5" />
              Explore Equipment
            </Link>
            <Link to="/create-event" className="btn-secondary text-base !py-3.5 !px-8 flex items-center justify-center gap-2 w-full sm:w-auto">
              Buat Event & Kebutuhan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Impact Stats Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 max-w-3xl mx-auto">
            <div className="card p-6 border-green-100/80 bg-white/80 backdrop-blur">
              <div className="text-3xl mb-1">♻️</div>
              <div className="text-3xl font-black text-gray-900">1,284</div>
              <div className="text-xs text-green-700 font-bold uppercase tracking-wider mt-1">Items Reused</div>
              <div className="text-xs text-gray-500 mt-1">Peralatan digunakan berulang</div>
            </div>
            <div className="card p-6 border-green-100/80 bg-white/80 backdrop-blur">
              <div className="text-3xl mb-1">🌱</div>
              <div className="text-3xl font-black text-gray-900">186.5 kg</div>
              <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mt-1">Material Waste Avoided</div>
              <div className="text-xs text-gray-500 mt-1">Limbah material dicegah</div>
            </div>
            <div className="card p-6 border-green-100/80 bg-white/80 backdrop-blur">
              <div className="text-3xl mb-1">🎪</div>
              <div className="text-3xl font-black text-gray-900">42</div>
              <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mt-1">Events Supported</div>
              <div className="text-xs text-gray-500 mt-1">Seminar, Expo, Lomba & UKM</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Circular Paradigm */}
      <section id="masalah" className="py-20 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Pilar Solusi</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Mengubah Pola Linier Menjadi Sirkular</h3>
            <p className="text-gray-600 max-w-2xl mx-auto mt-3">
              Organisasi sering membeli barang baru tiap ada event, lalu menumpuk di gudang atau berakhir di TPA.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Linear Old Way */}
            <div className="bg-red-50/60 border border-red-200 rounded-3xl p-8 relative">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                Pola Lama (Linier)
              </div>
              <h4 className="text-xl font-bold text-red-950 mb-3">Beli → Pakai → Buang / Simpan Rusak</h4>
              <p className="text-sm text-red-800 leading-relaxed mb-6">
                Organisasi membeli banner PVC, backdrop sekali pakai, perlengkapan panggung terpisah. Biaya membengkak hingga puluhan juta per semester, limbah plastik dan kayu menumpuk.
              </p>
              <div className="space-y-3 font-mono text-xs bg-white/80 p-4 rounded-xl border border-red-200 text-red-700">
                <div>❌ Backdrop: Rp500.000 (1x pakai)</div>
                <div>❌ Standing Banner: Rp250.000</div>
                <div>❌ Meja/Display sewa luar: Rp350.000</div>
                <div className="pt-2 border-t border-red-200 font-bold text-red-900">Total Pemborosan: &gt; Rp1.500.000 / event</div>
              </div>
            </div>

            {/* Circular EventLoop Way */}
            <div className="bg-green-50/80 border-2 border-green-300 rounded-3xl p-8 relative shadow-lg shadow-green-600/5">
              <div className="inline-flex items-center gap-2 bg-green-200 text-green-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                Pola Baru (EventLoop)
              </div>
              <h4 className="text-xl font-bold text-green-950 mb-3">Buat → Pakai → Kembalikan → Repeat ♻️</h4>
              <p className="text-sm text-green-800 leading-relaxed mb-6">
                Organisasi meminjam modular equipment dengan standar circular score. Barang dibersihkan, diperiksa, dan siap digunakan oleh kepanitiaan berikutnya.
              </p>
              <div className="space-y-3 font-mono text-xs bg-white/90 p-4 rounded-xl border border-green-200 text-green-800">
                <div>✅ Modular Frame: Rp50.000 (reusable 50x)</div>
                <div>✅ Reusable Fabric Banner: Rp25.000</div>
                <div>✅ Campus Inventory Shared Desk: Rp20.000</div>
                <div className="pt-2 border-t border-green-200 font-bold text-green-900">Hemat Biaya: 75% - 85% + Zero Waste!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Components */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Bukan Sekadar Rental</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">3 Komponen Utama Platform</h3>
            <p className="text-gray-600 max-w-xl mx-auto mt-2">Didesain khusus untuk menjawab inovasi Green Tech dan Circular Economy.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-7 hover:border-green-300 group transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-700 mb-6 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">1. Circular Marketplace</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Katalog equipment modular terkurasi: booth display, fabric banner, standing frame, lighting LED, sound system, hingga reusable cup ramah lingkungan.
              </p>
              <div className="text-xs font-semibold text-green-700 bg-green-50 py-1.5 px-3 rounded-lg inline-block">
                Tersedia 12+ kategori kampus
              </div>
            </div>

            <div className="card p-7 hover:border-blue-300 group transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">2. Campus Inventory</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Sistem tracking real-time 3 sumber barang: Campus Inventory, BEM/UKM Organization Inventory, dan Partner Vendor dengan verifikasi foto fisik.
              </p>
              <div className="text-xs font-semibold text-blue-700 bg-blue-50 py-1.5 px-3 rounded-lg inline-block">
                Photo Inspection & Timestamp Check
              </div>
            </div>

            <div className="card p-7 hover:border-emerald-300 group transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">3. Circular Impact Analytics</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Dashboard metrik nyata: estimasi limbah dicegah (kg), biaya pembelian dihindari (Rp), emisi CO₂ dicegah, dan circular score tiap organisasi.
              </p>
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block">
                Kalkulasi Metrik Otomatis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Circular Score Feature Deep Dive */}
      <section id="circular-score" className="py-20 px-6 bg-gradient-to-br from-emerald-900 via-green-900 to-teal-950 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                <Zap className="w-4 h-4" />
                Fitur Unggulan Green Tech
              </div>
              <h3 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
                Circular Score System (0 - 100)
              </h3>
              <p className="text-green-100/90 text-base sm:text-lg leading-relaxed mb-8">
                Bukan sekadar meminjam, EventLoop secara cerdas memberi bobot circular score untuk setiap barang berdasarkan 5 indikator ilmiah:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <div className="font-bold text-white text-sm mb-1">🔁 Reuse Frequency</div>
                  <div className="text-xs text-green-200">Berapa kali barang sudah & mampu dipakai ulang.</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <div className="font-bold text-white text-sm mb-1">🌿 Eco Material</div>
                  <div className="text-xs text-green-200">Aluminium, kain polyester, kayu ramah lingkungan vs PVC.</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <div className="font-bold text-white text-sm mb-1">🔧 Repairability</div>
                  <div className="text-xs text-green-200">Kemudahan komponen diganti tanpa buang 1 set.</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <div className="font-bold text-white text-sm mb-1">♻️ Recyclability</div>
                  <div className="text-xs text-green-200">Nilai daur ulang di akhir siklus hidup barang.</div>
                </div>
              </div>
            </div>

            {/* Live Comparison Card */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-green-300">Pilihan Sirkular Unggulan</span>
                    <h5 className="text-xl font-bold text-white mt-1">Reusable Fabric Banner + Stand Frame</h5>
                    <p className="text-xs text-green-200">Material polyester cuci ulang · Target 40+ event</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-green-400">87</div>
                    <div className="text-[10px] text-green-200 uppercase font-semibold">Circular Score</div>
                  </div>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-300 h-full rounded-full" style={{ width: '87%' }} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-green-200">
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> Direkomendasikan Sistem
                  </span>
                  <span>Hemat 92% Limbah</span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-300">Pola Konvensional Sekali Pakai</span>
                    <h5 className="text-xl font-bold text-white mt-1">Single-use Vinyl PVC Flexi Banner</h5>
                    <p className="text-xs text-gray-300">Bahan plastik PVC sintetis · Sulit terurai ratusan tahun</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-red-400">42</div>
                    <div className="text-[10px] text-red-200 uppercase font-semibold">Circular Score</div>
                  </div>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-orange-400 h-full rounded-full" style={{ width: '42%' }} />
                </div>
                <div className="mt-4 text-xs text-red-300 flex items-center gap-1 font-semibold">
                  ⚠️ Menghasilkan limbah padat tidak terurai
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flow Diagram */}
      <section id="flow" className="py-20 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">User Journey</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Alur End-to-End di EventLoop</h3>
            <p className="text-gray-600 max-w-xl mx-auto mt-2">Didesain praktis untuk panitia event mahasiswa & tim sarana kampus.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Login & Profil', desc: 'Akses akun organisasi / BEM / UKM kampus.', icon: '🔐' },
              { step: '02', title: 'Create Event', desc: 'Tentukan nama acara, tanggal, kuota, & kebutuhan.', icon: '📅' },
              { step: '03', title: 'Pilih Equipment', desc: 'Filter barang berdasarkan Circular Score & kuota.', icon: '🛒' },
              { step: '04', title: 'Reserve & Checkout', desc: 'Konfirmasi sewa dengan estimasi penghematan biaya.', icon: '📝' },
              { step: '05', title: 'Pick Up & Verifikasi', desc: 'Ambil di storage kampus dan pastikan kelengkapan fisik.', icon: '📦' },
              { step: '06', title: 'Use at Event', desc: 'Perlengkapan aktif digunakan selama kegiatan.', icon: '🎪' },
              { step: '07', title: 'Return & Inspect', desc: 'Kembalikan barang, upload foto kondisi & rak penempatan.', icon: '🔄' },
              { step: '08', title: 'Impact Recorded', desc: 'Metrik limbah & circular score otomatis bertambah!', icon: '🌱' },
            ].map((f, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-md">{f.step}</span>
                </div>
                <h5 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h5>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model & Sustainability */}
      <section id="business-model" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Model Bisnis Berkelanjutan</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Bagaimana EventLoop Menghasilkan Nilai</h3>
            <p className="text-gray-600 max-w-xl mx-auto mt-2">Bukan sekadar iklan, tapi ekosistem ekonomi mandiri yang membiayai perawatannya sendiri.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-7 border-2 border-green-100 hover:border-green-300 transition-colors">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 font-bold text-xl mb-5">
                💵
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">1. Micro Rental Fee</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Biaya sewa mikro yang sangat terjangkau per event (contoh: Booth Rp50.000/event, Banner Frame Rp15.000/event). Tetap 70% lebih murah dari vendor luar.
              </p>
              <div className="text-xs text-gray-500">
                Organisasi hemat, platform dapat pemasukan operasional.
              </div>
            </div>

            <div className="card p-7 border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 font-bold text-xl mb-5">
                🎫
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">2. Campus Membership</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Paket langganan per semester untuk BEM fakultas / himpunan besar dengan akses prioritas booking dan diskon sewa hingga 40%.
              </p>
              <div className="text-xs text-gray-500">
                Memberikan recurring revenue yang stabil untuk platform.
              </div>
            </div>

            <div className="card p-7 border-2 border-purple-100 hover:border-purple-300 transition-colors">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-700 font-bold text-xl mb-5">
                🧰
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">3. Maintenance Pool Fund</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                15% dari setiap biaya rental dialokasikan langsung ke dana pemeliharaan (cleaning, repair frame, ganti baut) agar barang tetap awet hingga 50+ event.
              </p>
              <div className="text-xs text-gray-500">
                Prinsip sirkular: menjaga siklus hidup barang semaksimal mungkin.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-600 to-emerald-700 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Siap Mengubah Event Kampus Jadi Zero-Waste?
          </h3>
          <p className="text-green-100 text-base sm:text-lg mb-8 leading-relaxed">
            Mulai dari satu event, hemat jutaan rupiah dan kurangi ratusan kilogram sampah perlengkapan acara kampusmu sekarang.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="bg-white text-green-800 font-bold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors shadow-lg shadow-black/10">
              Masuk Dashboard Demo
            </Link>
            <Link to="/marketplace" className="bg-green-800/80 hover:bg-green-800 text-white font-semibold px-8 py-3.5 rounded-xl border border-green-400/40 transition-colors">
              Lihat Marketplace Barang
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Bar */}
      <footer className="bg-gray-950 text-gray-400 py-10 px-6 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Recycle className="w-5 h-5 text-green-500" />
            <span className="font-bold text-white">EventLoop</span>
            <span>— Circular Event Management Platform for Campus</span>
          </div>
          <div>
            Proyek UAS CTI • Inovasi Circular Economy & Green Tech Kampus
          </div>
        </div>
      </footer>
    </div>
  )
}