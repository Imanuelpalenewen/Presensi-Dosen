// ============================================================
// internal/services/auth_service.go
// SEMUA ANGGOTA: Business logic untuk autentikasi (semua role).
// ============================================================

package services

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
	"sistem-presensi-dosen/config"
	"sistem-presensi-dosen/internal/models"
	"sistem-presensi-dosen/internal/utils"
	"gorm.io/gorm"
)

type AuthService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthService(db *gorm.DB, cfg *config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

// LoginResult: data yang dikembalikan setelah login berhasil
type LoginResult struct {
	Token string     `json:"token"`
	User  UserPublic `json:"user"`
}

// UserPublic: representasi user tanpa password untuk dikirim ke client
type UserPublic struct {
	ID    uint   `json:"id"`
	Nama  string `json:"nama"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

// Login: verifikasi email & password, lalu generate JWT token.
// Dipanggil dari auth_handler.go
func (s *AuthService) Login(email, password string) (*LoginResult, error) {
	// TODO: Cari user berdasarkan email di DB
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user tidak ditemukan")
		}
		return nil, err
	}

	// TODO: Verifikasi password dengan bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("password salah")
	}

	// TODO: Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, user.Role, s.cfg.JWTSecret, s.cfg.JWTExpiryHours)
	if err != nil {
		return nil, err
	}

	return &LoginResult{
		Token: token,
		User: UserPublic{
			ID:    user.ID,
			Nama:  user.Nama,
			Email: user.Email,
			Role:  user.Role,
		},
	}, nil
}
