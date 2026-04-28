// ============================================================
// internal/models/user.go
// SEMUA ANGGOTA: Model User dipakai di semua role.
// ============================================================

package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Nama     string `gorm:"not null" json:"nama"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `gorm:"not null" json:"-"` // json:"-" agar password tidak pernah di-return ke client
	Role     string `gorm:"not null;default:dosen" json:"role"` // 'dosen' | 'admin' | 'warek3'
	Prodi    string `gorm:"default:Informatika" json:"prodi"`
}
