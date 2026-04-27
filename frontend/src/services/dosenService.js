// ============================================================
// services/dosenService.js
// ✅ [ANGGOTA 1 - KAMU] Semua API call khusus fitur Dosen.
// ============================================================

import api from './api'

// ─── F-10: Ambil sesi aktif milik dosen yang sedang login ───
// TODO: GET /api/dosen/sessions/active
// Response: { id, mata_kuliah, kelas, jam_mulai, jam_selesai, lokasi_nama, radius_meter, qr_token }
export const getActiveSessions = async () => {
  const response = await api.get('/dosen/sessions/active')
  return response.data
}

// ─── F-11: Submit absensi dengan koordinat GPS ───────────────
// TODO: POST /api/attendance/submit
// Body: { session_id, latitude, longitude }
// Response sukses: { status: 'success', jam_absen, jarak_meter, pesan }
// Response gagal:  { status: 'error', kode_error, pesan, jarak_aktual, radius_valid }
// Kode error yang mungkin: TOKEN_INVALID, SESSION_CLOSED, SESSION_EXPIRED,
//   SCHEDULE_MISMATCH, ALREADY_SUBMITTED, OUT_OF_RADIUS
export const submitAttendance = async (sessionId, latitude, longitude) => {
  const response = await api.post('/attendance/submit', {
    session_id: sessionId,
    latitude,
    longitude,
  })
  return response.data
}

// ─── F-12: Ambil riwayat absensi dosen ───────────────────────
// TODO: GET /api/dosen/attendance/history?bulan=2024-01
// Response: array of { tanggal, mata_kuliah, kelas, jam_absen, jarak_meter, status }
export const getAttendanceHistory = async (bulan) => {
  const response = await api.get('/dosen/attendance/history', {
    params: { bulan },
  })
  return response.data
}
