// ============================================================
// pages/dosen/TakeAttendancePage.jsx
// ✅ [ANGGOTA 1 - KAMU] Halaman utama absensi dosen (SIMPLIFIED)
// ============================================================

import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../context/AuthContext'

export default function TakeAttendancePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-10 border border-slate-100 text-center">
          <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎓</span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900">Selamat Datang, {user?.nama}!</h1>
          <p className="text-slate-500 mt-3 text-lg">
            Anda berhasil masuk sebagai <span className="font-bold text-indigo-600 uppercase">{user?.role}</span>.
          </p>
          
          <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 italic">Halaman presensi sedang dalam pengembangan.</p>
          </div>

          <div className="mt-8">
            <p className="text-sm text-slate-400">Gunakan menu di atas atau klik tombol logout di pojok kanan untuk keluar.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
