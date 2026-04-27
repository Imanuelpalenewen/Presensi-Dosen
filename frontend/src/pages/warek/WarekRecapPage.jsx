// ============================================================
// pages/warek/WarekRecapPage.jsx
// ✅ [ANGGOTA 3 - WAREK 3]
//
// Halaman rekap kehadiran semua dosen. READ-ONLY.
//
// Fitur:
//  1. Filter: rentang tanggal (dari–sampai) dan prodi
//  2. Tabel semua dosen: nama, prodi, total hadir, total pertemuan, persentase (%)
//  3. Warnai persentase: hijau ≥75%, kuning 50–74%, merah <50%
//  4. Tidak ada tombol edit/hapus apapun — hanya lihat
//  Gunakan: warekService.getFullRecap
// ============================================================

import { useEffect, useState } from 'react'
import Navbar from '../../components/common/Navbar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getFullRecap } from '../../services/warekService'

export default function WarekRecapPage() {
  const [recap, setRecap] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ dari_tanggal: '', sampai_tanggal: '', prodi: '' })

  useEffect(() => {
    const fetchRecap = async () => {
      setLoading(true)
      try {
        // TODO: Kirim filter ke API hanya jika ada nilai
        const params = Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '')
        )
        const data = await getFullRecap(params)
        setRecap(data)
      } catch (err) {
        console.error('Gagal ambil rekap:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecap()
  }, [filters])

  // TODO: Helper untuk warna badge persentase
  const badgeColor = (persen) => {
    if (persen >= 75) return 'bg-green-100 text-green-700'
    if (persen >= 50) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">Rekap Kehadiran Dosen</h2>

        {/* TODO: Filter rentang tanggal dan prodi */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="date"
            value={filters.dari_tanggal}
            onChange={(e) => setFilters({ ...filters, dari_tanggal: e.target.value })}
            className="border px-3 py-2 rounded-lg text-sm"
            placeholder="Dari tanggal"
          />
          <input
            type="date"
            value={filters.sampai_tanggal}
            onChange={(e) => setFilters({ ...filters, sampai_tanggal: e.target.value })}
            className="border px-3 py-2 rounded-lg text-sm"
            placeholder="Sampai tanggal"
          />
          {/* TODO: Input filter prodi (text atau dropdown dari API) */}
          <input
            type="text"
            value={filters.prodi}
            onChange={(e) => setFilters({ ...filters, prodi: e.target.value })}
            className="border px-3 py-2 rounded-lg text-sm"
            placeholder="Prodi (opsional)"
          />
        </div>

        {loading ? (
          <LoadingSpinner message="Memuat rekap..." />
        ) : recap.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Tidak ada data.</p>
        ) : (
          // TODO: Tabel rekap dosen READ-ONLY
          <table className="w-full bg-white rounded-xl shadow text-sm">
            <thead className="bg-blue-700 text-white">
              <tr>
                <th className="p-3 text-left">No</th>
                <th className="p-3 text-left">Nama Dosen</th>
                <th className="p-3 text-left">Prodi</th>
                <th className="p-3 text-left">Hadir</th>
                <th className="p-3 text-left">Total Pertemuan</th>
                <th className="p-3 text-left">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {recap.map((row, idx) => (
                <tr key={row.dosen_id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">{row.nama}</td>
                  <td className="p-3 text-gray-500">{row.prodi}</td>
                  <td className="p-3">{row.total_hadir}</td>
                  <td className="p-3">{row.total_pertemuan}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${badgeColor(row.persentase)}`}>
                      {row.persentase}%
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
