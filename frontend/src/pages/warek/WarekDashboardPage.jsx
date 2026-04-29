import React from 'react'
import Navbar from '../../components/common/Navbar'
import DashboardLaporan from '../../components/warek/DashboardLaporan'
import { useNavigate } from 'react-router-dom'

export default function WarekDashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Monitoring Kehadiran</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang kembali, Wakil Rektor 3.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/warek/rekap')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-sm transition-all flex items-center"
            >
              Lihat Rekap Lengkap
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Komponen Laporan Utama dengan API & Chart */}
        <DashboardLaporan />
        
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="bg-blue-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border border-blue-100">
            <div className="mb-4 md:mb-0">
              <h4 className="text-blue-900 font-bold text-lg">Butuh rekap data lebih mendalam?</h4>
              <p className="text-blue-700 text-sm">Anda dapat mengunduh rekap atau memfilter data berdasarkan program studi dan rentang waktu.</p>
            </div>
            <button 
              onClick={() => navigate('/warek/rekap')}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm"
            >
              Buka Halaman Rekap
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
