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
import * as XLSX from 'xlsx'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getAttendanceRecap, getDosenAttendanceDetail } from '../../services/adminService'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Search, Calendar, FileSpreadsheet, UserCheck, AlertCircle, Users, PieChart } from 'lucide-react'


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
        setRecap(res.data || [])
      } catch (err) {
        console.error('Gagal ambil rekap:', err)
        setRecap([])
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
    if (!details[dosenId]) {
      setDetailsLoading(true)
      try {
        const res = await getDosenAttendanceDetail(dosenId, { bulan })
        setDetails(prev => ({ ...prev, [dosenId]: res.data || [] }))
      } catch (err) {
        console.error('Gagal ambil detail:', err)
        setDetails(prev => ({ ...prev, [dosenId]: [] }))
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

  const totalDosen = recap.length;
  const totalPertemuan = recap.reduce((sum, item) => sum + (item.total_pertemuan || 0), 0);
  const totalHadir = recap.reduce((sum, item) => sum + (item.total_hadir || 0), 0);
  const avgKehadiran = totalPertemuan === 0 ? 0 : (totalHadir / totalPertemuan) * 100;

  const handleExportExcel = () => {
    if (recap.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const dataToExport = recap.map(item => ({
      "Nama Dosen": item.nama,
      "Hadir": item.total_hadir,
      "Tidak Hadir": item.total_pertemuan - item.total_hadir,
      "Persentase": `${item.persentase?.toFixed(1)}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Kehadiran");
    
    XLSX.writeFile(workbook, `Rekap_Kehadiran_${bulan}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
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
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Dosen</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalDosen}</h3>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sesi</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalPertemuan}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Hadir</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalHadir}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <PieChart size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rata-rata Kehadiran</p>
                <h3 className="text-2xl font-bold text-gray-800">{avgKehadiran.toFixed(1)}%</h3>
              </div>
            </div>
          </div>
        )}

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
