// ============================================================
// pages/admin/LocationConfigPage.jsx
// ✅ [ANGGOTA 2 - ADMIN]
//
// Fitur:
//  1. Daftar jadwal dengan info koordinat dan radius saat ini
//  2. Form edit koordinat (lat, lng) dan radius per jadwal (PATCH endpoint khusus)
//  3. Panduan cara salin koordinat dari Google Maps
//  4. Link verifikasi koordinat ke Google Maps
//  Gunakan: adminService.getAllSchedules, updateScheduleLocation
// ============================================================

import Navbar from '../../components/common/Navbar'

export default function LocationConfigPage() {
  // TODO: Implementasi halaman ini

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">Konfigurasi Lokasi Kelas</h2>
        {/* TODO: Form edit koordinat dan radius per kelas */}
        <p className="text-gray-400">Halaman belum diimplementasi.</p>
      </div>
    </div>
  )
}
