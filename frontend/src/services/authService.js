// ============================================================
// services/authService.js
// SEMUA ANGGOTA: Service untuk autentikasi (login/logout).
// Digunakan bersama oleh semua role.
// ============================================================

import api from './api'

// TODO: POST /api/auth/login
// Body: { email, password }
// Response: { token, user: { id, nama, email, role } }
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}
