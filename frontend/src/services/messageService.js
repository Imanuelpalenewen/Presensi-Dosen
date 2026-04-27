// ============================================================
// services/messageService.js
// ✅ [ANGGOTA 1 - KAMU] Kirim pesan kendala ke admin.
// ✅ [ANGGOTA 2]         Ambil dan tandai pesan dari dosen.
// ============================================================

import api from './api'

// ─── Dosen: Kirim pesan kendala ke admin ─────────────────────
// TODO: POST /api/messages/send
// Body: { judul, isi, session_id (opsional) }
// Gunakan ketika dosen tidak bisa record kehadiran karena kendala
// (GPS mati, session expired, dll)
// Response: { id, status: 'sent', created_at }
export const sendIssueToAdmin = async ({ judul, isi, sessionId }) => {
  const response = await api.post('/messages/send', {
    judul,
    isi,
    session_id: sessionId || null,
  })
  return response.data
}

// ─── Admin: Ambil semua pesan masuk dari dosen ───────────────
// TODO: GET /api/admin/messages?status=unread
// Response: array of { id, dosen_nama, judul, isi, session_id, status, created_at }
export const getAdminMessages = async (status = '') => {
  const response = await api.get('/admin/messages', { params: { status } })
  return response.data
}

// ─── Admin: Tandai pesan sebagai sudah dibaca ────────────────
// TODO: PATCH /api/admin/messages/:id/read
// Response: { id, status: 'read' }
export const markMessageAsRead = async (messageId) => {
  const response = await api.patch(`/admin/messages/${messageId}/read`)
  return response.data
}
