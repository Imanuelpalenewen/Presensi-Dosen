// ============================================================
// internal/services/dosen_service.go
// ✅ [ANGGOTA 1] Business logic untuk semua fitur Dosen.
// ============================================================

package services

import (
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
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
		        schedules.lokasi_lat,
		        schedules.lokasi_lng,
		        schedules.radius_meter`).
		Joins("JOIN schedules ON schedules.id = sessions.schedule_id").
		Where(`schedules.dosen_id = ?
		   AND sessions.status = 'active'
		   AND sessions.expired_at > ?
		   AND schedules.hari = ?`,
			dosenID, now, hariIni).
		Scan(&results).Error
	if err != nil {
		return nil, err
	}

	// Tandai sesi mana yang sudah diabsen oleh dosen ini
	for i, sess := range results {
		var count int64
		s.db.Model(&models.Attendance{}).
			Where("session_id = ? AND dosen_id = ?", sess.ID, dosenID).
			Count(&count)
		results[i].SudahAbsen = count > 0
	}

	return results, nil
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
	LokasiLat   float64   `json:"lokasi_lat"`
	LokasiLng   float64   `json:"lokasi_lng"`
	RadiusMeter int       `json:"radius_meter"`
	SudahAbsen  bool      `json:"sudah_absen"`
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

	// Tambahkan toleransi 30 menit sebelum dan sesudah jadwal
	mulaiMargin := mulaiNorm.Add(-30 * time.Minute)
	selesaiMargin := selesaiNorm.Add(30 * time.Minute)

	if nowNorm.Before(mulaiMargin) || nowNorm.After(selesaiMargin) {
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

	// Tambahkan toleransi 30 menit sebelum dan sesudah jadwal
	mulaiMargin := mulaiNorm.Add(-30 * time.Minute)
	selesaiMargin := selesaiNorm.Add(30 * time.Minute)

	if nowNorm.Before(mulaiMargin) || nowNorm.After(selesaiMargin) {
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
// Riwayat absensi dosen per bulan — SESUAI dengan tampilan admin.
// Mengambil dari tabel sessions (bukan attendances) lalu LEFT JOIN
// ke attendances sehingga sesi "Tidak Hadir" juga ikut tampil.
// bulan format "YYYY-MM". Jika kosong, tampilkan semua.
func (s *DosenService) GetAttendanceHistory(dosenID uint, bulan string) ([]AttendanceHistoryItem, error) {
	// ── Ambil semua sessions milik dosen, optional filter per bulan ──
	type rawRow struct {
		SessionID   uint
		CreatedAt   time.Time
		MataKuliah  string
		Kelas       string
		Hari        string
		JamAbsen    *time.Time // NULL jika tidak hadir
		JarakMeter  *int
	}

	query := s.db.Table("sessions").
		Select(`sessions.id         AS session_id,
		        sessions.created_at AS created_at,
		        schedules.mata_kuliah,
		        schedules.kelas,
		        schedules.hari,
		        attendances.jam_absen,
		        attendances.jarak_meter`).
		Joins("JOIN schedules ON schedules.id = sessions.schedule_id").
		Joins("LEFT JOIN attendances ON attendances.session_id = sessions.id AND attendances.dosen_id = ?", dosenID).
		Where("schedules.dosen_id = ?", dosenID)

	if bulan != "" {
		query = query.Where("sessions.created_at LIKE ?", bulan+"%")
	}

	query = query.Order("sessions.created_at DESC")

	var rows []rawRow
	if err := query.Scan(&rows).Error; err != nil {
		return nil, err
	}

	// ── Konversi ke AttendanceHistoryItem ──────────────────────
	var results []AttendanceHistoryItem
	for _, r := range rows {
		item := AttendanceHistoryItem{
			ID:         r.SessionID,
			MataKuliah: r.MataKuliah,
			Kelas:      r.Kelas,
			Hari:       r.Hari,
			CreatedAt:  r.CreatedAt,
		}
		if r.JamAbsen != nil {
			item.JamAbsen = *r.JamAbsen
			item.Status = "hadir"
		} else {
			item.Status = "alpha" // tidak hadir
		}
		if r.JarakMeter != nil {
			item.JarakMeter = *r.JarakMeter
		}
		results = append(results, item)
	}

	if results == nil {
		results = []AttendanceHistoryItem{}
	}
	return results, nil
}

// AttendanceHistoryItem adalah satu baris riwayat absensi dosen.
// Status: 'hadir' atau 'alpha' (tidak hadir).
type AttendanceHistoryItem struct {
	ID         uint      `json:"id"`
	JamAbsen   time.Time `json:"jam_absen"`
	CreatedAt  time.Time `json:"session_date"`  // tanggal sesi diadakan
	JarakMeter int       `json:"jarak_meter"`
	MataKuliah string    `json:"mata_kuliah"`
	Kelas      string    `json:"kelas"`
	Hari       string    `json:"hari"`
	Status     string    `json:"status"`
}

// ─────────────────────────────────────────────────────────────
// GetProfile
// ─────────────────────────────────────────────────────────────
// Ambil profil lengkap dosen beserta statistik kehadiran semester ini.
// Data termasuk: nama, email, NIP, prodi, mata kuliah, dan stats absensi.
func (s *DosenService) GetProfile(dosenID uint) (*DosenProfile, error) {
	// Query data dosen
	var user models.User
	if err := s.db.First(&user, dosenID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("dosen tidak ditemukan")
		}
		return nil, fmt.Errorf("gagal query dosen: %w", err)
	}

	// Hitung statistik attendance untuk semester ini
	// Semester ini = bulan sekarang sebagai acuan
	now := time.Now()
	startOfSemester := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.UTC)
	if now.Month() > 6 {
		startOfSemester = time.Date(now.Year(), 7, 1, 0, 0, 0, 0, time.UTC)
	}
	endOfSemester := startOfSemester.AddDate(0, 6, 0)

	// Ambil jumlah sesi yang benar-benar diadakan (dari tabel sessions) untuk semester ini
	// KONSISTEN dengan logika admin (GetAttendanceRecap)
	var totalSessions int64
	sessionQuery := s.db.Table("sessions").
		Joins("JOIN schedules ON schedules.id = sessions.schedule_id").
		Where("schedules.dosen_id = ?", dosenID)
	if bulanSemester := startOfSemester.Format("2006-01"); bulanSemester != "" {
		// Hitung semua sessions dari awal semester sampai sekarang
		sessionQuery = sessionQuery.Where(
			"sessions.created_at >= ? AND sessions.created_at < ?",
			startOfSemester, endOfSemester,
		)
	}
	sessionQuery.Count(&totalSessions)

	// Ambil jumlah kehadiran untuk semester ini
	var attended int64
	s.db.
		Table("attendances").
		Joins("JOIN sessions ON sessions.id = attendances.session_id").
		Where(`attendances.dosen_id = ?
		   AND attendances.jam_absen >= ?
		   AND attendances.jam_absen < ?`,
			dosenID, startOfSemester, endOfSemester).
		Count(&attended)

	// Hitung persentase kehadiran
	attendanceRate := int64(0)
	if totalSessions > 0 {
		attendanceRate = (attended * 100) / totalSessions
	}

	// Ambil daftar mata kuliah yang diampu
	var courses []string
	s.db.
		Table("schedules").
		Distinct("mata_kuliah").
		Where("dosen_id = ?", dosenID).
		Pluck("mata_kuliah", &courses)

	profile := &DosenProfile{
		Name:           user.Nama,
		Email:          user.Email,
		Department:     user.Prodi,
		Courses:        courses,
		TotalSessions:  int(totalSessions),
		Attended:       int(attended),
		AttendanceRate: int(attendanceRate),
	}

	return profile, nil
}

// DosenProfile adalah profil lengkap dosen dengan statistik.
type DosenProfile struct {
	Name           string   `json:"name"`
	Email          string   `json:"email"`
	Department     string   `json:"department"`
	Courses        []string `json:"courses"`
	TotalSessions  int      `json:"total_sessions"`
	Attended       int      `json:"attended"`
	AttendanceRate int      `json:"attendance_rate"`
}

// ─────────────────────────────────────────────────────────────
// GetAttendanceStats
// ─────────────────────────────────────────────────────────────
// Ambil ringkasan statistik kehadiran dosen untuk semester ini.
// Termasuk: total sesi, jumlah hadir, persentase kehadiran.
func (s *DosenService) GetAttendanceStats(dosenID uint) (*AttendanceStats, error) {
	now := time.Now()
	startOfSemester := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.UTC)
	if now.Month() > 6 {
		startOfSemester = time.Date(now.Year(), 7, 1, 0, 0, 0, 0, time.UTC)
	}
	endOfSemester := startOfSemester.AddDate(0, 6, 0)

	// Total sesi yang benar-benar diadakan dalam semester ini
	// KONSISTEN dengan logika admin (GetAttendanceRecap)
	var totalSessions int64
	if err := s.db.
		Table("sessions").
		Joins("JOIN schedules ON schedules.id = sessions.schedule_id").
		Where(`schedules.dosen_id = ?
		   AND sessions.created_at >= ?
		   AND sessions.created_at < ?`,
			dosenID, startOfSemester, endOfSemester).
		Count(&totalSessions).Error; err != nil {
		return nil, fmt.Errorf("gagal hitung total sesi: %w", err)
	}

	// Jumlah kehadiran
	var attended int64
	if err := s.db.
		Table("attendances").
		Joins("JOIN sessions ON sessions.id = attendances.session_id").
		Where(`attendances.dosen_id = ?
		   AND attendances.jam_absen >= ?
		   AND attendances.jam_absen < ?`,
			dosenID, startOfSemester, endOfSemester).
		Count(&attended).Error; err != nil {
		return nil, fmt.Errorf("gagal hitung kehadiran: %w", err)
	}

	attendanceRate := int64(0)
	if totalSessions > 0 {
		attendanceRate = (attended * 100) / totalSessions
	}

	return &AttendanceStats{
		TotalSessions:  int(totalSessions),
		Attended:       int(attended),
		AttendanceRate: int(attendanceRate),
	}, nil
}

// AttendanceStats adalah ringkasan statistik kehadiran.
type AttendanceStats struct {
	TotalSessions  int `json:"total_sessions"`
	Attended       int `json:"attended"`
	AttendanceRate int `json:"attendance_rate"`
}

// ─────────────────────────────────────────────────────────────
// ChangePassword
// ─────────────────────────────────────────────────────────────
// Ganti password dosen. Verifikasi password lama sebelum update.
func (s *DosenService) ChangePassword(dosenID uint, currentPassword, newPassword string) error {
	var user models.User
	if err := s.db.First(&user, dosenID).Error; err != nil {
		return fmt.Errorf("dosen tidak ditemukan")
	}

	// Verifikasi password lama
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
		return errors.New("password lama tidak sesuai")
	}

	// Hash password baru
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("gagal hash password: %w", err)
	}

	return s.db.Model(&user).Update("password", string(hashed)).Error
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
