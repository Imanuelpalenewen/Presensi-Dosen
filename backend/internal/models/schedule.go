// ============================================================
// internal/models/schedule.go
// ✅ [ANGGOTA 2 - ADMIN] Model jadwal semester.
// Koordinat kelas disimpan di sini beserta radius valid absensi.
// ============================================================

package models

import "gorm.io/gorm"

type Schedule struct {
	gorm.Model
	DosenID      uint    `gorm:"not null" json:"dosen_id"`
	Dosen        User    `gorm:"foreignKey:DosenID" json:"dosen,omitempty"`
	MataKuliah   string  `gorm:"not null" json:"mata_kuliah"`
	Hari         string  `gorm:"not null" json:"hari"` // Senin, Selasa, dst.
	JamMulai     string  `gorm:"not null" json:"jam_mulai"` // format: "08:00"
	JamSelesai   string  `gorm:"not null" json:"jam_selesai"`
	Kelas        string  `gorm:"not null" json:"kelas"`
	Semester     string  `gorm:"not null" json:"semester"`
	LokasiLat    float64 `gorm:"not null" json:"lokasi_lat"`  // latitude kelas
	LokasiLng    float64 `gorm:"not null" json:"lokasi_lng"`  // longitude kelas
	LokasiNama   string  `gorm:"not null" json:"lokasi_nama"` // label deskriptif
	RadiusMeter  int     `gorm:"not null;default:100" json:"radius_meter"` // batas absensi
}
