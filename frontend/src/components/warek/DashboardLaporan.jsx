import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import api from '../../services/api';

const DashboardLaporan = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Mengambil data statistik dari API
      const response = await api.get('/dashboard/stats');
      const data = response.data.data;
      
      setStats({
        totalDosen: data.total_dosen,
        rataHadir: data.rata_kehadiran_persen,
        totalPertemuan: data.total_pertemuan_bulan_ini
      });

      // Mapping data untuk chart (Contoh mapping, sesuaikan dengan struktur data API)
      // Jika API belum mengembalikan data chart, kita bisa menggunakan data stats sementara
      const mappedChartData = [
        { name: 'Total Dosen', value: data.total_dosen },
        { name: 'Total Pertemuan', value: data.total_pertemuan_bulan_ini },
        { name: 'Kehadiran (%)', value: data.rata_kehadiran_persen }
      ];
      setChartData(mappedChartData);

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard. Pastikan server backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading data laporan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 text-sm font-semibold underline hover:text-red-800"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Dosen</p>
          <h3 className="text-4xl font-bold mt-2">{stats?.totalDosen}</h3>
          <div className="mt-4 flex items-center text-blue-100 text-xs">
            <span className="bg-blue-400 bg-opacity-30 px-2 py-1 rounded-full">Aktif Semester Ini</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Rata-rata Kehadiran</p>
          <h3 className="text-4xl font-bold mt-2">{stats?.rataHadir?.toFixed(2)}%</h3>
          <div className="mt-4 flex items-center text-emerald-100 text-xs">
            <span className="bg-emerald-400 bg-opacity-30 px-2 py-1 rounded-full">Bulan Ini</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-amber-100 text-sm font-medium uppercase tracking-wider">Total Pertemuan</p>
          <h3 className="text-4xl font-bold mt-2">{stats?.totalPertemuan}</h3>
          <div className="mt-4 flex items-center text-amber-100 text-xs">
            <span className="bg-amber-400 bg-opacity-30 px-2 py-1 rounded-full">Bulan Ini</span>
          </div>
        </div>
      </div>

      {/* Visualisasi Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Statistik Kehadiran</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Trend Kehadiran</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLaporan;
