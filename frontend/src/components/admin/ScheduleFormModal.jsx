import React, { useState, useEffect } from 'react';
import { X, MapPin, Map } from 'lucide-react';
import { createSchedule, updateSchedule, getDosenList } from '../../services/adminService';
import MapPickerModal from '../common/MapPickerModal';

export default function ScheduleFormModal({ schedule, onClose }) {
  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    dosen_id: '',
    mata_kuliah: '',
    hari: 'Senin',
    jam_mulai: '',
    jam_selesai: '',
    kelas: '',
    semester: '',
    lokasi_nama: '',
    lokasi_lat: '',
    lokasi_lng: '',
    radius_meter: 100
  });

  useEffect(() => {
    // Fetch dosen list for dropdown
    const fetchDosen = async () => {
      try {
        const res = await getDosenList();
        setDosenList(res.data || []);
      } catch (err) {
        console.error("Failed to fetch dosen list", err);
      }
    };
    fetchDosen();

    if (schedule) {
      setFormData({
        dosen_id: schedule.dosen_id,
        mata_kuliah: schedule.mata_kuliah,
        hari: schedule.hari,
        jam_mulai: schedule.jam_mulai,
        jam_selesai: schedule.jam_selesai,
        kelas: schedule.kelas,
        semester: schedule.semester,
        lokasi_nama: schedule.lokasi_nama,
        lokasi_lat: schedule.lokasi_lat,
        lokasi_lng: schedule.lokasi_lng,
        radius_meter: schedule.radius_meter
      });
    }
  }, [schedule]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type === 'number') finalValue = Number(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    // Convert to proper types
    const payload = {
      ...formData,
      dosen_id: Number(formData.dosen_id),
      lokasi_lat: Number(formData.lokasi_lat),
      lokasi_lng: Number(formData.lokasi_lng),
      radius_meter: Number(formData.radius_meter)
    };

    try {
      if (schedule) {
        await updateSchedule(schedule.ID, payload);
      } else {
        await createSchedule(payload);
      }
      onClose(true); // close and refresh
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Terjadi kesalahan saat menyimpan jadwal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">
            {schedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
          </h3>
          <button 
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosen Pengampu</label>
              <select 
                name="dosen_id"
                value={formData.dosen_id}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="" disabled>Pilih Dosen</option>
                {dosenList.map(d => (
                  <option key={d.ID} value={d.ID}>{d.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Kuliah</label>
              <input 
                type="text"
                name="mata_kuliah"
                value={formData.mata_kuliah}
                onChange={handleChange}
                required
                placeholder="Contoh: Pemrograman Web"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <input 
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  placeholder="Genap 2023"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <input 
                  type="text"
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleChange}
                  required
                  placeholder="A"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
              <select 
                name="hari"
                value={formData.hari}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
                <input 
                  type="time"
                  name="jam_mulai"
                  value={formData.jam_mulai}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
                <input 
                  type="time"
                  name="jam_selesai"
                  value={formData.jam_selesai}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <MapPin size={16} className="text-red-500" />
                  Konfigurasi Lokasi Absensi (GPS)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  <Map size={14} />
                  Pilih di Peta
                </button>
              </div>

              {/* Map preview strip when coords are set */}
              {formData.lokasi_lat && formData.lokasi_lng && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800 text-sm">
                    <MapPin size={14} className="text-green-600" />
                    <span className="font-medium">Lokasi dipilih:</span>
                    <span className="font-mono text-xs">{Number(formData.lokasi_lat).toFixed(6)}, {Number(formData.lokasi_lng).toFixed(6)}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${formData.lokasi_lat},${formData.lokasi_lng}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Verifikasi ↗
                  </a>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi</label>
                  <input 
                    type="text"
                    name="lokasi_nama"
                    value={formData.lokasi_nama}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Gedung A, Ruang 201"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="any"
                      name="lokasi_lat"
                      value={formData.lokasi_lat}
                      onChange={handleChange}
                      required
                      placeholder="Klik tombol Pilih di Peta atau masukkan manual"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                    />
                    <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="any"
                      name="lokasi_lng"
                      value={formData.lokasi_lng}
                      onChange={handleChange}
                      required
                      placeholder="Klik tombol Pilih di Peta atau masukkan manual"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                    />
                    <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Radius Absensi (meter)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range"
                      name="radius_meter"
                      min="10"
                      max="1000"
                      step="10"
                      value={formData.radius_meter}
                      onChange={handleChange}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="font-semibold text-blue-600 w-16 text-right">
                      {formData.radius_meter}m
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => onClose(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center min-w-[120px]"
            >
              {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapPickerModal
          initialLat={formData.lokasi_lat || 0}
          initialLng={formData.lokasi_lng || 0}
          radius={Number(formData.radius_meter) || 100}
          onConfirm={(lat, lng) => {
            setFormData(prev => ({ ...prev, lokasi_lat: lat, lokasi_lng: lng }))
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
