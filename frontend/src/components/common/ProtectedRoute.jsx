// ============================================================
// components/common/ProtectedRoute.jsx
// SEMUA ANGGOTA: Komponen ini sudah menangani proteksi route.
// Tidak perlu diubah kecuali ada kebutuhan khusus.
// ============================================================

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// allowedRoles: array role yang boleh akses route ini
// Contoh: allowedRoles={['dosen']} atau allowedRoles={['admin', 'warek3']}
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, token } = useAuth()

  // Jika belum login → redirect ke login
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  // Jika role tidak sesuai → redirect ke login
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  // ✅ Fix: render children (DosenLayout/AdminLayout dll)
  // Sebelumnya <Outlet /> → DosenLayout tidak pernah dirender,
  // child routes langsung tampil tanpa header & BottomNav.
  // DosenLayout sudah punya <Outlet />-nya sendiri di dalam.
  return children
}