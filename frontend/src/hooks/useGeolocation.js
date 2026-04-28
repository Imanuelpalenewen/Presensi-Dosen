// ============================================================
// hooks/useGeolocation.js
// ✅ [ANGGOTA 1] Custom hook untuk ambil koordinat GPS browser.
// Digunakan di TakeAttendancePage dan AttendanceModal.
// ============================================================

import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [coords, setCoords] = useState(null)       // { latitude, longitude, accuracy }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fungsi untuk request koordinat GPS dari browser
  // TODO: Panggil getCurrentPosition dari Browser Geolocation API
  // - enableHighAccuracy: true → paksa pakai GPS, bukan WiFi/Cell tower
  // - timeout: 10000 → batas waktu 10 detik
  // - maximumAge: 0 → selalu ambil lokasi terbaru, jangan cache
  const getLocation = useCallback(() => {
    setLoading(true)
    setError(null)
    setCoords(null)

    if (!navigator.geolocation) {
      setError('Browser kamu tidak mendukung Geolocation. Coba gunakan Chrome atau Firefox terbaru.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // TODO: Simpan koordinat dari position.coords
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy, // dalam meter — untuk info user
        })
        setLoading(false)
      },
      (err) => {
        // TODO: Tangani berbagai kasus error geolocation:
        // err.code === 1 → User menolak izin lokasi
        // err.code === 2 → Sinyal GPS tidak tersedia
        // err.code === 3 → Timeout — GPS terlalu lama
        let pesan = ''
        if (err.code === 1) {
          pesan = 'Izin lokasi ditolak. Aktifkan GPS di pengaturan browser, lalu coba lagi.'
        } else if (err.code === 2) {
          pesan = 'Sinyal GPS tidak tersedia. Pindah ke area dengan sinyal lebih baik.'
        } else if (err.code === 3) {
          pesan = 'GPS timeout. Pastikan GPS aktif dan coba lagi.'
        } else {
          pesan = 'Gagal mengambil lokasi. Coba lagi.'
        }
        setError(pesan)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  return { coords, loading, error, getLocation }
}
