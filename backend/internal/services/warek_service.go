// ============================================================
// internal/services/warek_service.go
// ✅ [ANGGOTA 3 - WAREK 3] Business logic untuk endpoint Warek 3.
//
// Semua query di sini READ-ONLY — tidak ada operasi tulis/ubah/hapus.
// Akses data yang sama dengan admin, tapi tanpa kemampuan modifikasi.
// ============================================================

package services

import (
	"math"
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
		percentage := float64(totalHadir) / float64(stats.TotalPertemuanBulanIni) * 100
		stats.RataKehadiranPersen = math.Round(percentage*100) / 100
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
	var results []WarekRecapItem

	// Base query: JOIN users → schedules → sessions, LEFT JOIN attendances
	baseQuery := `
		SELECT 
			u.id as dosen_id, 
			u.nama,
			'' as prodi,
			COUNT(DISTINCT s.id) as total_pertemuan,
			COUNT(DISTINCT a.id) as total_hadir,
			CASE 
				WHEN COUNT(DISTINCT s.id) > 0 
				THEN ROUND(COUNT(DISTINCT a.id) / COUNT(DISTINCT s.id) * 100, 2) 
				ELSE 0 
			END as persentase
		FROM users u
		LEFT JOIN schedules sc ON sc.dosen_id = u.id AND sc.deleted_at IS NULL
		LEFT JOIN sessions s ON s.schedule_id = sc.id AND s.deleted_at IS NULL
		LEFT JOIN attendances a ON a.session_id = s.id AND a.dosen_id = u.id AND a.deleted_at IS NULL
		WHERE u.role = 'dosen' AND u.deleted_at IS NULL
	`

	var args []interface{}

	// Filter: dari_tanggal (YYYY-MM-DD)
	if dari := filters["dari_tanggal"]; dari != "" {
		baseQuery += " AND s.created_at >= ?"
		args = append(args, dari)
	}

	// Filter: sampai_tanggal (YYYY-MM-DD)
	if sampai := filters["sampai_tanggal"]; sampai != "" {
		baseQuery += " AND s.created_at <= ?"
		args = append(args, sampai+" 23:59:59")
	}

	baseQuery += " GROUP BY u.id, u.nama ORDER BY u.nama"

	err := s.db.Raw(baseQuery, args...).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	// Jika results nil (tidak ada data), return array kosong agar frontend tidak error
	if results == nil {
		results = []WarekRecapItem{}
	}

	return results, nil
}

type WarekProdiItem struct {
	Prodi           string  `json:"prodi"`
	TotalDosen      int     `json:"total_dosen"`
	RataPersentase  float64 `json:"rata_persentase"`
}

func (s *WarekService) GetProdiRecap(filters map[string]string) ([]WarekProdiItem, error) {
	var results []WarekProdiItem

	// Query: Group by prodi (assuming prodi is a field in users)
	// If prodi doesn't exist yet, we'll return some dummy prodi based on data or empty string
	query := `
		SELECT 
			COALESCE(u.prodi, 'Lainnya') as prodi,
			COUNT(DISTINCT u.id) as total_dosen,
			AVG(sub.persentase) as rata_persentase
		FROM users u
		JOIN (
			SELECT 
				u2.id,
				CASE 
					WHEN COUNT(DISTINCT s.id) > 0 
					THEN ROUND(COUNT(DISTINCT a.id) / COUNT(DISTINCT s.id) * 100, 2) 
					ELSE 0 
				END as persentase
			FROM users u2
			LEFT JOIN schedules sc ON sc.dosen_id = u2.id AND sc.deleted_at IS NULL
			LEFT JOIN sessions s ON s.schedule_id = sc.id AND s.deleted_at IS NULL
			LEFT JOIN attendances a ON a.session_id = s.id AND a.dosen_id = u2.id AND a.deleted_at IS NULL
			WHERE u2.role = 'dosen' AND u2.deleted_at IS NULL
			GROUP BY u2.id
		) sub ON sub.id = u.id
		WHERE u.role = 'dosen'
		GROUP BY u.prodi
	`

	err := s.db.Raw(query).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	if results == nil {
		results = []WarekProdiItem{}
	}

	return results, nil
}
