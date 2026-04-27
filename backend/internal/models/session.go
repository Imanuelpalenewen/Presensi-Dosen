// ============================================================
// internal/models/session.go
// ✅ [ANGGOTA 2 - ADMIN] Model sesi harian.
// Session dibuat admin setiap hari untuk mengaktifkan absensi.
// ============================================================

package models

import (
	"time"
	"gorm.io/gorm"
)

type Session struct {
	gorm.Model
	ScheduleID uint      `gorm:"not null" json:"schedule_id"`
	Schedule   Schedule  `gorm:"foreignKey:ScheduleID" json:"schedule,omitempty"`
	QrToken    string    `gorm:"uniqueIndex;not null" json:"qr_token"` // UUID v4
	// Status: 'active' | 'closed' | 'expired'
	Status     string    `gorm:"not null;default:active" json:"status"`
	ExpiredAt  time.Time `gorm:"not null" json:"expired_at"`
}
