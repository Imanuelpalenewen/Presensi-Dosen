// ============================================================
// internal/handlers/auth_handler.go
// SEMUA ANGGOTA: Handler login dipakai semua role.
// ============================================================

package handlers

import (
	"github.com/gin-gonic/gin"
	"sistem-presensi-dosen/internal/services"
	"sistem-presensi-dosen/internal/utils"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// POST /api/auth/login
// Body: { "email": "...", "password": "..." }
// Response sukses: { status, pesan, data: { token, user: { id, nama, email, role } } }
func (h *AuthHandler) Login(c *gin.Context) {
	// TODO: Bind request body ke struct LoginRequest
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Email dan password wajib diisi dengan format yang benar.")
		return
	}

	// TODO: Panggil authService.Login untuk verifikasi dan generate token
	result, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		utils.Unauthorized(c, "Email atau password salah.")
		return
	}

	utils.OK(c, "Login berhasil.", result)
}
