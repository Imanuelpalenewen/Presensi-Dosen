// ============================================================
// internal/models/attendance.go
// ✅ [ANGGOTA 1 - KAMU] Model rekaman absensi.
// Setiap record = satu keberhasilan absen dosen di satu sesi.
// Koordinat GPS dosen saat absen disimpan sebagai bukti audit.
// ============================================================

package models

import (
	"time"
	"gorm.io/gorm"
)

type Attendance struct {
	gorm.Model
	SessionID   uint      `gorm:"not null" json:"session_id"`
	Session     Session   `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	DosenID     uint      `gorm:"not null" json:"dosen_id"`
	Dosen       User      `gorm:"foreignKey:DosenID" json:"dosen,omitempty"`
	JamAbsen    time.Time `gorm:"not null" json:"jam_absen"`
	Latitude    float64   `gorm:"not null" json:"latitude"`  // koordinat GPS dosen saat absen
	Longitude   float64   `gorm:"not null" json:"longitude"`
	JarakMeter  int       `gorm:"not null" json:"jarak_meter"` // jarak dosen ke kelas (Haversine)
}
