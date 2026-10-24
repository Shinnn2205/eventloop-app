# ♻️ EVENTLOOP — Circular Event Management Platform for Campus
> **Tagline:** *Reuse. Rent. Return. Repeat.*

Platform digital kampus untuk berbagi, menyewa, menggunakan kembali, dan mengelola perlengkapan kegiatan mahasiswa demi mendukung **Green Tech & Circular Economy**.

---

## 🚀 Cara Menjalankan Website (Local Development)

Proyek ini dibuat menggunakan **React 18 + Vite + Tailwind CSS + Lucide Icons + React Router DOM**.

### 1. Buka Terminal / PowerShell
Masuk ke direktori proyek:
```bash
cd "D:\UAS CTI\Koding\eventloop"
```

### 2. Jalankan Server Development
```bash
npm run dev
```

> **Catatan Windows PowerShell:**  
> Jika muncul pesan `npm.ps1 cannot be loaded because running scripts is disabled`, jalankan via CMD atau tambahkan bypass:
> ```bash
> cmd /c "npm run dev"
> ```
> atau
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> npm run dev
> ```

Buka browser dan akses alamat lokal yang muncul di terminal (biasanya **http://localhost:5173**).

---

## 📱 Daftar Halaman & User Journey (Sesuai Konsep UAS CTI)

Aplikasi telah dilengkapi dengan navigasi interaktif yang mencakup seluruh alur prototype:

1. **Screen 1 — Landing Page (`/`)**
   - Hero Section dengan statistik dampak: *1,284 items reused*, *186.5 kg waste avoided*, *42 events supported*.
   - Perbandingan pola linier (Beli → Buang) vs pola sirkular EventLoop (Reuse → Repeat).
   - Penjelasan **3 Komponen Utama** (Marketplace, Inventory, Impact Dashboard).
   - Fitur unggulan **Circular Score System (0–100)**.
   - Penjelasan **3 Sumber Inventory** (Campus, Organization, Partner).
   - **Business Model**: Micro Rental Fee, Campus Membership, & Maintenance Pool Fund.

2. **Screen 2 — Login SSO Kampus (`/login`)**
   - Single Sign-On untuk organisasi mahasiswa (BEM, Himpunan, UKM) & Admin Sarpras.
   - Pilihan demo instan satu klik.

3. **Screen 3 — Dashboard Organisasi (`/dashboard`)**
   - Ucapan sapaan personal: *"Good afternoon, SISO 👋"*.
   - Widget metrik personal: *38 items reused*, *Rp2.4M cost avoided*, *18.5 kg waste avoided*, *Circular Score 92/100*.
   - Upcoming Event Card: **INNOFAIR 2026 (18 September 2026)** dengan status *12 Items Reserved*.
   - Quick Actions & Status 3 Sumber Inventory.

4. **Screen 4 — Circular Equipment Marketplace (`/marketplace`)**
   - Filter Kategori: **Booth | Signage | Furniture | Decoration | Electronics | Others**.
   - Filter berdasarkan skor keberlanjutan (*Circular Score 80+, 90+*).
   - Pencarian real-time dan kartu equipment dengan indikator reusable frequency (*Reusable 20+ times*), harga sewa per event, dan tombol *Reserve*.

5. **Screen 5 — Equipment Detail (`/equipment/:id`)**
   - Detail spesifikasi: Quantity tersedia, ukuran, material, dan kepemilikan barang.
   - Evaluasi metrik **Circular Score** (Reuse frequency, Eco material, Repairability, Recyclability).
   - Riwayat pemakaian di event-event kampus sebelumnya (*Career Expo BEM, Dies Natalis, dll.*).
   - Tombol reservasi barang dan penyesuaian quantity.

6. **Screen 6 — Create Event Wizard (`/create-event`)**
   - Formulir input event: Nama Acara, Tanggal, Tipe Event, Lokasi Kampus, Estimasi Peserta.
   - Fitur **Generate Equipment List Otomatis** berbasis AI/sistem sirkular kampus.
   - Estimasi biaya sewa mikro vs biaya beli baru.

7. **Screen 7 — Reservation & Keranjang (`/reservation`)**
   - Tabel ringkasan pemesanan barang per event (*Booth, Banner Frame, Meja, Reusable Cup*).
   - Perhitungan total biaya rental vs estimasi biaya pembelian yang dihindari (*Cost Avoided*).
   - Tombol konfirmasi reservasi dan penerbitan kode booking / jadwal pick-up di warehouse kampus.

8. **Screen 8 — Return & Inspection (`/return`)**
   - Simulator pemindaian QR Code barcode barang (*Booth #B023*).
   - Checklist verifikasi kualitas admin Sarpras (*Good condition, Complete, Cleaned, Ready for next event*).
   - Konfirmasi pengembalian barang dan pembaruan status barang menjadi **AVAILABLE AGAIN ♻️**.

9. **Screen 9 — Circular Impact Dashboard (`/impact`)**
   - KPI Lingkungan & Ekonomi Kampus: Total barang digunakan ulang, sampah dihindari, CO₂ dicegah, dan penghematan dana kampus.
   - Grafik batang tren adopsi bulanan (Mei - Oktober 2026).
   - Papan peringkat organisasi ter-sirkular (*Top Circular Organizations Leaderboard: BEM, SISO, HMTI*).
   - Metodologi perhitungan dampak ilmiah untuk bahan presentasi dosen.

---

## 📂 Struktur Folder Proyek

```
eventloop/
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                     # Router & navigasi utama
│   ├── index.css                   # Custom utility & Tailwind styles
│   ├── components/
│   │   └── Layout.jsx              # Responsive Sidebar & Navbar shell
│   ├── data/
│   │   └── mockData.js             # Data equipment, kategori, & analitik dampak
│   └── pages/
│       ├── LandingPage.jsx         # Screen 1: Beranda & Edukasi Sirkular
│       ├── LoginPage.jsx           # Screen 2: Login SSO
│       ├── Dashboard.jsx           # Screen 3: Dashboard SISO
│       ├── Marketplace.jsx         # Screen 4: Katalog & Filter Barang
│       ├── EquipmentDetail.jsx     # Screen 5: Detail & Circular Score
│       ├── CreateEvent.jsx         # Screen 6: Wizard Event & Generate List
│       ├── Reservation.jsx         # Screen 7: Checkout & Ringkasan Sewa
│       ├── ReturnPage.jsx          # Screen 8: QR Return & Inspeksi
│       └── ImpactDashboard.jsx     # Screen 9: Analitik Dampak Green Tech
└── README.md
```

---

## 🎯 Poin Kunci untuk Presentasi Dosen (UAS CTI)

Saat presentasi atau mendemokan aplikasi ini, tekankan **4 nilai pembeda utama**:
1. **Bukan Sekadar Rental, tapi Green Tech Sirkular:**  
   Setiap barang dihitung nilai **Circular Score (0–100)** berdasarkan bahan, kemudahan perbaikan (*repairability*), dan daya tahannya.
2. **3 Sumber Inventory:**  
   Mendukung pemanfaatan barang milik kampus (*Campus Inventory*), barang menganggur milik organisasi lain (*Organization Sharing*), dan vendor rekanan (*Partner*).
3. **Circular Impact Dashboard:**  
   Memberikan bukti data nyata (*data-driven sustainability*) berupa kilogram sampah yang dicegah (*waste avoided*) dan rupiah yang dihemat (*cost avoided*).
4. **Maintenance Pool Fund:**  
   Sebagian biaya sewa mikro langsung dialokasikan untuk pembersihan dan perbaikan agar barang bertahan puluhan kali pakai.
