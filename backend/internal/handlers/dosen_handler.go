// ============================================================
// internal/handlers/dosen_handler.go
// ✅ [ANGGOTA 1 - KAMU] Handler HTTP untuk semua endpoint Dosen.
//
// Endpoint yang harus diimplementasi:
//   GET  /api/dosen/sessions/active     → GetActiveSessions
//   POST /api/attendance/submit         → SubmitAttendance
//   GET  /api/dosen/attendance/history  → GetAttendanceHistory
//   POST /api/messages/send             → SendIssueMessage (lapor kendala)
// ============================================================

package handlers

import (
	"github.com/gin-gonic/gin"
	"sistem-presensi-dosen/internal/services"
	"sistem-presensi-dosen/internal/utils"
)

type DosenHandler struct {
	dosenService   *services.DosenService
	messageService *services.MessageService
}

func NewDosenHandler(dosenService *services.DosenService, messageService *services.MessageService) *DosenHandler {
	return &DosenHandler{
		dosenService:   dosenService,
		messageService: messageService,
	}
}

// GET /api/dosen/sessions/active
// Ambil semua sesi aktif hari ini milik dosen yang sedang login.
// Response: array sesi dengan info jadwal (MK, kelas, jam, lokasi, radius, expired_at)
func (h *DosenHandler) GetActiveSessions(c *gin.Context) {
	// TODO: Ambil dosenID dari JWT claims yang sudah disimpan middleware
	dosenID := c.GetUint("userID")

	// TODO: Panggil dosenService.GetActiveSessions(dosenID)
	sessions, err := h.dosenService.GetActiveSessions(dosenID)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil sesi aktif.")
		return
	}

	utils.OK(c, "Sesi aktif berhasil diambil.", sessions)
}

// POST /api/attendance/submit
// Body: { "session_id": 1, "latitude": -1.2345, "longitude": 124.5678 }
//
// Validasi berlapis yang harus dilakukan di service (urutan penting):
//   1. qr_token valid (session ada di DB)
//   2. Status session == 'active'
//   3. Session belum expired (expired_at > now)
//   4. Hari & jam sesuai jadwal
//   5. Dosen belum pernah submit di session ini (UNIQUE constraint)
//   6. Koordinat dosen dalam radius yang dikonfigurasi (Haversine)
//
// Response error menyertakan kode_error agar frontend bisa tampilkan pesan spesifik.
func (h *DosenHandler) SubmitAttendance(c *gin.Context) {
	dosenID := c.GetUint("userID")

	var req struct {
		SessionID uint    `json:"session_id" binding:"required"`
		Latitude  float64 `json:"latitude" binding:"required"`
		Longitude float64 `json:"longitude" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "session_id, latitude, dan longitude wajib diisi.")
		return
	}

	// TODO: Panggil dosenService.SubmitAttendance — service menjalankan semua validasi
	result, err := h.dosenService.SubmitAttendance(dosenID, req.SessionID, req.Latitude, req.Longitude)
	if err != nil {
		// TODO: Cek tipe error untuk return kode_error yang tepat ke frontend
		// Gunakan custom error type dari services/errors.go
		c.JSON(err.(*services.AttendanceError).HTTPStatus, err)
		return
	}

	utils.OK(c, "Absensi berhasil dicatat.", result)
}

// GET /api/dosen/attendance/history?bulan=2024-04
// Riwayat absensi dosen yang sedang login.
// Query param 'bulan' format YYYY-MM (opsional, default: bulan ini)
func (h *DosenHandler) GetAttendanceHistory(c *gin.Context) {
	dosenID := c.GetUint("userID")
	bulan := c.DefaultQuery("bulan", "") // "" → service default ke bulan ini

	// TODO: Panggil dosenService.GetAttendanceHistory(dosenID, bulan)
	history, err := h.dosenService.GetAttendanceHistory(dosenID, bulan)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil riwayat absensi.")
		return
	}

	utils.OK(c, "Riwayat absensi berhasil diambil.", history)
}

// POST /api/messages/send
// Dosen mengirim pesan kendala ke admin ketika tidak bisa absen.
// Body: { "judul": "...", "isi": "...", "session_id": 1 (opsional) }
// Pesan langsung masuk ke inbox admin (MessageInboxPage).
func (h *DosenHandler) SendIssueMessage(c *gin.Context) {
	dosenID := c.GetUint("userID")

	var req struct {
		Judul     string `json:"judul" binding:"required"`
		Isi       string `json:"isi" binding:"required"`
		SessionID *uint  `json:"session_id"` // pointer = opsional
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Judul dan isi pesan wajib diisi.")
		return
	}

	// TODO: Panggil messageService.SendFromDosen
	msg, err := h.messageService.SendFromDosen(dosenID, req.Judul, req.Isi, req.SessionID)
	if err != nil {
		utils.InternalError(c, "Gagal mengirim pesan. Coba lagi.")
		return
	}

	utils.Created(c, "Pesan kendala berhasil dikirim ke admin.", msg)
}
