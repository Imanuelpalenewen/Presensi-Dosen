// ============================================================
// internal/middleware/auth_middleware.go
// SEMUA ANGGOTA: Middleware JWT dipakai di semua route yang dilindungi.
// Sudah di-setup di router.go — tidak perlu ditambahkan manual per handler.
// ============================================================

package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"sistem-presensi-dosen/config"
	"sistem-presensi-dosen/internal/utils"
)

// AuthMiddleware: validasi JWT token dari header "Authorization: Bearer <token>"
// Jika valid, simpan claims ke gin.Context agar bisa diakses di handler.
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Ambil header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			utils.Unauthorized(c, "Token autentikasi tidak ditemukan. Silakan login terlebih dahulu.")
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// TODO: Parse dan validasi token
		claims, err := utils.ParseToken(tokenString, cfg.JWTSecret)
		if err != nil {
			utils.Unauthorized(c, "Token tidak valid atau sudah kadaluarsa. Silakan login ulang.")
			c.Abort()
			return
		}

		// Simpan info user ke context agar bisa diakses handler
		// Akses dengan: c.GetUint("userID"), c.GetString("userRole")
		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role)
		c.Next()
	}
}
