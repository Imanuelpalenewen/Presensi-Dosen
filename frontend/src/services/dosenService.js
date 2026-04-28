// services/dosenService.js
import api from './api';

const dosenService = {
  // ── Session ──────────────────────────────────────────────────────────────
  /**
   * Ambil sesi aktif milik dosen yang sedang login.
   * GET /dosen/sessions/active
   */
  getActiveSession: () => api.get('/dosen/sessions/active'),

  // ── Absensi ───────────────────────────────────────────────────────────────
  /**
   * Kirim absensi dengan validasi geolocation.
   * POST /attendance/submit
   * Body: { session_id, latitude, longitude }
   */
  submitAttendance: (data) => api.post('/attendance/submit', data),

  /**
   * Kirim absensi via token QR manual.
   * POST /attendance/submit-token
   * Body: { token, latitude, longitude }
   */
  submitAttendanceByToken: (data) => api.post('/attendance/submit-token', data),

  // ── Riwayat ───────────────────────────────────────────────────────────────
  /**
   * Ambil riwayat absensi dosen.
   * GET /dosen/attendance/history?filter=all|month|semester
   */
  getAttendanceHistory: (filter = 'all') =>
    api.get('/dosen/attendance/history', { params: { filter } }),

  /**
   * Ambil ringkasan statistik absensi.
   * GET /dosen/attendance/stats
   */
  getAttendanceStats: () => api.get('/dosen/attendance/stats'),

  // ── Profil ────────────────────────────────────────────────────────────────
  /**
   * Ambil profil lengkap dosen dengan statistik kehadiran.
   * GET /dosen/profile
   */
  getProfile: () => api.get('/dosen/profile'),

  /**
   * Ubah password.
   * PATCH /dosen/profile/password
   * Body: { current_password, new_password }
   */
  changePassword: (data) => api.patch('/dosen/profile/password', data),

  // ── Pesan / Laporan ───────────────────────────────────────────────────
  /**
   * Kirim laporan kendala absensi ke admin.
   * POST /dosen/messages
   * Body: { subject, body, session_id? }
   */
  sendMessage: (data) => api.post('/dosen/messages', data),
};

export default dosenService;
