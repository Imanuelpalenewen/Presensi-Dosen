// ============================================================
// internal/models/message.go
// ✅ [ANGGOTA 1 - KAMU] Kirim pesan.
// ✅ [ANGGOTA 2 - ADMIN] Terima dan baca pesan.
//
// Model untuk fitur laporan kendala:
// Dosen mengirim pesan ke admin jika tidak bisa melakukan absensi.
// ============================================================

package models

import "gorm.io/gorm"

type Message struct {
	gorm.Model
	DosenID   uint    `gorm:"not null" json:"dosen_id"`
	Dosen     User    `gorm:"foreignKey:DosenID" json:"dosen,omitempty"`
	SessionID *uint   `gorm:"default:null" json:"session_id"` // pointer = nullable
	Session   *Session `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	Judul     string  `gorm:"not null" json:"judul"`
	Isi       string  `gorm:"type:text;not null" json:"isi"`
	// Status: 'unread' | 'read'
	Status    string  `gorm:"not null;default:unread" json:"status"`
}
