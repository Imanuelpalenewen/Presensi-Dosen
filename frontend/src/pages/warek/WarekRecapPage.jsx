import React, { useState } from 'react'
import Navbar from '../../components/common/Navbar'
import RekapDosen from '../../components/warek/RekapDosen'
import RekapProdi from '../../components/warek/RekapProdi'
import { Link } from 'react-router-dom'

export default function WarekRecapPage() {
  const [activeTab, setActiveTab] = useState('dosen')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/warek/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center mb-4 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Rekapitulasi Kehadiran</h1>
          <p className="text-gray-500 text-sm mt-1">Laporan lengkap kehadiran dosen dan performa program studi.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-2xl w-full max-w-md mb-8">
          <button
            onClick={() => setActiveTab('dosen')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'dosen' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Rekap Per Dosen
          </button>
          <button
            onClick={() => setActiveTab('prodi')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'prodi' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Rekap Per Prodi
          </button>
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-300">
          {activeTab === 'dosen' ? (
            <RekapDosen />
          ) : (
            <RekapProdi />
          )}
        </div>

        {/* Export Action */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => window.print()}
            className="flex items-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v7" />
            </svg>
            Cetak Laporan (PDF)
          </button>
        </div>
      </main>
    </div>
  )
}
