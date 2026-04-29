import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const RekapProdi = () => {
  const [recap, setRecap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProdiData();
  }, []);

  const fetchProdiData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/report-prodi');
      setRecap(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching prodi data:', err);
      setError('Gagal memuat rekap prodi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-lg font-bold text-gray-800">Rekap Kehadiran Per Program Studi</h4>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : recap.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Tidak ada data program studi.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recap.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-gray-800 text-lg">{item.prodi}</h5>
                    <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Program Studi</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">
                    {item.total_dosen} Dosen
                  </span>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-600">Rata-rata Kehadiran</span>
                    <span className="text-lg font-bold text-blue-600">{item.rata_persentase?.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${item.rata_persentase}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RekapProdi;
