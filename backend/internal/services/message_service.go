// ============================================================
// internal/services/message_service.go
// ✅ [ANGGOTA 1 - KAMU] SendFromDosen — kirim pesan kendala
// ✅ [ANGGOTA 2 - ADMIN] GetAdminMessages, MarkAsRead — terima & baca pesan
//
// Service ini menjembatani komunikasi satu arah: Dosen → Admin.
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
// [ANGGOTA 1 - KAMU] SendFromDosen
// ─────────────────────────────────────────────────────────────
// Dosen mengirim laporan kendala ke admin.
// Dipanggil dari dosen_handler.go → POST /api/messages/send
//
// sessionID adalah pointer (*uint) karena bisa null (kendala tidak terkait sesi tertentu)
func (s *MessageService) SendFromDosen(dosenID uint, judul, isi string, sessionID *uint) (*models.Message, error) {
	// TODO: Buat record Message baru dan simpan ke DB
	msg := models.Message{
		DosenID:   dosenID,
		SessionID: sessionID, // null jika tidak ada sesi terkait
		Judul:     judul,
		Isi:       isi,
		Status:    "unread", // semua pesan baru selalu 'unread'
	}

	if err := s.db.Create(&msg).Error; err != nil {
		return nil, err
	}

	// TODO: Preload data Dosen agar response menyertakan nama dosen
	s.db.Preload("Dosen").First(&msg, msg.ID)

	return &msg, nil
}

// ─────────────────────────────────────────────────────────────
// [ANGGOTA 2 - ADMIN] GetAdminMessages
// ─────────────────────────────────────────────────────────────
// Ambil semua pesan dari dosen dengan filter status opsional.
// Dipanggil dari admin_handler.go → GET /api/admin/messages
//
// status: "" = semua, "unread", atau "read"
func (s *MessageService) GetAdminMessages(status string) ([]models.Message, error) {
	var messages []models.Message

	// TODO: Query dengan Preload Dosen agar bisa tampilkan nama dosen di inbox
	query := s.db.Preload("Dosen").Preload("Session.Schedule").Order("created_at DESC")

	if status == "unread" || status == "read" {
		query = query.Where("status = ?", status)
	}

	err := query.Find(&messages).Error
	return messages, err
}

// ─────────────────────────────────────────────────────────────
// [ANGGOTA 2 - ADMIN] MarkAsRead
// ─────────────────────────────────────────────────────────────
// Tandai pesan sebagai sudah dibaca.
// Dipanggil dari admin_handler.go → PATCH /api/admin/messages/:id/read
func (s *MessageService) MarkAsRead(messageID uint) (*models.Message, error) {
	var msg models.Message

	// TODO: Cek pesan ada dulu, lalu update status ke 'read'
	if err := s.db.First(&msg, messageID).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&msg).Update("status", "read").Error; err != nil {
		return nil, err
	}

	return &msg, nil
}
