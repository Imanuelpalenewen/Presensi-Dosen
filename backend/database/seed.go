// ============================================================
// database/seed.go
// SEMUA ANGGOTA: Script untuk inisialisasi data default (dummy).
// Berjalan secara otomatis pada startup jika akun belum ada.
// ============================================================

package database

import (
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"sistem-presensi-dosen/internal/models"
)

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
			Nama:     "Dr. Dosen Tester",
			Email:    "dosen@mail.com",
			Password: "dosen123",
			Role:     "dosen",
		},
		{
			Nama:     "Prof. Warek 3",
			Email:    "warek@mail.com",
			Password: "warek123",
			Role:     "warek3",
		},
	}

	for _, u := range users {
		var existing models.User
		// Cari berdasarkan email
		if err := db.Where("email = ?", u.Email).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Jika tidak ada, buat baru
				hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
				u.Password = string(hashedPassword)
				db.Create(&u)
				log.Printf("Berhasil membuat user baru: %s", u.Email)
			}
		} else {
			// Jika SUDAH ADA, kita paksa update password-nya agar pasti benar
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
			db.Model(&existing).Update("password", string(hashedPassword))
			log.Printf("Berhasil memperbarui password user: %s", u.Email)
		}
	}
}
