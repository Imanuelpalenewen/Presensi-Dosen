# 📡 Dokumentasi API — Sistem Presensi QR

Base URL: `http://localhost:8080/api`

Semua request yang dilindungi wajib menyertakan header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Auth (Semua Role)

### POST `/auth/login`
Login untuk semua role.

**Body:**
```json
{ "email": "budi@kampus.ac.id", "password": "password123" }
```

**Response Sukses:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": 1, "nama": "Dr. Budi", "email": "budi@kampus.ac.id", "role": "dosen" }
  }
}
```

---

## 🧑‍🏫 Dosen [ANGGOTA 1]

### GET `/dosen/sessions/active`
Ambil sesi aktif hari ini milik dosen yang login.

### POST `/attendance/submit`
Submit absensi dengan koordinat GPS.

**Body:**
```json
{ "session_id": 1, "latitude": 1.4748, "longitude": 124.8421 }
```

**Response Error (OUT_OF_RADIUS):**
```json
{
  "status": "error",
  "kode_error": "OUT_OF_RADIUS",
  "pesan": "Kamu berada di luar area kelas...",
  "jarak_aktual": 250,
  "radius_valid": 100
}
```

**Kode Error Lainnya:** `TOKEN_INVALID`, `SESSION_CLOSED`, `SESSION_EXPIRED`, `SCHEDULE_MISMATCH`, `ALREADY_SUBMITTED`

### GET `/dosen/attendance/history?bulan=2024-04`
Riwayat absensi dosen per bulan.

### POST `/messages/send`
Kirim laporan kendala ke admin.

**Body:**
```json
{ "judul": "[Kendala] GPS tidak aktif", "isi": "Saat mencoba absen...", "session_id": 1 }
```

---

## 🛠️ Admin [ANGGOTA 2]

### GET `/admin/schedules`
Semua jadwal. Query params: `hari`, `dosen_id`, `mata_kuliah`

### POST `/admin/schedules`
Tambah jadwal baru.

### PUT `/admin/schedules/:id`
Edit jadwal.

### PATCH `/admin/schedules/:id/location`
Update koordinat & radius kelas saja.

### DELETE `/admin/schedules/:id`
Hapus jadwal (gagal jika ada sesi aktif).

### GET `/admin/schedules/today`
Jadwal hari ini + status sesi.

### POST `/admin/sessions`
Aktifkan sesi. **Body:** `{ "schedule_id": 1 }`

### PATCH `/admin/sessions/:id/close`
Tutup sesi.

### GET `/admin/attendance/recap?bulan=2024-04`
Rekap kehadiran semua dosen.

### GET `/admin/attendance/recap/:dosen_id`
Detail absensi satu dosen.

### GET `/admin/users?role=dosen`
Daftar user berdasarkan role.

### GET `/admin/messages?status=unread`
Inbox pesan kendala dari dosen.

### PATCH `/admin/messages/:id/read`
Tandai pesan sudah dibaca.

---

## 📊 Warek 3 [ANGGOTA 3]

### GET `/warek/dashboard`
Statistik ringkasan: total dosen, rata kehadiran, total pertemuan bulan ini.

### GET `/warek/attendance/recap`
Rekap semua dosen. Query params: `dari_tanggal`, `sampai_tanggal`, `prodi`

---

## ⚠️ Format Error Umum

```json
{
  "status": "error",
  "pesan": "Deskripsi error dalam Bahasa Indonesia"
}
```

HTTP Status yang digunakan:
- `200` — OK
- `201` — Created
- `400` — Bad Request (validasi gagal)
- `401` — Unauthorized (token tidak ada / tidak valid)
- `403` — Forbidden (role tidak sesuai)
- `404` — Not Found
- `409` — Conflict (sudah submit absen)
- `500` — Internal Server Error
