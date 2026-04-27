// ============================================================
// components/common/Navbar.jsx
// SEMUA ANGGOTA: Navbar otomatis menyesuaikan menu sesuai role user.
// ============================================================

import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="font-bold text-lg">Sistem Presensi QR</h1>

      <div className="flex items-center gap-4">
        {/* TODO: Tampilkan nama user dan role */}
        <span className="text-sm">
          {user?.nama} ({user?.role})
        </span>

        {/* TODO: Tampilkan link navigasi sesuai role:
            - dosen: /dosen/absen, /dosen/riwayat, /dosen/laporan-kendala
            - admin: /admin/jadwal-hari-ini, /admin/jadwal, /admin/rekap, /admin/inbox
            - warek3: /warek/dashboard, /warek/rekap
        */}

        <button
          onClick={handleLogout}
          className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
