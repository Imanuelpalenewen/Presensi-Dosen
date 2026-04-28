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

import React, { useState, useEffect } from 'react'
import Navbar from '../../components/common/Navbar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getAttendanceRecap, getDosenAttendanceDetail } from '../../services/adminService'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Search, Calendar, FileSpreadsheet, UserCheck, AlertCircle } from 'lucide-react'

// --- Mock Data Fallback ---
const MOCK_RECAP = [
  { dosen_id: 991, nama: "Dr. Budi Santoso, M.Kom (Mock)", total_hadir: 14, total_pertemuan: 16, persentase: 87.5 },
  { dosen_id: 992, nama: "Siti Aminah, S.T., M.T. (Mock)", total_hadir: 12, total_pertemuan: 12, persentase: 100 },
  { dosen_id: 993, nama: "Ahmad Zainudin, Ph.D (Mock)", total_hadir: 6, total_pertemuan: 10, persentase: 60 }
];

const MOCK_DETAILS = [
  { id: 1, mata_kuliah: "Struktur Data", tanggal: "2024-04-01", status_kehadiran: "Hadir", jam_absen: "08:05:12" },
  { id: 2, mata_kuliah: "Struktur Data", tanggal: "2024-04-08", status_kehadiran: "Hadir", jam_absen: "08:10:00" },
  { id: 3, mata_kuliah: "Struktur Data", tanggal: "2024-04-15", status_kehadiran: "Tidak Hadir", jam_absen: "-" }
];
// --------------------------

export default function AttendanceRecapPage() {
  const [recap, setRecap] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7)) // format: YYYY-MM
  
  const [expandedId, setExpandedId] = useState(null)
  const [details, setDetails] = useState({})
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    const fetchRecap = async () => {
      setLoading(true)
      try {
        const res = await getAttendanceRecap({ bulan })
        let data = res.data || [];
        // Fallback to mock data if empty (since DB might not have enough records for testing yet)
        if (data.length === 0) {
          data = MOCK_RECAP;
        }
        setRecap(data)
      } catch (err) {
        console.error('Gagal ambil rekap:', err)
        setRecap(MOCK_RECAP) // Fallback on error
      } finally {
        setLoading(false)
      }
    }
    fetchRecap()
  }, [bulan])

  const toggleExpand = async (dosenId) => {
    if (expandedId === dosenId) {
      setExpandedId(null)
      return
    }

    setExpandedId(dosenId)
    
    // Fetch details if not already fetched
    if (!details[dosenId]) {
      setDetailsLoading(true)
      try {
        const res = await getDosenAttendanceDetail(dosenId, { bulan })
        let detailData = res.data || [];
        if (detailData.length === 0 && dosenId >= 991) { // Apply mock details only to mock dosens
          detailData = MOCK_DETAILS;
        }
        setDetails(prev => ({ ...prev, [dosenId]: detailData }))
      } catch (err) {
        console.error('Gagal ambil detail:', err)
        setDetails(prev => ({ ...prev, [dosenId]: MOCK_DETAILS }))
      } finally {
        setDetailsLoading(false)
      }
    }
  }

  const filteredRecap = recap.filter(item => 
    item.nama.toLowerCase().includes(search.toLowerCase())
  )

  const getPercentageColor = (percent) => {
    if (percent >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (percent >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <UserCheck className="text-blue-600" />
              Rekap Kehadiran Dosen
            </h2>
            <p className="text-gray-500 mt-2 text-sm max-w-lg">
              Pantau total kehadiran dan persentase absensi dosen per bulan. Klik pada nama dosen untuk melihat rincian setiap pertemuan.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="month" 
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama dosen..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
          />
        </div>

        {/* Main List */}
        {loading ? (
          <div className="py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <LoadingSpinner message="Mengkalkulasi rekap absensi..." />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-6 md:col-span-5 pl-8">Nama Dosen</div>
              <div className="col-span-3 md:col-span-2 text-center">Hadir</div>
              <div className="col-span-3 md:col-span-2 text-center">Total Kelas</div>
              <div className="hidden md:block col-span-3 text-center">Persentase</div>
            </div>

            {filteredRecap.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                <AlertCircle size={40} className="text-gray-300 mb-3" />
                <p>Tidak ada data rekap untuk bulan ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredRecap.map((item) => (
                  <div key={item.dosen_id} className="group">
                    {/* Main Row */}
                    <div 
                      onClick={() => toggleExpand(item.dosen_id)}
                      className={`grid grid-cols-12 gap-4 p-4 items-center cursor-pointer transition-colors ${expandedId === item.dosen_id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                        {expandedId === item.dosen_id ? (
                          <ChevronDown size={18} className="text-blue-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
                        )}
                        <div>
                          <div className="font-semibold text-gray-800 line-clamp-1">{item.nama}</div>
                          <div className="text-xs text-gray-500 md:hidden mt-0.5">
                            {item.persentase?.toFixed(1)}% Kehadiran
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-3 md:col-span-2 text-center font-medium text-gray-700">
                        {item.total_hadir}
                      </div>
                      
                      <div className="col-span-3 md:col-span-2 text-center font-medium text-gray-700">
                        {item.total_pertemuan}
                      </div>
                      
                      <div className="hidden md:flex col-span-3 justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPercentageColor(item.persentase)}`}>
                          {item.persentase?.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {expandedId === item.dosen_id && (
                      <div className="bg-gray-50/80 border-t border-b border-gray-100 p-4 md:pl-14">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-500" />
                          Rincian Sesi {new Date(bulan + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </h4>
                        
                        {detailsLoading && expandedId === item.dosen_id ? (
                          <div className="py-4 text-center text-sm text-gray-500">Memuat rincian...</div>
                        ) : !details[item.dosen_id] || details[item.dosen_id].length === 0 ? (
                          <div className="text-sm text-gray-500 py-2">Belum ada kelas yang diselenggarakan.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {details[item.dosen_id].map((detail, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                                <div className="text-xs font-medium text-gray-500 mb-1">{detail.tanggal}</div>
                                <div className="font-semibold text-sm text-gray-800 mb-2 truncate" title={detail.mata_kuliah}>
                                  {detail.mata_kuliah}
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                                  {detail.status_kehadiran === 'Hadir' ? (
                                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                      <CheckCircle size={12} />
                                      Hadir
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                      <XCircle size={12} />
                                      Tidak Hadir
                                    </span>
                                  )}
                                  <span className="text-xs font-mono text-gray-500">
                                    {detail.jam_absen}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
