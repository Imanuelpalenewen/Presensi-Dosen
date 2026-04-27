// ============================================================
// config/config.go
// SEMUA ANGGOTA: Tambahkan config baru di sini jika diperlukan.
// Akses config dengan config.Load() di main.go.
// ============================================================

package config

import (
	"os"
	"strconv"
)

type Config struct {
	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// JWT
	JWTSecret      string
	JWTExpiryHours int

	// Server
	Port string

	// Session
	SessionExpiryMinutes int
}

func Load() *Config {
	jwtExpiry, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	sessionExpiry, _ := strconv.Atoi(getEnv("SESSION_EXPIRY_MINUTES", "15"))

	return &Config{
		DBHost:               getEnv("DB_HOST", "localhost"),
		DBPort:               getEnv("DB_PORT", "3306"),
		DBUser:               getEnv("DB_USER", "root"),
		DBPassword:           getEnv("DB_PASSWORD", ""),
		DBName:               getEnv("DB_NAME", "presensi_dosen"),
		JWTSecret:            getEnv("JWT_SECRET", "default_secret_ganti_ini"),
		JWTExpiryHours:       jwtExpiry,
		Port:                 getEnv("PORT", "8080"),
		SessionExpiryMinutes: sessionExpiry,
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
