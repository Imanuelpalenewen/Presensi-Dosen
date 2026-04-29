// ============================================================
// routes/router.go
// SEMUA ANGGOTA: Semua route backend terdaftar di sini.
// Setiap anggota hanya menambah route di grup masing-masing.
// ============================================================

package routes

import (
	"sistem-presensi-dosen/config"
	"sistem-presensi-dosen/internal/handlers"
	"sistem-presensi-dosen/internal/middleware"
	"sistem-presensi-dosen/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// ─── CORS Middleware ──────────────────────────────────────
	// TODO: Izinkan request dari frontend (localhost:3000 saat dev)
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// ─── Inisialisasi semua service ───────────────────────────
	authService := services.NewAuthService(db, cfg)
	dosenService := services.NewDosenService(db, cfg)
	adminService := services.NewAdminService(db, cfg)
	warekService := services.NewWarekService(db)
	messageService := services.NewMessageService(db)

	// ─── Inisialisasi semua handler ───────────────────────────
	authHandler := handlers.NewAuthHandler(authService)
	dosenHandler := handlers.NewDosenHandler(dosenService, messageService)
	adminHandler := handlers.NewAdminHandler(adminService, messageService)
	warekHandler := handlers.NewWarekHandler(warekService)

	// ─── Group: /api ──────────────────────────────────────────
	api := r.Group("/api")

	// ─── Public Routes (tidak butuh login) ───────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/login", authHandler.Login) // semua role
	}

	// ─── Protected Routes ─────────────────────────────────────
	// Semua route di bawah wajib pakai JWT yang valid
	authMw := middleware.AuthMiddleware(cfg)

	// ─── [ANGGOTA 1 - KAMU] Dosen Routes ─────────────────────
	// Hanya role 'dosen' yang bisa akses
	dosen := api.Group("/dosen", authMw, middleware.RoleMiddleware("dosen"))
	{
		dosen.GET("/sessions/active", dosenHandler.GetActiveSessions)
		dosen.GET("/attendance/history", dosenHandler.GetAttendanceHistory)
		dosen.GET("/profile", dosenHandler.GetProfile)
		dosen.GET("/attendance/stats", dosenHandler.GetAttendanceStats)
		dosen.PATCH("/profile/password", dosenHandler.ChangePassword) // Ganti password
	}

	// Attendance submit bisa dari group sendiri karena path-nya berbeda
	attendance := api.Group("/attendance", authMw, middleware.RoleMiddleware("dosen"))
	{
		attendance.POST("/submit", dosenHandler.SubmitAttendance)
		attendance.POST("/submit-token", dosenHandler.SubmitAttendanceByToken) // QR token submission
	}

	// Messages: dosen kirim & lihat riwayat, admin baca
	messages := api.Group("/messages", authMw, middleware.RoleMiddleware("dosen"))
	{
		messages.POST("/send", dosenHandler.SendIssueMessage) // [ANGGOTA 1] kirim pesan
		messages.GET("/my", dosenHandler.GetMyMessages)       // [ANGGOTA 1] lihat riwayat pesan sendiri
	}

	// ─── [ANGGOTA 2] Admin Routes ─────────────────────────────
	// Hanya role 'admin' yang bisa akses
	admin := api.Group("/admin", authMw, middleware.RoleMiddleware("admin"))
	{
		// Jadwal
		admin.GET("/schedules", adminHandler.GetAllSchedules)
		admin.GET("/schedules/today", adminHandler.GetTodaySchedules)
		admin.POST("/schedules", adminHandler.CreateSchedule)
		admin.PUT("/schedules/:id", adminHandler.UpdateSchedule)
		admin.PATCH("/schedules/:id/location", adminHandler.UpdateScheduleLocation)
		admin.DELETE("/schedules/:id", adminHandler.DeleteSchedule)

		// Session
		admin.POST("/sessions", adminHandler.ActivateSession)
		admin.PATCH("/sessions/:id/close", adminHandler.CloseSession)

		// Rekap
		admin.GET("/attendance/recap", adminHandler.GetAttendanceRecap)
		admin.GET("/attendance/recap/:dosen_id", adminHandler.GetDosenAttendanceDetail)

		// Users
		admin.GET("/users", adminHandler.GetUsersByRole)

		// Inbox pesan kendala dari dosen
		admin.GET("/messages", adminHandler.GetMessages)
		admin.PATCH("/messages/:id/read", adminHandler.MarkMessageRead)
	}

	// ─── [ANGGOTA 3] Warek 3 Routes ───────────────────────────
	// Hanya role 'warek3' yang bisa akses, semua READ-ONLY
	warek := api.Group("/warek", authMw, middleware.RoleMiddleware("warek3"))
	{
		warek.GET("/dashboard", warekHandler.GetDashboardStats)
		warek.GET("/attendance/recap", warekHandler.GetFullRecap)
		warek.GET("/attendance/report-prodi", warekHandler.GetProdiRecap)
	}

	// Alias routes as requested by user
	dashboard := api.Group("/dashboard", authMw, middleware.RoleMiddleware("warek3"))
	{
		dashboard.GET("/stats", warekHandler.GetDashboardStats)
	}

	report := api.Group("/attendance", authMw, middleware.RoleMiddleware("warek3"))
	{
		report.GET("/report", warekHandler.GetFullRecap)
		report.GET("/report-prodi", warekHandler.GetProdiRecap)
	}

	return r
}
