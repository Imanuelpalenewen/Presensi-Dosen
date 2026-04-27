// ============================================================
// pages/admin/ScheduleManagementPage.jsx
// ✅ [ANGGOTA 2 - ADMIN]
//
// Fitur:
//  1. Tabel jadwal dengan kolom: dosen, MK, hari, jam, kelas, lokasi, radius
//  2. Tombol 'Tambah Jadwal Baru' → buka ScheduleFormModal
//  3. Tombol Edit per baris → buka ScheduleFormModal dengan data terisi
//  4. Tombol Hapus per baris → konfirmasi dialog sebelum hapus
//  5. Filter tabel berdasarkan hari, dosen, mata kuliah
//  Gunakan: adminService.getAllSchedules, createSchedule, updateSchedule, deleteSchedule
//           adminService.getDosenList untuk dropdown dosen di form
// ============================================================

import Navbar from '../../components/common/Navbar'

export default function ScheduleManagementPage() {
  // TODO: Implementasi halaman ini

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">Manajemen Jadwal</h2>
        {/* TODO: Implementasi tabel jadwal + modal tambah/edit */}
        <p className="text-gray-400">Halaman belum diimplementasi.</p>
      </div>
    </div>
  )
}
