// ============================================================
// internal/handlers/admin_handler.go
// ✅ [ANGGOTA 2 - ADMIN] Handler HTTP untuk semua endpoint Admin.
//
// Endpoint yang harus diimplementasi:
//   GET    /api/admin/schedules          → GetAllSchedules
//   POST   /api/admin/schedules          → CreateSchedule
//   PUT    /api/admin/schedules/:id      → UpdateSchedule
//   PATCH  /api/admin/schedules/:id/location → UpdateScheduleLocation
//   DELETE /api/admin/schedules/:id      → DeleteSchedule
//   GET    /api/admin/schedules/today    → GetTodaySchedules
//   POST   /api/admin/sessions           → ActivateSession
//   PATCH  /api/admin/sessions/:id/close → CloseSession
//   GET    /api/admin/attendance/recap   → GetAttendanceRecap
//   GET    /api/admin/attendance/recap/:dosen_id → GetDosenAttendanceDetail
//   GET    /api/admin/users?role=dosen   → GetDosenList
//   GET    /api/admin/messages           → GetMessages
//   PATCH  /api/admin/messages/:id/read  → MarkMessageRead
// ============================================================

package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"sistem-presensi-dosen/internal/services"
	"sistem-presensi-dosen/internal/utils"
)

type AdminHandler struct {
	adminService   *services.AdminService
	messageService *services.MessageService
}

func NewAdminHandler(adminService *services.AdminService, messageService *services.MessageService) *AdminHandler {
	return &AdminHandler{
		adminService:   adminService,
		messageService: messageService,
	}
}

// ─────────────────────────────────────────────────────────────
// JADWAL
// ─────────────────────────────────────────────────────────────

// GET /api/admin/schedules
// Query params opsional: hari, dosen_id, mata_kuliah
// Response: array jadwal semester lengkap
func (h *AdminHandler) GetAllSchedules(c *gin.Context) {
	filters := map[string]string{
		"hari":        c.Query("hari"),
		"dosen_id":    c.Query("dosen_id"),
		"mata_kuliah": c.Query("mata_kuliah"),
	}

	// TODO: Panggil adminService.GetAllSchedules(filters)
	schedules, err := h.adminService.GetAllSchedules(filters)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil data jadwal.")
		return
	}

	utils.OK(c, "Data jadwal berhasil diambil.", schedules)
}

// GET /api/admin/schedules/today
// Jadwal hari ini beserta status sesi masing-masing.
// Response menyertakan field 'session' jika sesi sudah diaktifkan hari ini.
func (h *AdminHandler) GetTodaySchedules(c *gin.Context) {
	// TODO: Panggil adminService.GetTodaySchedules()
	// Service harus filter berdasarkan nama hari (Senin, Selasa, dst.) dari tanggal sekarang
	schedules, err := h.adminService.GetTodaySchedules()
	if err != nil {
		utils.InternalError(c, "Gagal mengambil jadwal hari ini.")
		return
	}

	utils.OK(c, "Jadwal hari ini berhasil diambil.", schedules)
}

// POST /api/admin/schedules
// Tambah jadwal baru untuk semester ini.
// Body: { dosen_id, mata_kuliah, hari, jam_mulai, jam_selesai, kelas,
//          semester, lokasi_lat, lokasi_lng, lokasi_nama, radius_meter }
func (h *AdminHandler) CreateSchedule(c *gin.Context) {
	var req services.ScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Data jadwal tidak lengkap atau format salah: "+err.Error())
		return
	}

	schedule, err := h.adminService.CreateSchedule(req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Created(c, "Jadwal berhasil ditambahkan.", schedule)
}

// PUT /api/admin/schedules/:id
// Edit seluruh data jadwal.
func (h *AdminHandler) UpdateSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "ID jadwal tidak valid.")
		return
	}

	var req services.ScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Data jadwal tidak lengkap: "+err.Error())
		return
	}

	schedule, err := h.adminService.UpdateSchedule(uint(id), req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.OK(c, "Jadwal berhasil diperbarui.", schedule)
}

// PATCH /api/admin/schedules/:id/location
// Update koordinat GPS dan radius saja tanpa ubah data lain.
// Body: { lokasi_lat, lokasi_lng, lokasi_nama, radius_meter }
func (h *AdminHandler) UpdateScheduleLocation(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "ID jadwal tidak valid.")
		return
	}

	var req struct {
		LokasiLat   float64 `json:"lokasi_lat" binding:"required"`
		LokasiLng   float64 `json:"lokasi_lng" binding:"required"`
		LokasiNama  string  `json:"lokasi_nama" binding:"required"`
		RadiusMeter int     `json:"radius_meter" binding:"required,min=10,max=1000"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Data lokasi tidak valid: "+err.Error())
		return
	}

	// TODO: Panggil adminService.UpdateScheduleLocation(uint(id), req)
	updated, err := h.adminService.UpdateScheduleLocation(uint(id), req.LokasiLat, req.LokasiLng, req.LokasiNama, req.RadiusMeter)
	if err != nil {
		utils.InternalError(c, "Gagal memperbarui lokasi kelas.")
		return
	}

	utils.OK(c, "Lokasi kelas berhasil diperbarui.", updated)
}

// DELETE /api/admin/schedules/:id
// Hapus jadwal. Hanya bisa dihapus jika belum ada session aktif.
func (h *AdminHandler) DeleteSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "ID jadwal tidak valid.")
		return
	}

	// TODO: Panggil adminService.DeleteSchedule(uint(id))
	// Service harus cek apakah ada sesi aktif sebelum menghapus
	if err := h.adminService.DeleteSchedule(uint(id)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.OK(c, "Jadwal berhasil dihapus.", nil)
}

// ─────────────────────────────────────────────────────────────
// SESSION (Aktivasi Absensi Harian)
// ─────────────────────────────────────────────────────────────

// POST /api/admin/sessions
// Aktifkan sesi untuk jadwal tertentu.
// Body: { "schedule_id": 1 }
// Response: { id, qr_token, expired_at, shareable_link }
// Service otomatis generate UUID sebagai qr_token dan set expired_at.
func (h *AdminHandler) ActivateSession(c *gin.Context) {
	var req struct {
		ScheduleID uint `json:"schedule_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "schedule_id wajib diisi.")
		return
	}

	// TODO: Panggil adminService.ActivateSession(req.ScheduleID)
	// Service harus:
	//   1. Cek jadwal ada dan hari sesuai
	//   2. Cek belum ada sesi aktif untuk jadwal ini hari ini
	//   3. Generate UUID sebagai qr_token
	//   4. Set expired_at = now + SESSION_EXPIRY_MINUTES dari config
	session, err := h.adminService.ActivateSession(req.ScheduleID)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Created(c, "Sesi berhasil diaktifkan. QR Code siap digunakan.", session)
}

// PATCH /api/admin/sessions/:id/close
// Tutup sesi secara manual sebelum expired_at.
func (h *AdminHandler) CloseSession(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "ID sesi tidak valid.")
		return
	}

	// TODO: Panggil adminService.CloseSession(uint(id))
	// Update status session menjadi 'closed'
	if err := h.adminService.CloseSession(uint(id)); err != nil {
		utils.InternalError(c, "Gagal menutup sesi.")
		return
	}

	utils.OK(c, "Sesi berhasil ditutup.", nil)
}

// ─────────────────────────────────────────────────────────────
// REKAP ABSENSI
// ─────────────────────────────────────────────────────────────

// GET /api/admin/attendance/recap?bulan=2024-04
// Rekap kehadiran semua dosen dalam satu bulan.
// Response: array { dosen_id, nama, total_hadir, total_pertemuan, persentase }
func (h *AdminHandler) GetAttendanceRecap(c *gin.Context) {
	bulan := c.Query("bulan") // format YYYY-MM, opsional

	// TODO: Panggil adminService.GetAttendanceRecap(bulan)
	recap, err := h.adminService.GetAttendanceRecap(bulan)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil rekap absensi.")
		return
	}

	utils.OK(c, "Rekap absensi berhasil diambil.", recap)
}

// GET /api/admin/attendance/recap/:dosen_id
// Detail absensi per dosen — semua sesi yang dihadiri/tidak.
func (h *AdminHandler) GetDosenAttendanceDetail(c *gin.Context) {
	dosenID, err := strconv.ParseUint(c.Param("dosen_id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "ID dosen tidak valid.")
		return
	}
	bulan := c.Query("bulan")

	// TODO: Panggil adminService.GetDosenAttendanceDetail(uint(dosenID), bulan)
	detail, err := h.adminService.GetDosenAttendanceDetail(uint(dosenID), bulan)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil detail absensi dosen.")
		return
	}

	utils.OK(c, "Detail absensi dosen berhasil diambil.", detail)
}

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────

// GET /api/admin/users?role=dosen
// Ambil daftar user berdasarkan role (untuk dropdown form tambah jadwal).
func (h *AdminHandler) GetUsersByRole(c *gin.Context) {
	role := c.DefaultQuery("role", "dosen")

	// TODO: Panggil adminService.GetUsersByRole(role)
	users, err := h.adminService.GetUsersByRole(role)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil daftar user.")
		return
	}

	utils.OK(c, "Daftar user berhasil diambil.", users)
}

// ─────────────────────────────────────────────────────────────
// INBOX PESAN KENDALA DARI DOSEN
// ─────────────────────────────────────────────────────────────

// GET /api/admin/messages?status=unread
// Ambil pesan kendala dari dosen. Filter status opsional: unread | read
func (h *AdminHandler) GetMessages(c *gin.Context) {
	status := c.Query("status") // "" = semua, "unread", atau "read"

	// TODO: Panggil messageService.GetAdminMessages(status)
	messages, err := h.messageService.GetAdminMessages(status)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil pesan.")
		return
	}

	utils.OK(c, "Pesan berhasil diambil.", messages)
}

// PATCH /api/admin/messages/:id/read
// Tandai pesan sebagai sudah dibaca.
func (h *AdminHandler) MarkMessageRead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "ID pesan tidak valid.")
		return
	}

	// TODO: Panggil messageService.MarkAsRead(uint(id))
	msg, err := h.messageService.MarkAsRead(uint(id))
	if err != nil {
		utils.InternalError(c, "Gagal memperbarui status pesan.")
		return
	}

	utils.OK(c, "Pesan ditandai sebagai sudah dibaca.", msg)
}
