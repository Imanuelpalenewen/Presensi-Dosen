// ============================================================
// pages/warek/WarekDashboardPage.jsx
// ✅ [ANGGOTA 3 - WAREK 3]
//
// Halaman utama Wakil Rektor 3. READ-ONLY — tidak ada aksi apapun.
//
// Fitur:
//  1. 3 kartu statistik ringkasan di atas:
//     - Total Dosen Terdaftar
//     - Rata-rata Kehadiran Bulan Ini (dalam %)
//     - Total Pertemuan Bulan Ini
//  2. Link navigasi ke halaman Rekap Lengkap (/warek/rekap)
//  Gunakan: warekService.getDashboardStats
// ============================================================

import { useEffect, useState } from 'react'
import Navbar from '../../components/common/Navbar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getDashboardStats } from '../../services/warekService'
import { useNavigate } from 'react-router-dom'

export default function WarekDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (err) {
        console.error('Gagal ambil statistik:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-6">Dashboard Wakil Rektor 3</h2>

        {loading ? (
          <LoadingSpinner message="Memuat data..." />
        ) : (
          <>
            {/* TODO: Render 3 kartu statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{stats?.total_dosen}</p>
                <p className="text-sm text-gray-500 mt-1">Total Dosen</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {stats?.rata_kehadiran_persen}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Rata-rata Kehadiran Bulan Ini</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {stats?.total_pertemuan_bulan_ini}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total Pertemuan Bulan Ini</p>
              </div>
            </div>

            {/* TODO: Tombol navigasi ke halaman rekap */}
            <button
              onClick={() => navigate('/warek/rekap')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Lihat Rekap Kehadiran Lengkap →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
