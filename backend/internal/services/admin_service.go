// ============================================================
// internal/services/admin_service.go
// ✅ [ANGGOTA 2 - ADMIN] Business logic untuk semua fitur Admin.
// ============================================================

package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"sistem-presensi-dosen/config"
	"sistem-presensi-dosen/internal/models"
)

type AdminService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAdminService(db *gorm.DB, cfg *config.Config) *AdminService {
	return &AdminService{db: db, cfg: cfg}
}

// ─────────────────────────────────────────────────────────────
// ScheduleRequest: DTO untuk tambah / edit jadwal
// ─────────────────────────────────────────────────────────────
type ScheduleRequest struct {
	DosenID     uint    `json:"dosen_id" binding:"required"`
	MataKuliah  string  `json:"mata_kuliah" binding:"required"`
	Hari        string  `json:"hari" binding:"required,oneof=Senin Selasa Rabu Kamis Jumat"`
	JamMulai    string  `json:"jam_mulai" binding:"required"`   // format "08:00"
	JamSelesai  string  `json:"jam_selesai" binding:"required"` // format "10:00"
	Kelas       string  `json:"kelas" binding:"required"`
	Semester    string  `json:"semester" binding:"required"`
	LokasiLat   float64 `json:"lokasi_lat" binding:"required"`
	LokasiLng   float64 `json:"lokasi_lng" binding:"required"`
	LokasiNama  string  `json:"lokasi_nama" binding:"required"`
	RadiusMeter int     `json:"radius_meter" binding:"required,min=10,max=1000"`
}

// ─────────────────────────────────────────────────────────────
// JADWAL
// ─────────────────────────────────────────────────────────────

// GetAllSchedules: ambil semua jadwal dengan filter opsional
func (s *AdminService) GetAllSchedules(filters map[string]string) ([]models.Schedule, error) {
	// TODO: Build query dinamis berdasarkan filter yang ada
	query := s.db.Preload("Dosen")
	if v := filters["hari"]; v != "" {
		query = query.Where("hari = ?", v)
	}
	if v := filters["dosen_id"]; v != "" {
		query = query.Where("dosen_id = ?", v)
	}
	if v := filters["mata_kuliah"]; v != "" {
		query = query.Where("mata_kuliah LIKE ?", "%"+v+"%")
	}

	var schedules []models.Schedule
	err := query.Find(&schedules).Error
	return schedules, err
}

// GetTodaySchedules: jadwal hari ini + info session aktif jika ada
func (s *AdminService) GetTodaySchedules() (interface{}, error) {
	hariIni := hariIndonesia(time.Now().Weekday())

	// TODO: Query schedules WHERE hari = hariIni
	// Untuk setiap schedule, LEFT JOIN sessions WHERE DATE(created_at) = TODAY
	// Kembalikan sebagai array dengan field session (bisa null)
	type TodayScheduleItem struct {
		models.Schedule
		Session *models.Session `json:"session"` // null jika belum diaktifkan
	}

	var schedules []models.Schedule
	if err := s.db.Preload("Dosen").Where("hari = ?", hariIni).Find(&schedules).Error; err != nil {
		return nil, err
	}

	// TODO: Untuk setiap schedule, cari session aktif hari ini
	var result []TodayScheduleItem
	today := time.Now().Format("2006-01-02")
	for _, sc := range schedules {
		item := TodayScheduleItem{Schedule: sc}
		var sess models.Session
		err := s.db.Where("schedule_id = ? AND DATE(created_at) = ?", sc.ID, today).First(&sess).Error
		if err == nil {
			item.Session = &sess
		}
		result = append(result, item)
	}

	return result, nil
}

// CreateSchedule: tambah jadwal baru
func (s *AdminService) CreateSchedule(req ScheduleRequest) (*models.Schedule, error) {
	schedule := models.Schedule{
		DosenID:     req.DosenID,
		MataKuliah:  req.MataKuliah,
		Hari:        req.Hari,
		JamMulai:    req.JamMulai,
		JamSelesai:  req.JamSelesai,
		Kelas:       req.Kelas,
		Semester:    req.Semester,
		LokasiLat:   req.LokasiLat,
		LokasiLng:   req.LokasiLng,
		LokasiNama:  req.LokasiNama,
		RadiusMeter: req.RadiusMeter,
	}

	if err := s.db.Create(&schedule).Error; err != nil {
		return nil, err
	}

	s.db.Preload("Dosen").First(&schedule, schedule.ID)
	return &schedule, nil
}

// UpdateSchedule: edit jadwal
func (s *AdminService) UpdateSchedule(id uint, req ScheduleRequest) (*models.Schedule, error) {
	var schedule models.Schedule
	if err := s.db.First(&schedule, id).Error; err != nil {
		return nil, errors.New("jadwal tidak ditemukan")
	}

	// TODO: Update semua field dari request
	s.db.Model(&schedule).Updates(models.Schedule{
		DosenID:     req.DosenID,
		MataKuliah:  req.MataKuliah,
		Hari:        req.Hari,
		JamMulai:    req.JamMulai,
		JamSelesai:  req.JamSelesai,
		Kelas:       req.Kelas,
		Semester:    req.Semester,
		LokasiLat:   req.LokasiLat,
		LokasiLng:   req.LokasiLng,
		LokasiNama:  req.LokasiNama,
		RadiusMeter: req.RadiusMeter,
	})

	s.db.Preload("Dosen").First(&schedule, id)
	return &schedule, nil
}

// UpdateScheduleLocation: update koordinat & radius saja
func (s *AdminService) UpdateScheduleLocation(id uint, lat, lng float64, nama string, radius int) (*models.Schedule, error) {
	var schedule models.Schedule
	if err := s.db.First(&schedule, id).Error; err != nil {
		return nil, errors.New("jadwal tidak ditemukan")
	}

	// TODO: Update hanya field lokasi menggunakan Map agar zero value tetap disimpan
	s.db.Model(&schedule).Updates(map[string]interface{}{
		"lokasi_lat":   lat,
		"lokasi_lng":   lng,
		"lokasi_nama":  nama,
		"radius_meter": radius,
	})

	return &schedule, nil
}

// DeleteSchedule: hapus jadwal, tolak jika ada sesi aktif
func (s *AdminService) DeleteSchedule(id uint) error {
	// TODO: Cek apakah ada session aktif untuk jadwal ini
	var activeCount int64
	s.db.Model(&models.Session{}).
		Where("schedule_id = ? AND status = 'active'", id).
		Count(&activeCount)

	if activeCount > 0 {
		return errors.New("tidak bisa menghapus jadwal yang masih memiliki sesi aktif")
	}

	return s.db.Delete(&models.Schedule{}, id).Error
}

// ─────────────────────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────────────────────

// SessionActivationResult: response setelah sesi berhasil diaktifkan
type SessionActivationResult struct {
	ID            uint      `json:"id"`
	QrToken       string    `json:"qr_token"`
	ExpiredAt     time.Time `json:"expired_at"`
	ShareableLink string    `json:"shareable_link"` // link yang bisa dibagikan ke dosen
}

// ActivateSession: buat sesi baru untuk jadwal tertentu
func (s *AdminService) ActivateSession(scheduleID uint) (*SessionActivationResult, error) {
	// TODO: Cek jadwal ada
	var schedule models.Schedule
	if err := s.db.First(&schedule, scheduleID).Error; err != nil {
		return nil, errors.New("jadwal tidak ditemukan")
	}

	// TODO: Cek sudah ada sesi aktif hari ini untuk jadwal ini
	today := time.Now().Format("2006-01-02")
	var existingCount int64
	s.db.Model(&models.Session{}).
		Where("schedule_id = ? AND DATE(created_at) = ? AND status = 'active'", scheduleID, today).
		Count(&existingCount)

	if existingCount > 0 {
		return nil, errors.New("sesi untuk jadwal ini sudah aktif hari ini")
	}

	// TODO: Generate QR token (UUID v4) dan set waktu expired
	qrToken := uuid.New().String()
	expiredAt := time.Now().Add(time.Duration(s.cfg.SessionExpiryMinutes) * time.Minute)

	session := models.Session{
		ScheduleID: scheduleID,
		QrToken:    qrToken,
		Status:     "active",
		ExpiredAt:  expiredAt,
	}

	if err := s.db.Create(&session).Error; err != nil {
		return nil, fmt.Errorf("gagal mengaktifkan sesi: %w", err)
	}

	return &SessionActivationResult{
		ID:        session.ID,
		QrToken:   qrToken,
		ExpiredAt: expiredAt,
		// TODO: Ganti base URL sesuai deployment
		ShareableLink: fmt.Sprintf("http://localhost:3000/dosen/absen?token=%s", qrToken),
	}, nil
}

// CloseSession: tutup sesi manual
func (s *AdminService) CloseSession(sessionID uint) error {
	// TODO: Update status session menjadi 'closed'
	return s.db.Model(&models.Session{}).
		Where("id = ?", sessionID).
		Update("status", "closed").Error
}

// ─────────────────────────────────────────────────────────────
// REKAP ABSENSI
// ─────────────────────────────────────────────────────────────

// RecapItem: satu baris rekap per dosen
type RecapItem struct {
	DosenID        uint    `json:"dosen_id"`
	Nama           string  `json:"nama"`
	TotalHadir     int     `json:"total_hadir"`
	TotalPertemuan int     `json:"total_pertemuan"`
	Persentase     float64 `json:"persentase"`
}

// GetAttendanceRecap: rekap semua dosen, filter per bulan
func (s *AdminService) GetAttendanceRecap(bulan string) ([]RecapItem, error) {
	// TODO: Query kompleks JOIN users + schedules + sessions + attendances
	// Group by dosen_id
	// Hitung total_hadir = COUNT attendances per dosen
	// Hitung total_pertemuan = COUNT sessions milik dosen tersebut
	// persentase = (total_hadir / total_pertemuan) * 100
	var results []RecapItem
	// TODO: Implementasi query
	return results, nil
}

// GetDosenAttendanceDetail: detail absensi per dosen per bulan
func (s *AdminService) GetDosenAttendanceDetail(dosenID uint, bulan string) (interface{}, error) {
	// TODO: Query semua sesi milik dosen ini pada bulan tersebut
	// Untuk setiap sesi, tandai apakah ada attendance record (hadir) atau tidak (tidak hadir)
	return nil, nil
}

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────

// GetUsersByRole: ambil daftar user berdasarkan role (untuk dropdown form)
func (s *AdminService) GetUsersByRole(role string) ([]models.User, error) {
	var users []models.User
	err := s.db.Where("role = ?", role).Find(&users).Error
	return users, err
}
