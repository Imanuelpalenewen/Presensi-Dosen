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

import React, { useState, useEffect } from 'react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getAllSchedules, updateScheduleLocation } from '../../services/adminService'
import { MapPin, Navigation, Edit, Save, X, ExternalLink, Info, Search, CheckCircle, AlertCircle } from 'lucide-react'

export default function LocationConfigPage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  
  const [editForm, setEditForm] = useState({
    lokasi_nama: '',
    lokasi_lat: '',
    lokasi_lng: '',
    radius_meter: 100
  })

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const res = await getAllSchedules()
      setSchedules(res.data || [])
    } catch (err) {
      console.error('Failed to fetch schedules', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleEditClick = (schedule) => {
    setEditingId(schedule.ID)
    setEditForm({
      lokasi_nama: schedule.lokasi_nama,
      lokasi_lat: schedule.lokasi_lat,
      lokasi_lng: schedule.lokasi_lng,
      radius_meter: schedule.radius_meter
    })
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const handleSave = async (id) => {
    try {
      await updateScheduleLocation(id, {
        lokasi_nama: editForm.lokasi_nama,
        lokasi_lat: Number(editForm.lokasi_lat),
        lokasi_lng: Number(editForm.lokasi_lng),
        radius_meter: Number(editForm.radius_meter)
      })
      alert('Lokasi berhasil diperbarui!')
      setEditingId(null)
      fetchSchedules()
    } catch (err) {
      console.error('Save failed', err)
      alert(err?.response?.data?.message || 'Gagal menyimpan lokasi.')
    }
  }

  const filteredSchedules = schedules.filter(s => 
    s.mata_kuliah.toLowerCase().includes(search.toLowerCase()) || 
    s.lokasi_nama.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="text-blue-600" />
              Konfigurasi Lokasi Kelas
            </h2>
            <p className="text-gray-500 mt-1">Atur titik koordinat GPS dan radius absensi untuk setiap jadwal kelas.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari mata kuliah/lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow shadow-sm"
            />
          </div>
        </div>

        {/* Panduan Pengaturan Radius */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Panduan Pengaturan Radius</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="font-bold text-green-600 text-lg mb-1">30–100m</div>
              <div className="text-sm font-semibold text-gray-800 mb-1">Indoor (Lab/Kelas)</div>
              <div className="text-xs text-gray-500">Ruang yang terbatas, GPS lebih presisi</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="font-bold text-orange-500 text-lg mb-1">100–150m</div>
              <div className="text-sm font-semibold text-gray-800 mb-1">Outdoor (Lapangan/Aula)</div>
              <div className="text-xs text-gray-500">Area terbuka, sinyal bisa berfluktuasi</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="font-bold text-blue-800 text-lg mb-1">100m</div>
              <div className="text-sm font-semibold text-gray-800 mb-1">Default</div>
              <div className="text-xs text-gray-500">Direkomendasikan untuk kebanyakan kasus</div>
            </div>
          </div>
        </div>

        {/* Panduan Penggunaan Google Maps */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8 flex gap-4">
          <Info className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Panduan Mengambil Titik Koordinat</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Buka <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="font-bold underline">Google Maps</a> di browser Anda.</li>
              <li>Cari lokasi kelas/gedung tempat perkuliahan berlangsung.</li>
              <li>Klik kanan pada titik lokasi yang tepat, Anda akan melihat angka koordinat (misal: <code>-7.2504, 112.7688</code>).</li>
              <li>Klik angka tersebut untuk menyalin ke clipboard.</li>
              <li>Paste koordinat tersebut ke form Latitude (angka pertama) dan Longitude (angka kedua).</li>
            </ol>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Memuat jadwal kelas..." />
        ) : (
          <div className="space-y-4">
            {filteredSchedules.map(schedule => {
              const isEditing = editingId === schedule.ID
              
              return (
                <div key={schedule.ID} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 ${isEditing ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}>
                  {/* Header / Info Section */}
                  <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <h4 className="font-bold text-gray-800 text-lg">{schedule.mata_kuliah}</h4>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Kelas {schedule.kelas}
                        </span>
                        {schedule.lokasi_lat !== 0 && schedule.lokasi_lng !== 0 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                            <CheckCircle size={12} /> Terkonfigurasi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                            <AlertCircle size={12} /> Perlu Konfigurasi
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {schedule.dosen?.nama} • {schedule.hari}, {schedule.jam_mulai} - {schedule.jam_selesai}
                      </p>
                      
                      {!isEditing && (
                        <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                          <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            <Navigation size={14} />
                            <span className="font-medium">{schedule.lokasi_nama}</span>
                          </div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <span className="font-medium">Lat:</span> {schedule.lokasi_lat}
                          </div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <span className="font-medium">Lng:</span> {schedule.lokasi_lng}
                          </div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <span className="font-medium">Radius:</span> {schedule.radius_meter}m
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-start md:items-center gap-2 shrink-0">
                      {!isEditing ? (
                        <>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${schedule.lokasi_lat},${schedule.lokasi_lng}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <ExternalLink size={14} />
                            Cek Maps
                          </a>
                          <button 
                            onClick={() => handleEditClick(schedule)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                          >
                            <Edit size={14} />
                            Edit Lokasi
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={handleCancel}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={16} />
                          Batal
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Edit Form Section */}
                  {isEditing && (
                    <div className="bg-gray-50 border-t border-gray-100 p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nama Lokasi</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={editForm.lokasi_nama}
                            onChange={e => setEditForm({...editForm, lokasi_nama: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Latitude</label>
                          <input 
                            type="number" step="any"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={editForm.lokasi_lat}
                            onChange={e => setEditForm({...editForm, lokasi_lat: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Longitude</label>
                          <input 
                            type="number" step="any"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={editForm.lokasi_lng}
                            onChange={e => setEditForm({...editForm, lokasi_lng: e.target.value})}
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-end">
                          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider flex justify-between">
                            <span>Radius</span>
                            <span className="text-blue-600">{editForm.radius_meter}m</span>
                          </label>
                          <input 
                            type="range" min="10" max="1000" step="10"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2.5"
                            value={editForm.radius_meter}
                            onChange={e => setEditForm({...editForm, radius_meter: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button 
                          onClick={() => handleSave(schedule.ID)}
                          className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                        >
                          <Save size={16} />
                          Simpan Perubahan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            
            {filteredSchedules.length === 0 && (
              <div className="text-center py-10 bg-white border border-gray-200 rounded-xl">
                <p className="text-gray-500">Tidak ada jadwal yang cocok dengan pencarian Anda.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
