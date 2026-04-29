// ============================================================
// internal/services/message_service.go
// ✅ [ANGGOTA 1] SendFromDosen — dosen kirim pesan kendala
// ✅ [ANGGOTA 2] GetAdminMessages, MarkAsRead — admin baca pesan
// ============================================================

package services

import (
	"gorm.io/gorm"
	"sistem-presensi-dosen/internal/models"
)

type MessageService struct {
	db *gorm.DB
}

func NewMessageService(db *gorm.DB) *MessageService {
	return &MessageService{db: db}
}

// ─────────────────────────────────────────────────────────────
// [ANGGOTA 1] SendFromDosen
// ─────────────────────────────────────────────────────────────
// Dosen mengirim laporan kendala ke admin.
// sessionID adalah *uint (pointer) karena bisa null — dosen bisa
// melapor kendala umum yang tidak terkait sesi tertentu.
func (s *MessageService) SendFromDosen(dosenID uint, judul, isi string, sessionID *uint) (*models.Message, error) {
	msg := models.Message{
		DosenID:   dosenID,
		SessionID: sessionID, // null jika tidak ada sesi terkait
		Judul:     judul,
		Isi:       isi,
		Status:    "unread", // semua pesan baru selalu masuk sebagai 'unread'
	}

	if err := s.db.Create(&msg).Error; err != nil {
		return nil, err
	}

	// Preload Dosen agar response menyertakan nama dosen (bukan hanya ID)
	if err := s.db.Preload("Dosen").First(&msg, msg.ID).Error; err != nil {
		return nil, err
	}

	return &msg, nil
}

// ─────────────────────────────────────────────────────────────
// [ANGGOTA 2] GetAdminMessages
// ─────────────────────────────────────────────────────────────
// Ambil semua pesan dari dosen dengan filter status opsional.
// status: "" = semua | "unread" | "read"
func (s *MessageService) GetAdminMessages(status string) ([]models.Message, error) {
	var messages []models.Message

	query := s.db.
		Preload("Dosen").
		Preload("Session.Schedule").
		Order("created_at DESC")

	if status == "unread" || status == "read" {
		query = query.Where("status = ?", status)
	}

	err := query.Find(&messages).Error
	return messages, err
}

// ─────────────────────────────────────────────────────────────
// [ANGGOTA 1] GetDosenMessages
// ─────────────────────────────────────────────────────────────
// Ambil semua pesan yang pernah dikirim oleh dosen tertentu.
func (s *MessageService) GetDosenMessages(dosenID uint) ([]models.Message, error) {
	messages := make([]models.Message, 0) // make agar JSON encode [] bukan null
	err := s.db.
		Preload("Session.Schedule").
		Where("dosen_id = ?", dosenID).
		Order("created_at DESC").
		Find(&messages).Error
	return messages, err
}

// ─────────────────────────────────────────────────────────────
// [ANGGOTA 2] MarkAsRead
// ─────────────────────────────────────────────────────────────
// Tandai pesan sebagai sudah dibaca oleh admin.
func (s *MessageService) MarkAsRead(messageID uint) (*models.Message, error) {
	var msg models.Message

	if err := s.db.First(&msg, messageID).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&msg).Update("status", "read").Error; err != nil {
		return nil, err
	}

	return &msg, nil
}