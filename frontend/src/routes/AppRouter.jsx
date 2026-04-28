// ============================================================
// routes/AppRouter.jsx
// SEMUA ANGGOTA: Tambahkan route baru di sini sesuai fitur.
// ============================================================
// Struktur routing:
//   /login                   → LoginPage (semua role)
//   /dosen/*                 → Protected (role: dosen)     [ANGGOTA 1 - KAMU]
//   /admin/*                 → Protected (role: admin)     [ANGGOTA 2]
//   /warek/*                 → Protected (role: warek3)    [ANGGOTA 3]
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/common/ProtectedRoute'

// Auth
import LoginPage from '../pages/auth/LoginPage'

// ─── [ANGGOTA 1] Halaman Dosen ───────────────────────
import TakeAttendancePage from '../pages/dosen/TakeAttendancePage'
import AttendanceHistoryPage from '../pages/dosen/AttendanceHistoryPage'
import ReportIssuePage from '../pages/dosen/ReportIssuePage'

// ─── [ANGGOTA 2] Halaman Admin ──────────────────────────────
import ScheduleManagementPage from '../pages/admin/ScheduleManagementPage'
import TodaySchedulePage from '../pages/admin/TodaySchedulePage'
import LocationConfigPage from '../pages/admin/LocationConfigPage'
import AttendanceRecapPage from '../pages/admin/AttendanceRecapPage'
import MessageInboxPage from '../pages/admin/MessageInboxPage'

// ─── [ANGGOTA 3] Halaman Warek 3 ────────────────────────────
import WarekDashboardPage from '../pages/warek/WarekDashboardPage'
import WarekRecapPage from '../pages/warek/WarekRecapPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* ─── Dosen Routes [ANGGOTA 1] ─── */}
        <Route element={<ProtectedRoute allowedRoles={['dosen']} />}>
          <Route path="/dosen/absen" element={<TakeAttendancePage />} />
          <Route path="/dosen/riwayat" element={<AttendanceHistoryPage />} />
          <Route path="/dosen/laporan-kendala" element={<ReportIssuePage />} />
        </Route>

        {/* ─── Admin Routes [ANGGOTA 2] ─── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/jadwal" element={<ScheduleManagementPage />} />
          <Route path="/admin/jadwal-hari-ini" element={<TodaySchedulePage />} />
          <Route path="/admin/lokasi" element={<LocationConfigPage />} />
          <Route path="/admin/rekap" element={<AttendanceRecapPage />} />
          <Route path="/admin/inbox" element={<MessageInboxPage />} />
        </Route>

        {/* ─── Warek 3 Routes [ANGGOTA 3] ─── */}
        <Route element={<ProtectedRoute allowedRoles={['warek3']} />}>
          <Route path="/warek/dashboard" element={<WarekDashboardPage />} />
          <Route path="/warek/rekap" element={<WarekRecapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
