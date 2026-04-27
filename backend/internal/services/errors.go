// ============================================================
// internal/services/errors.go
// SEMUA ANGGOTA: Custom error type agar handler bisa return
// HTTP status dan kode_error yang tepat ke frontend.
// ============================================================

package services

import (
	"encoding/json"
	"net/http"
)

// AttendanceError: error khusus proses submit absensi.
// Digunakan di dosen_handler.go → c.JSON(err.HTTPStatus, err)
type AttendanceError struct {
	HTTPStatus  int    `json:"-"`
	Status      string `json:"status"`
	KodeError   string `json:"kode_error"`
	Pesan       string `json:"pesan"`
	JarakAktual int    `json:"jarak_aktual,omitempty"` // meter, khusus OUT_OF_RADIUS
	RadiusValid int    `json:"radius_valid,omitempty"` // meter, khusus OUT_OF_RADIUS
}

func (e *AttendanceError) Error() string {
	b, _ := json.Marshal(e)
	return string(b)
}

// Kode-kode error yang mungkin dikirim ke frontend:
// Frontend (AttendanceModal.jsx) membaca kode_error untuk tampilkan pesan spesifik.

func ErrTokenInvalid() *AttendanceError {
	return &AttendanceError{
		HTTPStatus: http.StatusBadRequest,
		Status:     "error",
		KodeError:  "TOKEN_INVALID",
		Pesan:      "QR Code tidak valid. Pastikan kamu scan QR yang diberikan admin.",
	}
}

func ErrSessionClosed() *AttendanceError {
	return &AttendanceError{
		HTTPStatus: http.StatusBadRequest,
		Status:     "error",
		KodeError:  "SESSION_CLOSED",
		Pesan:      "Sesi sudah ditutup oleh admin. Hubungi admin untuk bantuan.",
	}
}

func ErrSessionExpired() *AttendanceError {
	return &AttendanceError{
		HTTPStatus: http.StatusBadRequest,
		Status:     "error",
		KodeError:  "SESSION_EXPIRED",
		Pesan:      "QR Code sudah kadaluarsa. Minta admin untuk mengaktifkan sesi baru.",
	}
}

func ErrScheduleMismatch() *AttendanceError {
	return &AttendanceError{
		HTTPStatus: http.StatusBadRequest,
		Status:     "error",
		KodeError:  "SCHEDULE_MISMATCH",
		Pesan:      "Jadwal tidak sesuai. Absensi hanya bisa dilakukan di jam dan hari yang terjadwal.",
	}
}

func ErrAlreadySubmitted() *AttendanceError {
	return &AttendanceError{
		HTTPStatus: http.StatusConflict,
		Status:     "error",
		KodeError:  "ALREADY_SUBMITTED",
		Pesan:      "Kamu sudah melakukan absensi untuk sesi ini sebelumnya.",
	}
}

func ErrOutOfRadius(jarakAktual, radiusValid int) *AttendanceError {
	return &AttendanceError{
		HTTPStatus:  http.StatusBadRequest,
		Status:      "error",
		KodeError:   "OUT_OF_RADIUS",
		Pesan:       "Kamu berada di luar area kelas yang ditentukan. Mendekat ke kelas dan coba lagi.",
		JarakAktual: jarakAktual,
		RadiusValid: radiusValid,
	}
}
