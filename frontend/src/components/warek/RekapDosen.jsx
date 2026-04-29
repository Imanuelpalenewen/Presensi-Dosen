import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const RekapDosen = () => {
  const [recap, setRecap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for filters
  const [filters, setFilters] = useState({
    prodi: '',
    dari_tanggal: '',
    sampai_tanggal: '',
    nama: ''
  });

  useEffect(() => {
    fetchRecapData();
  }, [filters.prodi, filters.dari_tanggal, filters.sampai_tanggal]); // Re-fetch when specific filters change

  const fetchRecapData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/report', {
        params: {
          prodi: filters.prodi,
          dari_tanggal: filters.dari_tanggal,
          sampai_tanggal: filters.sampai_tanggal
        }
      });
      setRecap(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching recap data:', err);
      setError('Gagal memuat rekap dosen.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  // Client-side search for name
  const filteredRecap = recap.filter(item => 
    item.nama.toLowerCase().includes(filters.nama.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-lg font-bold text-gray-800">Rekap Kehadiran Per Dosen</h4>
        
        {/* Filter Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 no-print">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cari Nama</label>
            <input 
              type="text" 
              name="nama"
              value={filters.nama}
              onChange={handleFilterChange}
              placeholder="Nama dosen..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Program Studi</label>
            <select 
              name="prodi"
              value={filters.prodi}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Prodi</option>
              <option value="Informatika">Informatika</option>
              <option value="Sistem Informasi">Sistem Informasi</option>
              <option value="Teknik Komputer">Teknik Komputer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dari Tanggal</label>
            <input 
              type="date" 
              name="dari_tanggal"
              value={filters.dari_tanggal}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
            <input 
              type="date" 
              name="sampai_tanggal"
              value={filters.sampai_tanggal}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredRecap.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada data ditemukan.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-4">Nama Dosen</th>
                <th className="px-6 py-4">Prodi</th>
                <th className="px-6 py-4 text-center">Hadir</th>
                <th className="px-6 py-4 text-center">Total</th>
                <th className="px-6 py-4">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecap.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{item.nama}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{item.prodi || '-'}</td>
                  <td className="px-6 py-4 text-center text-gray-700 font-medium">{item.total_hadir}</td>
                  <td className="px-6 py-4 text-center text-gray-700 font-medium">{item.total_pertemuan}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                        <div 
                          className={`h-full rounded-full ${item.persentase >= 80 ? 'bg-emerald-500' : item.persentase >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${item.persentase}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-bold ${item.persentase >= 80 ? 'text-emerald-600' : item.persentase >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {item.persentase?.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RekapDosen;
