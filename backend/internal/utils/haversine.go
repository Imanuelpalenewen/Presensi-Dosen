// ============================================================
// internal/utils/haversine.go
// ✅ [ANGGOTA 1 - KAMU] Formula Haversine untuk hitung jarak GPS.
//
// Digunakan di attendance_service.go untuk validasi Layer 6:
// apakah dosen berada dalam radius yang dikonfigurasi.
//
// Formula Haversine akurat untuk jarak pendek (< 1 km)
// yang relevan untuk validasi kehadiran di kampus.
// ============================================================

package utils

import "math"

// HaversineMeters menghitung jarak antara dua koordinat GPS dalam meter.
//
// Parameter:
//   lat1, lng1: koordinat titik pertama (kelas)
//   lat2, lng2: koordinat titik kedua (dosen saat absen)
//
// Return: jarak dalam meter (float64)
//
// Cara pakai di attendance_service.go:
//   jarak := utils.HaversineMeters(kelas.LokasiLat, kelas.LokasiLng, dosenLat, dosenLng)
//   if int(jarak) > kelas.RadiusMeter {
//       return error OUT_OF_RADIUS
//   }
func HaversineMeters(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371000 // radius bumi dalam meter

	// Konversi derajat ke radian
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	deltaPhi := (lat2 - lat1) * math.Pi / 180
	deltaLambda := (lng2 - lng1) * math.Pi / 180

	// Haversine formula
	a := math.Sin(deltaPhi/2)*math.Sin(deltaPhi/2) +
		math.Cos(phi1)*math.Cos(phi2)*
			math.Sin(deltaLambda/2)*math.Sin(deltaLambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}
