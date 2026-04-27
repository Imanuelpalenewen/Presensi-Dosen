// ============================================================
// pages/admin/AttendanceRecapPage.jsx
// ✅ [ANGGOTA 2 - ADMIN]
//
// Fitur:
//  1. Tabel rekap: nama dosen, total hadir, total pertemuan, persentase (%)
//  2. Filter bulan di bagian atas
//  3. Klik nama dosen → expand detail per pertemuan (tanggal, MK, jam absen, jarak GPS)
//  4. Export ke Excel (opsional, bisa dikerjakan di sprint polish)
//  Gunakan: adminService.getAttendanceRecap, getDosenAttendanceDetail
// ============================================================

import Navbar from '../../components/common/Navbar'

export default function AttendanceRecapPage() {
  // TODO: Implementasi halaman ini

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">Rekap Absensi Dosen</h2>
        {/* TODO: Tabel rekap dengan expand detail per dosen */}
        <p className="text-gray-400">Halaman belum diimplementasi.</p>
      </div>
    </div>
  )
}
