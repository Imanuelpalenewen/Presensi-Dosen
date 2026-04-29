// ============================================================
// database/seed.go
// SEMUA ANGGOTA: Script untuk inisialisasi data default (dummy & real).
// Berjalan secara otomatis pada startup jika akun belum ada.
// ============================================================

package database

import (
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"sistem-presensi-dosen/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type DosenData struct {
	Coordinates map[string]struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"coordinates"`
	Lecturers []struct {
		Name       string `json:"name"`
		Email      string `json:"email"`
		CourseCode string `json:"course_code"`
		CourseName string `json:"course_name"`
		Credits    int    `json:"credits"`
		Day        string `json:"day"`
		StartTime  string `json:"start_time"`
		EndTime    string `json:"end_time"`
		Room       string `json:"room"`
		Building   string `json:"building"`
	} `json:"lecturers"`
}

func loadDosenData() (*DosenData, error) {
	file, err := os.ReadFile("database/dosen_data.json")
	if err != nil {
		return nil, err
	}
	var data DosenData
	if err := json.Unmarshal(file, &data); err != nil {
		return nil, err
	}
	return &data, nil
}

// SeedUsers memeriksa apakah akun dummy ada, jika tidak, membuatnya.
func SeedUsers(db *gorm.DB) {
	log.Println("Memeriksa seed data untuk users...")

	users := []models.User{
		{
			Nama:     "Admin Sistem",
			Email:    "admin@mail.com",
			Password: "admin123",
			Role:     "admin",
		},
		{
			Nama:     "Prof. Warek 3",
			Email:    "warek@mail.com",
			Password: "warek123",
			Role:     "warek3",
		},
		// Tambahkan tester untuk fallback jika dibutuhkan
		{
			Nama:     "Dr. Dosen Tester",
			Email:    "dosen@mail.com",
			Password: "dosen123",
			Role:     "dosen",
			Prodi:    "Informatika",
		},
		{
			Nama:     "Dr. 24 Jam Tester",
			Email:    "dosen24@mail.com",
			Password: "dosen123",
			Role:     "dosen",
			Prodi:    "Sistem Informasi",
		},
	}

	// Load real dosen data
	data, err := loadDosenData()
	if err == nil {
		dkvCount := 0
		infoCount := 0
		siCount := 0

		for _, l := range data.Lecturers {
			prodi := "Informatika" // Default
			
			isDKV := false
			nameLower := strings.ToLower(l.Name)
			if strings.Contains(nameLower, "julio") || strings.Contains(nameLower, "oktoverano") {
				isDKV = true
			} else if dkvCount < 1 { // We need 1 more random for DKV
				isDKV = true
			}

			if isDKV {
				prodi = "DKV"
				dkvCount++
			} else {
				// Distribute 60% Informatika, 40% Sistem Informasi
				if infoCount <= int(float64(siCount)*1.5) { // roughly 60/40 ratio
					prodi = "Informatika"
					infoCount++
				} else {
					prodi = "Sistem Informasi"
					siCount++
				}
			}

			users = append(users, models.User{
				Nama:     l.Name,
				Email:    l.Email,
				Password: "dosen123",
				Role:     "dosen",
				Prodi:    prodi,
			})
		}
	} else {
		log.Printf("Gagal meload dosen_data.json: %v", err)
	}

	for _, u := range users {
		var existing models.User
		if err := db.Where("email = ?", u.Email).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
				u.Password = string(hashedPassword)
				db.Create(&u)
				log.Printf("Berhasil membuat user baru: %s", u.Email)
			}
		} else {
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
			db.Model(&existing).Update("password", string(hashedPassword))
		}
	}
}

// SeedSchedules membuat jadwal dari real data
func SeedSchedules(db *gorm.DB) {
	log.Println("Memeriksa seed data untuk schedules...")

	data, err := loadDosenData()
	if err != nil {
		log.Printf("Batal seed schedules, gagal baca data: %v", err)
		return
	}

	for _, l := range data.Lecturers {
		var dosen models.User
		if err := db.Where("email = ?", l.Email).First(&dosen).Error; err != nil {
			continue // skip jika dosen tidak ada
		}

		lat := -7.279895
		lng := 112.738128
		if coord, ok := data.Coordinates[l.Building]; ok {
			lat = coord.Lat
			lng = coord.Lng
		}

		sc := models.Schedule{
			DosenID:     dosen.ID,
			MataKuliah:  l.CourseCode + " - " + l.CourseName,
			Hari:        l.Day,
			JamMulai:    l.StartTime,
			JamSelesai:  l.EndTime,
			Kelas:       "A", // default
			Semester:    "Genap 2026",
			LokasiLat:   lat,
			LokasiLng:   lng,
			LokasiNama:  l.Room,
			RadiusMeter: 200,
		}

		var existing models.Schedule
		if err := db.Where("dosen_id = ? AND mata_kuliah = ?", sc.DosenID, sc.MataKuliah).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				db.Create(&sc)
				log.Printf("Berhasil membuat jadwal baru: %s", sc.MataKuliah)
			}
		} else {
			db.Model(&existing).Updates(sc)
		}
	}

	// Add 24-hour dummy schedules for Dr. 24 Jam Tester
	var testerDosen models.User
	if err := db.Where("email = ?", "dosen24@mail.com").First(&testerDosen).Error; err == nil {
		hariList := []string{"Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"}
		for _, h := range hariList {
			sc := models.Schedule{
				DosenID:     testerDosen.ID,
				MataKuliah:  "Sesi Testing 24 Jam",
				Hari:        h,
				JamMulai:    "00:00",
				JamSelesai:  "23:59",
				Kelas:       "Testing",
				Semester:    "Genap 2026",
				LokasiLat:   -7.279895, // Default coordinate (e.g., Gedung P Lt. 1)
				LokasiLng:   112.738128,
				LokasiNama:  "Area Testing",
				RadiusMeter: 1000, // Large radius for testing anywhere
			}
			var existing models.Schedule
			if err := db.Where("dosen_id = ? AND hari = ?", sc.DosenID, sc.Hari).First(&existing).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					db.Create(&sc)
				}
			}
		}
		log.Println("Berhasil membuat jadwal testing 24 jam untuk Dr. 24 Jam Tester")
	}
}

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

// SeedAttendance membuat data dummy absensi untuk laporan rekap
func SeedAttendance(db *gorm.DB) {
	log.Println("Memeriksa seed data untuk attendances...")
	var count int64
	db.Model(&models.Attendance{}).Count(&count)
	if count > 0 {
		return // Sudah ada data absensi
	}

	var schedules []models.Schedule
	if err := db.Find(&schedules).Error; err != nil {
		return
	}

	for _, sc := range schedules {
		// Buat 4 sesi untuk tiap jadwal di masa lalu (sebulan terakhir)
		for i := 1; i <= 4; i++ {
			sessionDate := time.Now().AddDate(0, 0, -i*7)
			
			sess := models.Session{
				ScheduleID: sc.ID,
				QrToken:    "dummy-token-" + sessionDate.Format("20060102") + "-" + string(rune(sc.ID)),
				Status:     "closed",
				ExpiredAt:  sessionDate.Add(2 * time.Hour),
			}
			// Gunakan CreatedAt manual
			sess.CreatedAt = sessionDate
			db.Create(&sess)

			// Buat attendance bervariasi
			// Dosen Tester 24 jam tidak di-absen otomatis
			if sc.MataKuliah == "Sesi Testing 24 Jam" {
				continue
			}

			// Variasi persentase kehadiran: 
			// sc.ID % 4 == 0 -> hadir 4/4 (100%)
			// sc.ID % 4 == 1 -> hadir 3/4 (75%)
			// sc.ID % 4 == 2 -> hadir 2/4 (50%)
			// sc.ID % 4 == 3 -> hadir 1/4 (25%)
			hadirLimit := 4 - (int(sc.ID) % 4)
			if i <= hadirLimit {
				att := models.Attendance{
					SessionID:  sess.ID,
					DosenID:    sc.DosenID,
					JamAbsen:   sessionDate.Add(15 * time.Minute),
					Latitude:   sc.LokasiLat,
					Longitude:  sc.LokasiLng,
					JarakMeter: 10,
				}
				att.CreatedAt = sessionDate
				db.Create(&att)
			}
		}
	}
	log.Println("Berhasil membuat dummy data absensi")
}
