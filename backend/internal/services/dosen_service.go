// ============================================================
// internal/services/dosen_service.go
// ✅ [ANGGOTA 1 - KAMU] Business logic untuk semua fitur Dosen.
//
// Ini adalah file terpenting yang kamu kerjakan.
// Semua validasi absensi berlapis ada di SubmitAttendance().
// ============================================================

package services

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"sistem-presensi-dosen/config"
	"sistem-presensi-dosen/internal/models"
	"sistem-presensi-dosen/internal/utils"
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
// Sesi 'aktif' = status='active' AND expired_at > NOW()
// AND jadwal hari sesuai dengan hari ini
// AND dosen_id sesuai dengan yang login
func (s *DosenService) GetActiveSessions(dosenID uint) ([]SessionWithSchedule, error) {
	now := time.Now()
	hariIni := hariIndonesia(now.Weekday()) // "Senin", "Selasa", dst.

	// TODO: Query JOIN sessions → schedules
	// Filter: schedules.dosen_id = dosenID
	//         sessions.status = 'active'
	//         sessions.expired_at > now
	//         schedules.hari = hariIni
	var results []SessionWithSchedule
	err := s.db.
		Table("sessions").
		Select(`sessions.id, sessions.qr_token, sessions.expired_at, sessions.status,
		        schedules.mata_kuliah, schedules.kelas, schedules.jam_mulai, schedules.jam_selesai,
		        schedules.lokasi_nama, schedules.radius_meter`).
		Joins("JOIN schedules ON schedules.id = sessions.schedule_id").
		Where("schedules.dosen_id = ? AND sessions.status = 'active' AND sessions.expired_at > ? AND schedules.hari = ?",
			dosenID, now, hariIni).
		Scan(&results).Error

	return results, err
}

// SessionWithSchedule: DTO hasil join sessions + schedules
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
// Proses absensi dengan 6 lapis validasi. Urutan validasi PENTING —
// jangan ubah urutan kecuali ada alasan kuat.
//
// Alur validasi:
//   Layer 1: Session ada di DB (berdasarkan session_id)
//   Layer 2: Session status == 'active' (bukan closed/expired)
//   Layer 3: Session belum expired (expired_at > now)
//   Layer 4: Hari & jam sesuai jadwal
//   Layer 5: Dosen belum pernah submit di session ini (cegah double absen)
//   Layer 6: Koordinat GPS dalam radius kelas (Haversine formula)
func (s *DosenService) SubmitAttendance(dosenID, sessionID uint, lat, lng float64) (*AttendanceResult, error) {
	now := time.Now()

	// ─── Layer 1: Session ada di DB ──────────────────────────
	// TODO: Preload Schedule agar bisa akses koordinat kelas dan radius
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
		// Auto-update status ke expired jika belum diupdate
		s.db.Model(&session).Update("status", "expired")
		return nil, ErrSessionExpired()
	}

	// ─── Layer 4: Hari & jam sesuai jadwal ────────────────────
	// TODO: Cek apakah hari ini adalah hari jadwal, dan jam sekarang dalam rentang jam_mulai–jam_selesai
	schedule := session.Schedule
	hariIni := hariIndonesia(now.Weekday())
	if schedule.Hari != hariIni {
		return nil, ErrScheduleMismatch()
	}
	// TODO: Parse jam_mulai dan jam_selesai lalu bandingkan dengan waktu sekarang
	// Gunakan time.Parse("15:04", schedule.JamMulai) dst.

	// ─── Layer 5: Cegah double submit ─────────────────────────
	// TODO: Cek apakah sudah ada record di tabel attendances dengan
	// session_id = sessionID AND dosen_id = dosenID
	var existingCount int64
	s.db.Model(&models.Attendance{}).
		Where("session_id = ? AND dosen_id = ?", sessionID, dosenID).
		Count(&existingCount)
	if existingCount > 0 {
		return nil, ErrAlreadySubmitted()
	}

	// ─── Layer 6: Validasi radius GPS (Haversine) ─────────────
	// TODO: Hitung jarak dosen ke kelas menggunakan utils.HaversineMeters
	jarakMeter := int(utils.HaversineMeters(
		schedule.LokasiLat, schedule.LokasiLng, // koordinat kelas
		lat, lng, // koordinat dosen
	))

	if jarakMeter > schedule.RadiusMeter {
		return nil, ErrOutOfRadius(jarakMeter, schedule.RadiusMeter)
	}

	// ─── Semua validasi lulus → simpan ke DB ──────────────────
	// TODO: Buat record Attendance baru dan simpan ke DB
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

// AttendanceResult: response sukses absensi ke frontend
type AttendanceResult struct {
	Status     string `json:"status"`
	Pesan      string `json:"pesan"`
	JamAbsen   string `json:"jam_absen"`
	JarakMeter int    `json:"jarak_meter"`
}

// ─────────────────────────────────────────────────────────────
// GetAttendanceHistory
// ─────────────────────────────────────────────────────────────
// Riwayat absensi dosen untuk bulan tertentu.
// bulan format "YYYY-MM", jika kosong default ke bulan ini.
func (s *DosenService) GetAttendanceHistory(dosenID uint, bulan string) ([]AttendanceHistoryItem, error) {
	// TODO: Parse bulan, default ke bulan ini jika kosong
	var startDate, endDate time.Time
	if bulan == "" {
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0)
	} else {
		// TODO: Parse "YYYY-MM" ke time.Time
		t, err := time.Parse("2006-01", bulan)
		if err != nil {
			return nil, fmt.Errorf("format bulan tidak valid, gunakan YYYY-MM")
		}
		startDate = t
		endDate = t.AddDate(0, 1, 0)
	}

	// TODO: Query JOIN attendances → sessions → schedules
	// Filter: attendances.dosen_id = dosenID AND jam_absen BETWEEN startDate AND endDate
	// Order by jam_absen DESC
	var results []AttendanceHistoryItem
	err := s.db.
		Table("attendances").
		Select(`attendances.id, attendances.jam_absen, attendances.jarak_meter,
		        schedules.mata_kuliah, schedules.kelas, 'hadir' AS status`).
		Joins("JOIN sessions ON sessions.id = attendances.session_id").
		Joins("JOIN schedules ON schedules.id = sessions.schedule_id").
		Where("attendances.dosen_id = ? AND attendances.jam_absen >= ? AND attendances.jam_absen < ?",
			dosenID, startDate, endDate).
		Order("attendances.jam_absen DESC").
		Scan(&results).Error

	return results, err
}

// AttendanceHistoryItem: satu baris di tabel riwayat absensi
type AttendanceHistoryItem struct {
	ID         uint      `json:"id"`
	JamAbsen   time.Time `json:"jam_absen"`
	JarakMeter int       `json:"jarak_meter"`
	MataKuliah string    `json:"mata_kuliah"`
	Kelas      string    `json:"kelas"`
	Status     string    `json:"status"` // selalu 'hadir' karena hanya yang berhasil absen masuk DB
}

// ─────────────────────────────────────────────────────────────
// Helper: konversi Go Weekday ke nama hari Indonesia
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
		return ""
	}
}
