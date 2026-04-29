// ============================================================
// main.go — Entry point backend Golang
// SEMUA ANGGOTA: Jangan ubah file ini tanpa diskusi tim.
// ============================================================

package main

import (
	"log"

	"github.com/joho/godotenv"
	"sistem-presensi-dosen/config"
	"sistem-presensi-dosen/database"
	"sistem-presensi-dosen/routes"
)

func main() {
	// Load environment variables dari .env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, menggunakan environment variables sistem")
	}

	// Inisialisasi konfigurasi
	cfg := config.Load()

	// Koneksi ke database dan auto-migrate schema
	db := database.Connect(cfg)
	database.AutoMigrate(db)
	
	// Seed dummy users (Admin, Dosen, Warek3)
	database.SeedUsers(db)

	// Setup router dan jalankan server
	r := routes.SetupRouter(db, cfg)
	log.Printf("Server berjalan di port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}
