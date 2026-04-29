import React, { useState } from 'react'
import Navbar from '../../components/common/Navbar'
import RekapDosen from '../../components/warek/RekapDosen'
import RekapProdi from '../../components/warek/RekapProdi'
import { Link } from 'react-router-dom'

export default function WarekRecapPage() {
  const [activeTab, setActiveTab] = useState('dosen')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="no-print">
        <Navbar />
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        {/* Formal Header for Print Only (Kop Surat) */}
        <div className="print-only mb-8 text-center border-b-4 border-double border-gray-800 pb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mr-4">
              SiP
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Universitas Teknologi Modern</h1>
              <p className="text-sm text-gray-600">Sistem Informasi Presensi Dosen Berbasis QR Code & Geolocation</p>
              <p className="text-xs text-gray-500">Jl. Teknologi No. 123, Kampus Pusat, Indonesia</p>
            </div>
          </div>
        </div>

        <div className="mb-8 no-print">
          <Link to="/warek/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center mb-4 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Rekapitulasi Kehadiran</h1>
          <p className="text-gray-500 text-sm mt-1">Laporan lengkap kehadiran dosen dan performa program studi.</p>
        </div>

        {/* Title for Print Only */}
        <div className="print-only mb-6">
          <h2 className="text-xl font-bold text-center underline uppercase">
            Laporan Kehadiran Dosen - {activeTab === 'dosen' ? 'Per Dosen' : 'Per Program Studi'}
          </h2>
          <p className="text-center text-sm text-gray-600 mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Tab Navigation (Hidden in Print) */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-2xl w-full max-w-md mb-8 no-print">
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
        <div className="print:block">
          {activeTab === 'dosen' ? (
            <RekapDosen />
          ) : (
            <RekapProdi />
          )}
        </div>

        {/* Signature for Print Only */}
        <div className="print-only mt-12 flex justify-end">
          <div className="text-center w-64">
            <p className="mb-20">Dicetak oleh, <br/><b>Wakil Rektor 3</b></p>
            <div className="border-b border-gray-800 w-full mx-auto"></div>
            <p className="mt-2 text-sm font-bold">Prof. Warek 3, M.T.</p>
          </div>
        </div>

        {/* Export Action (Hidden in Print) */}
        <div className="mt-8 flex justify-end no-print">
          <button 
            onClick={() => window.print()}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v7" />
            </svg>
            Cetak Laporan (PDF)
          </button>
        </div>
      </main>
    </div>
  )
}
