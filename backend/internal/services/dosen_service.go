// ============================================================
// internal/services/dosen_service.go
// ✅ [ANGGOTA 1] Business logic untuk semua fitur Dosen.
// ============================================================

package services

import (
	"errors"
	"fmt"
	"time"

	"sistem-presensi-dosen/config"
	"sistem-presensi-dosen/internal/models"
	"sistem-presensi-dosen/internal/utils"

	"gorm.io/gorm"
)

type DosenService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewDosenService(db *gorm.DB, cfg *config.Config) *DosenService {
	return &DosenService{db: db, cfg: cfg}
}

// ─────────────────────────────────────────────────────────────
// GetActiveSessions
// ─────────────────────────────────────────────────────────────
// Ambil semua sesi aktif hari ini milik dosen yang sedang login.
// Sesi aktif = status='active' AND expired_at > NOW() AND hari sesuai.
func (s *DosenService) GetActiveSessions(dosenID uint) ([]SessionWithSchedule, error) {
	now := time.Now()
	hariIni := hariIndonesia(now.Weekday())

	var results []SessionWithSchedule
	err := s.db.
		Table("sessions").
		Select(`sessions.id,
		        sessions.qr_token,
		        sessions.expired_at,
		        sessions.status,
		        schedules.mata_kuliah,
		        schedules.kelas,
		        schedules.jam_mulai,
		        schedules.jam_selesai,
		        schedules.lokasi_nama,
		        schedules.radius_meter`).
		Joins("JOIN schedules ON schedules.id = sessions.schedule_id").
		Where(`schedules.dosen_id = ?
		   AND sessions.status = 'active'
		   AND sessions.expired_at > ?
		   AND schedules.hari = ?`,
			dosenID, now, hariIni).
		Scan(&results).Error

	return results, err
}

// SessionWithSchedule adalah DTO hasil JOIN sessions + schedules.
type SessionWithSchedule struct {
	ID          uint      `json:"id"`
	QrToken     string    `json:"qr_token"`
	ExpiredAt   time.Time `json:"expired_at"`
	Status      string    `json:"status"`
	MataKuliah  string    `json:"mata_kuliah"`
	Kelas       string    `json:"kelas"`
	JamMulai    string    `json:"jam_mulai"`
	JamSelesai  string    `json:"jam_selesai"`
	LokasiNama  string    `json:"lokasi_nama"`
	RadiusMeter int       `json:"radius_meter"`
}

// ─────────────────────────────────────────────────────────────
// SubmitAttendance
// ─────────────────────────────────────────────────────────────
// Proses absensi dengan 6 lapis validasi. Urutan validasi PENTING.
//
//	Layer 1 → Session ada di DB
//	Layer 2 → Status session == 'active'
//	Layer 3 → Session belum expired
//	Layer 4 → Hari & jam sesuai jadwal
//	Layer 5 → Dosen belum pernah submit di session ini
//	Layer 6 → Koordinat GPS dalam radius kelas (Haversine)
func (s *DosenService) SubmitAttendance(dosenID, sessionID uint, lat, lng float64) (*AttendanceResult, error) {
	now := time.Now()

	// ─── Layer 1: Session ada di DB ──────────────────────────
	// Preload Schedule agar bisa akses koordinat kelas dan radius.
	var session models.Session
	err := s.db.Preload("Schedule").First(&session, sessionID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTokenInvalid()
		}
		return nil, fmt.Errorf("gagal query session: %w", err)
	}

	// ─── Layer 2: Status session harus 'active' ───────────────
	if session.Status == "closed" {
		return nil, ErrSessionClosed()
	}

	// ─── Layer 3: Session belum expired ───────────────────────
	if session.Status == "expired" || now.After(session.ExpiredAt) {
		// Auto-update status ke expired agar konsisten di DB
		s.db.Model(&session).Update("status", "expired")
		return nil, ErrSessionExpired()
	}

	// ─── Layer 4: Hari & jam harus sesuai jadwal ──────────────
	schedule := session.Schedule

	// Cek hari
	hariIni := hariIndonesia(now.Weekday())
	if schedule.Hari != hariIni {
		return nil, ErrScheduleMismatch()
	}

	// Cek jam: parse JamMulai & JamSelesai (format "HH:MM:SS" dari MySQL TIME)
	// Ambil 5 karakter pertama "HH:MM" agar aman meski ada detik.
	jamMulaiStr := schedule.JamMulai
	jamSelesaiStr := schedule.JamSelesai
	if len(jamMulaiStr) > 5 {
		jamMulaiStr = jamMulaiStr[:5]
	}
	if len(jamSelesaiStr) > 5 {
		jamSelesaiStr = jamSelesaiStr[:5]
	}

	jamMulai, err := time.Parse("15:04", jamMulaiStr)
	if err != nil {
		return nil, fmt.Errorf("format jam_mulai tidak valid: %w", err)
	}
	jamSelesai, err := time.Parse("15:04", jamSelesaiStr)
	if err != nil {
		return nil, fmt.Errorf("format jam_selesai tidak valid: %w", err)
	}

	// Normalisasi ke tanggal netral (year=0) agar bisa dibandingkan hanya berdasarkan jam
	nowNorm := time.Date(0, 1, 1, now.Hour(), now.Minute(), 0, 0, time.UTC)
	mulaiNorm := time.Date(0, 1, 1, jamMulai.Hour(), jamMulai.Minute(), 0, 0, time.UTC)
	selesaiNorm := time.Date(0, 1, 1, jamSelesai.Hour(), jamSelesai.Minute(), 0, 0, time.UTC)

	if nowNorm.Before(mulaiNorm) || nowNorm.After(selesaiNorm) {
		return nil, ErrScheduleMismatch()
	}

	// ─── Layer 5: Cegah double submit ─────────────────────────
	// Cek UNIQUE constraint: satu dosen hanya boleh satu kali per sesi.
	var existingCount int64
	s.db.Model(&models.Attendance{}).
		Where("session_id = ? AND dosen_id = ?", sessionID, dosenID).
		Count(&existingCount)
	if existingCount > 0 {
		return nil, ErrAlreadySubmitted()
	}

	// ─── Layer 6: Validasi radius GPS (Haversine) ─────────────
	// Hitung jarak dosen ke koordinat kelas.
	jarakMeter := int(utils.HaversineMeters(
		schedule.LokasiLat, schedule.LokasiLng, // koordinat kelas (dari jadwal)
		lat, lng, // koordinat dosen saat absen
	))

	if jarakMeter > schedule.RadiusMeter {
		return nil, ErrOutOfRadius(jarakMeter, schedule.RadiusMeter)
	}

	// ─── Semua validasi lulus → simpan ke DB ──────────────────
	attendance := models.Attendance{
		SessionID:  sessionID,
		DosenID:    dosenID,
		JamAbsen:   now,
		Latitude:   lat,
		Longitude:  lng,
		JarakMeter: jarakMeter,
	}

	if err := s.db.Create(&attendance).Error; err != nil {
		return nil, fmt.Errorf("gagal menyimpan absensi: %w", err)
	}

	return &AttendanceResult{
		Status:     "success",
		Pesan:      "Absensi berhasil dicatat. Selamat mengajar!",
		JamAbsen:   now.Format("15:04:05"),
		JarakMeter: jarakMeter,
	}, nil
}

// AttendanceResult adalah response sukses absensi yang dikirim ke frontend.
type AttendanceResult struct {
	Status     string `json:"status"`
	Pesan      string `json:"pesan"`
	JamAbsen   string `json:"jam_absen"`
	JarakMeter int    `json:"jarak_meter"`
}

// ─────────────────────────────────────────────────────────────
// SubmitAttendanceByToken
// ─────────────────────────────────────────────────────────────
// Proses absensi via QR token (UUID). Flow sama seperti SubmitAttendance
// tapi query session berdasarkan qr_token bukan sessionID.
//
// Input: dosenID, qr_token (UUID string), latitude, longitude
// Flow:
//  1. Find session by qr_token
//  2. Run 6-layer validation (same as SubmitAttendance)
//  3. Save to attendances table
func (s *DosenService) SubmitAttendanceByToken(dosenID uint, token string, lat, lng float64) (*AttendanceResult, error) {
	now := time.Now()

	// ─── Layer 1: Find Session by QR Token ──────────────────
	// Preload Schedule agar bisa akses koordinat kelas dan radius.
	var session models.Session
	err := s.db.Preload("Schedule").Where("qr_token = ?", token).First(&session).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTokenInvalid()
		}
		return nil, fmt.Errorf("gagal query session by token: %w", err)
	}

	// ─── Layer 2: Status session harus 'active' ───────────────
	if session.Status == "closed" {
		return nil, ErrSessionClosed()
	}

	// ─── Layer 3: Session belum expired ───────────────────────
	if session.Status == "expired" || now.After(session.ExpiredAt) {
		// Auto-update status ke expired agar konsisten di DB
		s.db.Model(&session).Update("status", "expired")
		return nil, ErrSessionExpired()
	}

	// ─── Layer 4: Hari & jam harus sesuai jadwal ──────────────
	schedule := session.Schedule

	// Cek hari
	hariIni := hariIndonesia(now.Weekday())
	if schedule.Hari != hariIni {
		return nil, ErrScheduleMismatch()
	}

	// Cek jam: parse JamMulai & JamSelesai
	jamMulaiStr := schedule.JamMulai
	jamSelesaiStr := schedule.JamSelesai
	if len(jamMulaiStr) > 5 {
		jamMulaiStr = jamMulaiStr[:5]
	}
	if len(jamSelesaiStr) > 5 {
		jamSelesaiStr = jamSelesaiStr[:5]
	}

	jamMulai, err := time.Parse("15:04", jamMulaiStr)
	if err != nil {
		return nil, fmt.Errorf("format jam_mulai tidak valid: %w", err)
	}
	jamSelesai, err := time.Parse("15:04", jamSelesaiStr)
	if err != nil {
		return nil, fmt.Errorf("format jam_selesai tidak valid: %w", err)
	}

	// Normalisasi ke tanggal netral
	nowNorm := time.Date(0, 1, 1, now.Hour(), now.Minute(), 0, 0, time.UTC)
	mulaiNorm := time.Date(0, 1, 1, jamMulai.Hour(), jamMulai.Minute(), 0, 0, time.UTC)
	selesaiNorm := time.Date(0, 1, 1, jamSelesai.Hour(), jamSelesai.Minute(), 0, 0, time.UTC)

	if nowNorm.Before(mulaiNorm) || nowNorm.After(selesaiNorm) {
		return nil, ErrScheduleMismatch()
	}

	// ─── Layer 5: Cegah double submit ─────────────────────────
	var existingCount int64
	s.db.Model(&models.Attendance{}).
		Where("session_id = ? AND dosen_id = ?", session.ID, dosenID).
		Count(&existingCount)
	if existingCount > 0 {
		return nil, ErrAlreadySubmitted()
	}

	// ─── Layer 6: Validasi radius GPS (Haversine) ─────────────
	jarakMeter := int(utils.HaversineMeters(
		schedule.LokasiLat, schedule.LokasiLng,
		lat, lng,
	))

	if jarakMeter > schedule.RadiusMeter {
		return nil, ErrOutOfRadius(jarakMeter, schedule.RadiusMeter)
	}

	// ─── Semua validasi lulus → simpan ke DB ──────────────────
	attendance := models.Attendance{
		SessionID:  session.ID,
		DosenID:    dosenID,
		JamAbsen:   now,
		Latitude:   lat,
		Longitude:  lng,
		JarakMeter: jarakMeter,
	}

	if err := s.db.Create(&attendance).Error; err != nil {
		return nil, fmt.Errorf("gagal menyimpan absensi: %w", err)
	}

	return &AttendanceResult{
		Status:     "success",
		Pesan:      "Absensi berhasil dicatat. Selamat mengajar!",
		JamAbsen:   now.Format("15:04:05"),
		JarakMeter: jarakMeter,
	}, nil
}

// ─────────────────────────────────────────────────────────────
// GetAttendanceHistory
// ─────────────────────────────────────────────────────────────
// Riwayat absensi dosen untuk bulan tertentu.
// bulan format "YYYY-MM". Jika kosong, default ke bulan ini.
func (s *DosenService) GetAttendanceHistory(dosenID uint, bulan string) ([]AttendanceHistoryItem, error) {
	var startDate, endDate time.Time

	if bulan == "" {
		// Default ke bulan ini
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0)
	} else {
		// Parse format "YYYY-MM"
		t, err := time.Parse("2006-01", bulan)
		if err != nil {
			return nil, fmt.Errorf("format bulan tidak valid, gunakan YYYY-MM")
		}
		startDate = t
		endDate = t.AddDate(0, 1, 0)
	}

	// JOIN attendances → sessions → schedules
	// Hanya ambil record milik dosen yang request, dalam rentang bulan.
	var results []AttendanceHistoryItem
	err := s.db.
		Table("attendances").
		Select(`attendances.id,
		        attendances.jam_absen,
		        attendances.jarak_meter,
		        schedules.mata_kuliah,
		        schedules.kelas,
		        schedules.hari,
		        'hadir' AS status`).
		Joins("JOIN sessions ON sessions.id = attendances.session_id").
		Joins("JOIN schedules ON schedules.id = sessions.schedule_id").
		Where(`attendances.dosen_id = ?
		   AND attendances.jam_absen >= ?
		   AND attendances.jam_absen < ?`,
			dosenID, startDate, endDate).
		Order("attendances.jam_absen DESC").
		Scan(&results).Error

	return results, err
}

// AttendanceHistoryItem adalah satu baris riwayat absensi dosen.
// Status selalu 'hadir' karena hanya absensi yang berhasil masuk DB.
type AttendanceHistoryItem struct {
	ID         uint      `json:"id"`
	JamAbsen   time.Time `json:"jam_absen"`
	JarakMeter int       `json:"jarak_meter"`
	MataKuliah string    `json:"mata_kuliah"`
	Kelas      string    `json:"kelas"`
	Hari       string    `json:"hari"`
	Status     string    `json:"status"`
}

// ─────────────────────────────────────────────────────────────
// Helper: konversi Go Weekday ke nama hari dalam Bahasa Indonesia
// ─────────────────────────────────────────────────────────────
func hariIndonesia(wd time.Weekday) string {
	switch wd {
	case time.Monday:
		return "Senin"
	case time.Tuesday:
		return "Selasa"
	case time.Wednesday:
		return "Rabu"
	case time.Thursday:
		return "Kamis"
	case time.Friday:
		return "Jumat"
	default:
		return "" // Sabtu/Minggu tidak ada jadwal
	}
}
