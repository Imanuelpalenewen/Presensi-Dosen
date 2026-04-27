// ============================================================
// services/adminService.js
// ✅ [ANGGOTA 2 - ADMIN] Semua API call khusus fitur Admin.
// ============================================================

import api from './api'

// ─── Jadwal: CRUD ────────────────────────────────────────────
// TODO: GET /api/admin/schedules — Ambil semua jadwal semester
export const getAllSchedules = async (filters = {}) =>
  (await api.get('/admin/schedules', { params: filters })).data

// TODO: POST /api/admin/schedules — Tambah jadwal baru
// Body: { dosen_id, mata_kuliah, hari, jam_mulai, jam_selesai, kelas,
//          semester, lokasi_lat, lokasi_lng, lokasi_nama, radius_meter }
export const createSchedule = async (payload) =>
  (await api.post('/admin/schedules', payload)).data

// TODO: PUT /api/admin/schedules/:id — Edit jadwal
export const updateSchedule = async (id, payload) =>
  (await api.put(`/admin/schedules/${id}`, payload)).data

// TODO: PATCH /api/admin/schedules/:id/location — Update koordinat & radius saja
export const updateScheduleLocation = async (id, payload) =>
  (await api.patch(`/admin/schedules/${id}/location`, payload)).data

// TODO: DELETE /api/admin/schedules/:id — Hapus jadwal
export const deleteSchedule = async (id) =>
  (await api.delete(`/admin/schedules/${id}`)).data

// ─── Jadwal Hari Ini ─────────────────────────────────────────
// TODO: GET /api/admin/schedules/today — Jadwal hari ini dengan status sesi
export const getTodaySchedules = async () =>
  (await api.get('/admin/schedules/today')).data

// ─── Session: Aktivasi dan Manajemen ─────────────────────────
// TODO: POST /api/admin/sessions — Aktifkan sesi untuk jadwal tertentu
// Body: { schedule_id }
// Response: { id, qr_token, expired_at, shareable_link }
export const activateSession = async (scheduleId) =>
  (await api.post('/admin/sessions', { schedule_id: scheduleId })).data

// TODO: PATCH /api/admin/sessions/:id/close — Tutup sesi manual
export const closeSession = async (sessionId) =>
  (await api.patch(`/admin/sessions/${sessionId}/close`)).data

// ─── Rekap Absensi ───────────────────────────────────────────
// TODO: GET /api/admin/attendance/recap — Rekap kehadiran semua dosen
// Params: { bulan } opsional
export const getAttendanceRecap = async (params = {}) =>
  (await api.get('/admin/attendance/recap', { params })).data

// TODO: GET /api/admin/attendance/recap/:dosen_id — Detail per dosen
export const getDosenAttendanceDetail = async (dosenId, params = {}) =>
  (await api.get(`/admin/attendance/recap/${dosenId}`, { params })).data

// ─── Dosen list (untuk dropdown tambah jadwal) ───────────────
// TODO: GET /api/admin/users?role=dosen
export const getDosenList = async () =>
  (await api.get('/admin/users', { params: { role: 'dosen' } })).data
