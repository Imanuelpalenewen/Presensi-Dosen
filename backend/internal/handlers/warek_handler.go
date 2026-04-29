// ============================================================
// internal/handlers/warek_handler.go
// ✅ [ANGGOTA 3 - WAREK 3] Handler HTTP untuk endpoint Warek 3.
//
// PENTING: Semua endpoint di sini READ-ONLY.
// Warek 3 hanya bisa melihat data, tidak bisa mengubah apapun.
//
// Endpoint yang harus diimplementasi:
//   GET /api/warek/dashboard              → GetDashboardStats
//   GET /api/warek/attendance/recap       → GetFullRecap
// ============================================================

package handlers

import (
	"github.com/gin-gonic/gin"
	"sistem-presensi-dosen/internal/services"
	"sistem-presensi-dosen/internal/utils"
)

type WarekHandler struct {
	warekService *services.WarekService
}

func NewWarekHandler(warekService *services.WarekService) *WarekHandler {
	return &WarekHandler{warekService: warekService}
}

// GET /api/warek/dashboard
// Statistik ringkasan kehadiran seluruh dosen.
// Response: { total_dosen, rata_kehadiran_persen, total_pertemuan_bulan_ini }
func (h *WarekHandler) GetDashboardStats(c *gin.Context) {
	// TODO: Panggil warekService.GetDashboardStats()
	// Hitung:
	//   - total_dosen: COUNT users WHERE role='dosen'
	//   - total_pertemuan_bulan_ini: COUNT sessions bulan ini
	//   - rata_kehadiran_persen: (SUM hadir / SUM total pertemuan dosen) * 100
	stats, err := h.warekService.GetDashboardStats()
	if err != nil {
		utils.InternalError(c, "Gagal mengambil statistik dashboard.")
		return
	}

	utils.OK(c, "Statistik dashboard berhasil diambil.", stats)
}

// GET /api/warek/attendance/recap
// Rekap kehadiran semua dosen dengan filter opsional.
// Query params: dari_tanggal (YYYY-MM-DD), sampai_tanggal (YYYY-MM-DD), prodi
// Response: array { dosen_id, nama, prodi, total_hadir, total_pertemuan, persentase }
func (h *WarekHandler) GetFullRecap(c *gin.Context) {
	filters := map[string]string{
		"dari_tanggal":    c.Query("dari_tanggal"),
		"sampai_tanggal":  c.Query("sampai_tanggal"),
		"prodi":           c.Query("prodi"),
	}

	// TODO: Panggil warekService.GetFullRecap(filters)
	// Query JOIN users + schedules + sessions + attendances
	// Group by dosen_id, hitung total hadir dan total pertemuan
	recap, err := h.warekService.GetFullRecap(filters)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil rekap kehadiran.")
		return
	}

	utils.OK(c, "Rekap kehadiran berhasil diambil.", recap)
}

// GET /api/warek/attendance/report-prodi
func (h *WarekHandler) GetProdiRecap(c *gin.Context) {
	filters := map[string]string{
		"dari_tanggal":   c.Query("dari_tanggal"),
		"sampai_tanggal": c.Query("sampai_tanggal"),
	}

	recap, err := h.warekService.GetProdiRecap(filters)
	if err != nil {
		utils.InternalError(c, "Gagal mengambil rekap prodi.")
		return
	}

	utils.OK(c, "Rekap prodi berhasil diambil.", recap)
}
