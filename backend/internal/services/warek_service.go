// ============================================================
// internal/services/warek_service.go
// ✅ [ANGGOTA 3 - WAREK 3] Business logic untuk endpoint Warek 3.
//
// Semua query di sini READ-ONLY — tidak ada operasi tulis/ubah/hapus.
// Akses data yang sama dengan admin, tapi tanpa kemampuan modifikasi.
// ============================================================

package services

import (
	"time"

	"gorm.io/gorm"
	"sistem-presensi-dosen/internal/models"
)

type WarekService struct {
	db *gorm.DB
}

func NewWarekService(db *gorm.DB) *WarekService {
	return &WarekService{db: db}
}

// ─────────────────────────────────────────────────────────────
// GetDashboardStats
// ─────────────────────────────────────────────────────────────
// Statistik ringkasan untuk dashboard Warek 3.
// Dipanggil dari warek_handler.go → GET /api/warek/dashboard

type DashboardStats struct {
	TotalDosen              int64   `json:"total_dosen"`
	RataKehadiranPersen     float64 `json:"rata_kehadiran_persen"`
	TotalPertemuanBulanIni  int64   `json:"total_pertemuan_bulan_ini"`
}

func (s *WarekService) GetDashboardStats() (*DashboardStats, error) {
	stats := &DashboardStats{}

	// TODO: COUNT semua user dengan role='dosen'
	s.db.Model(&models.User{}).Where("role = ?", "dosen").Count(&stats.TotalDosen)

	// TODO: COUNT sessions yang dibuat bulan ini (DATE_FORMAT(created_at,'%Y-%m') = bulan ini)
	now := time.Now()
	bulanIni := now.Format("2006-01")
	s.db.Model(&models.Session{}).
		Where("DATE_FORMAT(created_at, '%Y-%m') = ?", bulanIni).
		Count(&stats.TotalPertemuanBulanIni)

	// TODO: Hitung rata-rata kehadiran:
	// (COUNT attendances bulan ini) / (COUNT sessions bulan ini) * 100
	// Jika total_pertemuan = 0, return 0 untuk hindari division by zero
	if stats.TotalPertemuanBulanIni > 0 {
		var totalHadir int64
		s.db.Model(&models.Attendance{}).
			Joins("JOIN sessions ON sessions.id = attendances.session_id").
			Where("DATE_FORMAT(sessions.created_at, '%Y-%m') = ?", bulanIni).
			Count(&totalHadir)
		stats.RataKehadiranPersen = float64(totalHadir) / float64(stats.TotalPertemuanBulanIni) * 100
	}

	return stats, nil
}

// ─────────────────────────────────────────────────────────────
// GetFullRecap
// ─────────────────────────────────────────────────────────────
// Rekap kehadiran semua dosen dengan filter opsional.
// Dipanggil dari warek_handler.go → GET /api/warek/attendance/recap

type WarekRecapItem struct {
	DosenID        uint    `json:"dosen_id"`
	Nama           string  `json:"nama"`
	Prodi          string  `json:"prodi"`       // TODO: Tambah field prodi ke tabel users jika belum ada
	TotalHadir     int     `json:"total_hadir"`
	TotalPertemuan int     `json:"total_pertemuan"`
	Persentase     float64 `json:"persentase"`
}

// filters: { dari_tanggal, sampai_tanggal, prodi } — semua opsional
func (s *WarekService) GetFullRecap(filters map[string]string) ([]WarekRecapItem, error) {
	// TODO: Query JOIN users + schedules + sessions + attendances
	// Group by users.id (dosen_id)
	// Hitung total_hadir = COUNT(attendances.id) per dosen dalam rentang tanggal
	// Hitung total_pertemuan = COUNT(sessions.id) per dosen dalam rentang tanggal
	// Filter berdasarkan dari_tanggal & sampai_tanggal jika ada

	// Contoh kerangka query raw (sesuaikan dengan SQL dialect):
	// SELECT u.id as dosen_id, u.nama,
	//   COUNT(DISTINCT s.id) as total_pertemuan,
	//   COUNT(DISTINCT a.id) as total_hadir,
	//   ROUND(COUNT(DISTINCT a.id) / COUNT(DISTINCT s.id) * 100, 1) as persentase
	// FROM users u
	// LEFT JOIN schedules sc ON sc.dosen_id = u.id
	// LEFT JOIN sessions s ON s.schedule_id = sc.id
	// LEFT JOIN attendances a ON a.session_id = s.id AND a.dosen_id = u.id
	// WHERE u.role = 'dosen'
	// [AND s.created_at BETWEEN ? AND ?]
	// GROUP BY u.id

	// TODO: Implementasi query di bawah ini
	var results []WarekRecapItem
	return results, nil
}
