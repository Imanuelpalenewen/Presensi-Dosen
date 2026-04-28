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

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { getAllSchedules, deleteSchedule } from '../../services/adminService';
import ScheduleFormModal from '../../components/admin/ScheduleFormModal';
import { Plus, Edit, Trash2, Search, MapPin } from 'lucide-react';

export default function ScheduleManagementPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  // Filters
  const [hariFilter, setHariFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (hariFilter) filters.hari = hariFilter;
      if (searchFilter) filters.mata_kuliah = searchFilter;
      
      const res = await getAllSchedules(filters);
      setSchedules(res.data || []);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      alert("Gagal mengambil data jadwal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [hariFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus jadwal ini? Jadwal yang sudah memiliki sesi aktif mungkin tidak bisa dihapus.")) return;
    
    try {
      await deleteSchedule(id);
      alert("Jadwal berhasil dihapus.");
      fetchSchedules();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert(error?.response?.data?.message || "Gagal menghapus jadwal. Pastikan tidak ada sesi aktif.");
    }
  };

  const handleOpenModal = (schedule = null) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleCloseModal = (shouldRefresh) => {
    setIsModalOpen(false);
    setSelectedSchedule(null);
    if (shouldRefresh) {
      fetchSchedules();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Jadwal</h2>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Tambah Jadwal Baru
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari mata kuliah..." 
              className="w-full border-none focus:ring-0 text-sm"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSchedules()}
            />
          </div>
          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
          <select 
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={hariFilter}
            onChange={(e) => setHariFilter(e.target.value)}
          >
            <option value="">Semua Hari</option>
            <option value="Senin">Senin</option>
            <option value="Selasa">Selasa</option>
            <option value="Rabu">Rabu</option>
            <option value="Kamis">Kamis</option>
            <option value="Jumat">Jumat</option>
          </select>
          <button 
            onClick={fetchSchedules}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm transition-colors"
          >
            Cari
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Mata Kuliah</th>
                  <th className="px-4 py-3 font-medium">Dosen</th>
                  <th className="px-4 py-3 font-medium">Waktu & Kelas</th>
                  <th className="px-4 py-3 font-medium">Lokasi Absensi</th>
                  <th className="px-4 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Belum ada data jadwal.</td>
                  </tr>
                ) : (
                  schedules.map((schedule) => (
                    <tr key={schedule.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{schedule.mata_kuliah}</div>
                        <div className="text-xs text-gray-500">Semester {schedule.semester}</div>
                      </td>
                      <td className="px-4 py-3">{schedule.dosen?.nama || `Dosen ID: ${schedule.dosen_id}`}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-blue-600">{schedule.hari}, {schedule.jam_mulai} - {schedule.jam_selesai}</div>
                        <div className="text-xs text-gray-500">Kelas {schedule.kelas}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-red-500" />
                          <span className="font-medium">{schedule.lokasi_nama}</span>
                        </div>
                        <div className="text-xs text-gray-500">Radius: {schedule.radius_meter}m</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(schedule)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(schedule.ID)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <ScheduleFormModal 
          schedule={selectedSchedule} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}
