// ============================================================
// services/warekService.js
// ✅ [ANGGOTA 3 - WAREK 3] Semua API call khusus fitur Warek 3.
// Semua endpoint ini READ-ONLY — tidak ada aksi apapun.
// ============================================================

import api from './api'

// TODO: GET /api/warek/dashboard — Statistik ringkasan kehadiran
// Response: { total_dosen, rata_kehadiran_persen, total_pertemuan_bulan_ini }
export const getDashboardStats = async () =>
  (await api.get('/warek/dashboard')).data

// TODO: GET /api/warek/attendance/recap — Rekap semua dosen
// Params: { dari_tanggal, sampai_tanggal, prodi } (semua opsional)
export const getFullRecap = async (params = {}) =>
  (await api.get('/warek/attendance/recap', { params })).data
