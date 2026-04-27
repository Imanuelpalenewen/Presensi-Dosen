# 🎓 Sistem Presensi Dosen Berbasis QR Code + Geolocation — v2.0

Sistem manajemen kehadiran dosen yang aman dan efisien menggunakan teknologi QR Code dinamis dan validasi Geolocation.

---

## 👥 Tim Pengembangan

| Peran | Anggota | Tanggung Jawab |
| :--- | :--- | :--- |
| **🧑‍🏫 Dosen** | Anggota 1 | Fitur Utama Dosen, Laporan Kendala, & Integrasi Geolocation |
| **🛠️ Admin** | Anggota 2 | Manajemen Jadwal, Aktivasi Sesi, & Pusat Pesan |
| **📊 Warek 3** | Anggota 3 | Monitoring Dashboard & Rekapitulasi Laporan |

---

## 🏗️ Arsitektur Proyek

```text
sistem-presensi-dosen/
├── frontend/     # React.js (Vite + Tailwind CSS)
├── backend/      # Golang (Gin + GORM)
└── docs/         # Dokumentasi API & Desain Wireframe
```

---

## 🚀 Panduan Memulai (Setup)

Pastikan Anda memiliki software berikut terinstal:
- [Go](https://go.dev/dl/) (v1.21+)
- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://www.mysql.com/)

### 1. Persiapan Database
1. Buat database baru di MySQL dengan nama `presensi_dosen`.
2. Backend akan melakukan **Auto-Migrate** tabel saat pertama kali dijalankan.

### 2. Konfigurasi Backend
```bash
cd backend
# Buka file .env dan sesuaikan DB_PASSWORD Anda
go mod tidy
go run main.go
```

### 3. Konfigurasi Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Axios, Zustand (State Management)
- **Backend:** Golang, Gin Framework, GORM (ORM), JWT (Authentication)
- **Keamanan:** Bcrypt Hashing, Dynamic QR Token, Geolocation Validation (Haversine Formula)

---

## 🌿 Strategi Kolaborasi Git

Kami menggunakan alur kerja berbasis branch untuk menjaga kualitas kode:

- `main` : Kode stabil yang siap untuk produksi/demo.
- `dev` : Branch integrasi utama. Semua fitur digabung di sini sebelum ke `main`.
- `feat/dosen` : Pengembangan fitur khusus Dosen.
- `feat/admin` : Pengembangan fitur khusus Admin.
- `feat/warek` : Pengembangan fitur khusus Warek.

**Aturan Main:**
1. **DILARANG** push langsung ke branch `main` atau `dev`.
2. Selalu buat **Pull Request (PR)** dari branch fitur Anda ke branch `dev`.
3. Lakukan pengujian lokal sebelum meminta review.

---

## 📝 Catatan Tambahan
Jika menemui kendala saat menjalankan aplikasi, silakan cek log di terminal backend atau hubungi Anggota 1 sebagai lead integrasi.