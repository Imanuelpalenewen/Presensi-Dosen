// ============================================================
// components/common/Navbar.jsx
// SEMUA ANGGOTA: Navbar otomatis menyesuaikan menu sesuai role user.
// ============================================================

import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const navLinks = {
    dosen: [
      { name: 'Absen', path: '/dosen/absen' },
      { name: 'Riwayat', path: '/dosen/riwayat' },
      { name: 'Laporan', path: '/dosen/laporan' },
    ],
    admin: [
      { name: 'Hari Ini', path: '/admin/jadwal-hari-ini' },
      { name: 'Jadwal', path: '/admin/jadwal' },
      { name: 'Rekap', path: '/admin/rekap' },
      { name: 'Lokasi', path: '/admin/lokasi' },
      { name: 'Inbox', path: '/admin/pesan' },
    ],
    warek3: [
      { name: 'Dashboard', path: '/warek/dashboard' },
      { name: 'Rekap', path: '/warek/rekap' },
    ],
  }

  const links = navLinks[user?.role] || []

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-lg hidden sm:block">SiPresQR</span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-slate-900 leading-none">{user?.nama}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user?.role}</span>
            </div>

            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              {user?.nama?.charAt(0)}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

