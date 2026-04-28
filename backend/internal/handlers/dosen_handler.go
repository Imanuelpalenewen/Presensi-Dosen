// ============================================================
// internal/handlers/dosen_handler.go
// ✅ [ANGGOTA 1] Handler HTTP untuk semua endpoint Dosen.
//
// Endpoint:
//   GET  /api/dosen/sessions/active    → GetActiveSessions
//   POST /api/attendance/submit        → SubmitAttendance
//   GET  /api/dosen/attendance/history → GetAttendanceHistory
//   POST /api/messages/send            → SendIssueMessage
// ============================================================

package handlers

import (
	"sistem-presensi-dosen/internal/services"
	"sistem-presensi-dosen/internal/utils"

	"github.com/gin-gonic/gin"
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
// Response: array sesi dengan info jadwal (MK, kelas, jam, lokasi, radius, expired_at).
func (h *DosenHandler) GetActiveSessions(c *gin.Context) {
	dosenID := c.GetUint("userID")

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
// Menjalankan 6 lapis validasi di service. Jika salah satu gagal,
// response menyertakan kode_error agar frontend bisa tampilkan
// pesan yang spesifik dan relevan.
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

	result, err := h.dosenService.SubmitAttendance(dosenID, req.SessionID, req.Latitude, req.Longitude)
	if err != nil {
		// AttendanceError sudah berisi HTTPStatus dan body JSON yang tepat
		attendanceErr, ok := err.(*services.AttendanceError)
		if ok {
			c.JSON(attendanceErr.HTTPStatus, attendanceErr)
			return
		}
		utils.InternalError(c, "Terjadi kesalahan saat memproses absensi.")
		return
	}

	utils.OK(c, "Absensi berhasil dicatat.", result)
}

// POST /api/attendance/submit-token
// Dosen absen via QR token (UUID).
// Body: { "token": "uuid-string", "latitude": -1.2345, "longitude": 124.5678 }
//
// Memanggil DosenService.SubmitAttendanceByToken dengan logika validasi yang sama
// seperti SubmitAttendance (geolocation-based).
func (h *DosenHandler) SubmitAttendanceByToken(c *gin.Context) {
	dosenID := c.GetUint("userID")

	var req struct {
		Token     string  `json:"token" binding:"required"`
		Latitude  float64 `json:"latitude" binding:"required"`
		Longitude float64 `json:"longitude" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "token, latitude, dan longitude wajib diisi.")
		return
	}

	result, err := h.dosenService.SubmitAttendanceByToken(dosenID, req.Token, req.Latitude, req.Longitude)
	if err != nil {
		// AttendanceError sudah berisi HTTPStatus dan body JSON yang tepat
		attendanceErr, ok := err.(*services.AttendanceError)
		if ok {
			c.JSON(attendanceErr.HTTPStatus, attendanceErr)
			return
		}
		utils.InternalError(c, "Terjadi kesalahan saat memproses absensi.")
		return
	}

	utils.OK(c, "Absensi berhasil dicatat.", result)
}

// GET /api/dosen/attendance/history?bulan=2024-04
// Riwayat absensi dosen yang sedang login.
// Query param 'bulan' format YYYY-MM (opsional, default: bulan ini).
func (h *DosenHandler) GetAttendanceHistory(c *gin.Context) {
	dosenID := c.GetUint("userID")
	bulan := c.DefaultQuery("bulan", "") // "" → service default ke bulan ini

	history, err := h.dosenService.GetAttendanceHistory(dosenID, bulan)
	if err != nil {
		// Bisa error format bulan tidak valid
		utils.BadRequest(c, err.Error())
		return
	}

	utils.OK(c, "Riwayat absensi berhasil diambil.", history)
}

// POST /api/messages/send
// Dosen mengirim pesan kendala ke admin jika tidak bisa absen.
// Body: { "judul": "...", "isi": "...", "session_id": 1 } (session_id opsional)
//
// Pesan langsung masuk ke inbox admin (MessageInboxPage).
func (h *DosenHandler) SendIssueMessage(c *gin.Context) {
	dosenID := c.GetUint("userID")

	var req struct {
		Judul     string `json:"judul" binding:"required"`
		Isi       string `json:"isi" binding:"required"`
		SessionID *uint  `json:"session_id"` // pointer = opsional, bisa null
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Judul dan isi pesan wajib diisi.")
		return
	}

	msg, err := h.messageService.SendFromDosen(dosenID, req.Judul, req.Isi, req.SessionID)
	if err != nil {
		utils.InternalError(c, "Gagal mengirim pesan. Coba lagi.")
		return
	}

	utils.Created(c, "Pesan kendala berhasil dikirim ke admin.", msg)
}
