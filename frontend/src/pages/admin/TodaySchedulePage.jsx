// ============================================================
// pages/admin/TodaySchedulePage.jsx
// ✅ [ANGGOTA 2 - ADMIN]
//
// Fitur:
//  1. Tabel jadwal hari ini: nama dosen, MK, jam, kelas, lokasi, radius, status sesi
//  2. Tombol 'Aktifkan Sesi' untuk jadwal yang belum punya session
//  3. Setelah aktif: tampilkan QR Code (pakai qrcode.react) + shareable link + countdown expired
//  4. Tombol 'Tutup Sesi' untuk menutup sesi sebelum waktunya
//  5. Badge notifikasi jika ada pesan kendala baru dari dosen → link ke /admin/inbox
//  Gunakan: adminService.getTodaySchedules, activateSession, closeSession
// ============================================================

import Navbar from '../../components/common/Navbar'

export default function TodaySchedulePage() {
  // TODO: Implementasi halaman ini

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">Jadwal Hari Ini</h2>
        {/* TODO: Tabel jadwal hari ini dengan tombol aktivasi sesi dan QR display */}
        <p className="text-gray-400">Halaman belum diimplementasi.</p>
      </div>
    </div>
  )
}
