// ============================================================
// database/connection.go
// SEMUA ANGGOTA: Koneksi DB dipanggil sekali dari main.go.
// Gunakan *gorm.DB yang dikembalikan di seluruh repository.
// ============================================================

package database

import (
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"sistem-presensi-dosen/config"
	"sistem-presensi-dosen/internal/models"
)

func Connect(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Gagal koneksi ke database: %v", err)
	}

	log.Println("Koneksi database berhasil")
	return db
}

// AutoMigrate: GORM otomatis buat/update tabel berdasarkan struct model
// TODO: Tambahkan model baru di sini jika ada tabel baru
func AutoMigrate(db *gorm.DB) {
	err := db.AutoMigrate(
		&models.User{},
		&models.Schedule{},
		&models.Session{},
		&models.Attendance{},
		&models.Message{}, // Tabel pesan kendala dosen ke admin
	)
	if err != nil {
		log.Fatalf("Gagal auto-migrate: %v", err)
	}
	log.Println("Auto-migrate selesai")
}
