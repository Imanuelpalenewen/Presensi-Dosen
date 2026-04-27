// ============================================================
// internal/middleware/role_middleware.go
// SEMUA ANGGOTA: Middleware role-based access control.
// Dipakai setelah AuthMiddleware di router.go.
// ============================================================

package middleware

import (
	"github.com/gin-gonic/gin"
	"sistem-presensi-dosen/internal/utils"
)

// RoleMiddleware: pastikan user yang request punya role yang diizinkan.
//
// Contoh penggunaan di router.go:
//   dosenGroup := r.Group("/dosen", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("dosen"))
//   adminGroup := r.Group("/admin", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("admin"))
//   warekGroup := r.Group("/warek", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware("warek3"))
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("userRole")

		for _, role := range allowedRoles {
			if userRole == role {
				c.Next()
				return
			}
		}

		utils.Forbidden(c, "Akses ditolak. Role kamu tidak memiliki izin untuk endpoint ini.")
		c.Abort()
	}
}
