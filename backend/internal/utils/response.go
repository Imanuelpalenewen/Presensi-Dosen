// ============================================================
// internal/utils/response.go
// SEMUA ANGGOTA: Helper untuk format response JSON yang konsisten.
// Gunakan fungsi ini di semua handler, jangan buat format sendiri.
// ============================================================

package utils

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type Response struct {
	Status  string      `json:"status"`           // "success" | "error"
	Pesan   string      `json:"pesan"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(c *gin.Context, pesan string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Status: "success",
		Pesan:  pesan,
		Data:   data,
	})
}

func Created(c *gin.Context, pesan string, data interface{}) {
	c.JSON(http.StatusCreated, Response{
		Status: "success",
		Pesan:  pesan,
		Data:   data,
	})
}

func BadRequest(c *gin.Context, pesan string) {
	c.JSON(http.StatusBadRequest, Response{
		Status: "error",
		Pesan:  pesan,
	})
}

func Unauthorized(c *gin.Context, pesan string) {
	c.JSON(http.StatusUnauthorized, Response{
		Status: "error",
		Pesan:  pesan,
	})
}

func Forbidden(c *gin.Context, pesan string) {
	c.JSON(http.StatusForbidden, Response{
		Status: "error",
		Pesan:  pesan,
	})
}

func NotFound(c *gin.Context, pesan string) {
	c.JSON(http.StatusNotFound, Response{
		Status: "error",
		Pesan:  pesan,
	})
}

func InternalError(c *gin.Context, pesan string) {
	c.JSON(http.StatusInternalServerError, Response{
		Status: "error",
		Pesan:  pesan,
	})
}
