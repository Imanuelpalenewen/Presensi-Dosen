// ============================================================
// pages/dosen/AttendanceHistoryPage.jsx
// ✅ [ANGGOTA 1 - KAMU] Halaman riwayat absensi dosen.
//
// Fitur yang harus dibuat:
//  1. Dropdown filter bulan (default: bulan ini)
//  2. Tabel riwayat: tanggal, mata kuliah, kelas, jam absen, jarak (meter), status
//  3. Loading state saat fetch data
//  4. Pesan kosong jika tidak ada riwayat di bulan tersebut
// ============================================================

import { useEffect, useState } from 'react'
import Navbar from '../../components/common/Navbar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getAttendanceHistory } from '../../services/dosenService'

export default function AttendanceHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // TODO: Buat state untuk bulan aktif (format: "YYYY-MM")
  // Default: bulan ini. Contoh: "2024-04"
  const [bulan, setBulan] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const data = await getAttendanceHistory(bulan)
        setHistory(data)
      } catch (err) {
        console.error('Gagal mengambil riwayat:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [bulan])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Riwayat Absensi</h2>

          {/* TODO: Input filter bulan. Ubah state 'bulan' ketika berubah */}
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm"
          />
        </div>

        {loading ? (
          <LoadingSpinner message="Memuat riwayat absensi..." />
        ) : history.length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            Tidak ada data absensi di bulan ini.
          </p>
        ) : (
          // TODO: Tabel riwayat absensi
          // Kolom: No, Tanggal, Mata Kuliah, Kelas, Jam Absen, Jarak (meter), Status
          // Status: hadir (hijau) / tidak hadir (merah)
          <table className="w-full bg-white rounded-xl shadow text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">No</th>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Mata Kuliah</th>
                <th className="p-3 text-left">Kelas</th>
                <th className="p-3 text-left">Jam Absen</th>
                <th className="p-3 text-left">Jarak</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3">{item.tanggal}</td>
                  <td className="p-3">{item.mata_kuliah}</td>
                  <td className="p-3">{item.kelas}</td>
                  <td className="p-3">{item.jam_absen}</td>
                  <td className="p-3">{item.jarak_meter}m</td>
                  <td className="p-3">
                    {/* TODO: Warnai sesuai status */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'hadir'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
