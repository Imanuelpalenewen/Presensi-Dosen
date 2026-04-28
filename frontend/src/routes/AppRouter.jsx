import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Dosen
import DosenLayout from '../components/dosen/DosenLayout';
import TakeAttendancePage from '../pages/dosen/TakeAttendancePage';
import ScanQRPage from '../pages/dosen/ScanQRPage';
import AttendanceHistoryPage from '../pages/dosen/AttendanceHistoryPage';
import ProfilePage from '../pages/dosen/ProfilePage';
import ReportIssuePage from '../pages/dosen/ReportIssuePage';

// Admin
import TodaySchedulePage from '../pages/admin/TodaySchedulePage';
import ScheduleManagementPage from '../pages/admin/ScheduleManagementPage';
import AttendanceRecapPage from '../pages/admin/AttendanceRecapPage';
import LocationConfigPage from '../pages/admin/LocationConfigPage';
import MessageInboxPage from '../pages/admin/MessageInboxPage';
import AdminLayout from '../components/admin/AdminLayout';

// Warek
import WarekDashboardPage from '../pages/warek/WarekDashboardPage';
import WarekRecapPage from '../pages/warek/WarekRecapPage';

export default function AppRouter() {
  return (
    <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Dosen */}
        <Route
          path="/dosen"
          element={
            <ProtectedRoute allowedRoles={['dosen']}>
              <DosenLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dosen/absen" replace />} />
          <Route path="absen" element={<TakeAttendancePage />} />
          <Route path="scan" element={<ScanQRPage />} />
          <Route path="riwayat" element={<AttendanceHistoryPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="laporan" element={<ReportIssuePage />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/jadwal-hari-ini" replace />} />
          <Route path="jadwal-hari-ini" element={<TodaySchedulePage />} />
          <Route path="jadwal" element={<ScheduleManagementPage />} />
          <Route path="rekap" element={<AttendanceRecapPage />} />
          <Route path="lokasi" element={<LocationConfigPage />} />
          <Route path="pesan" element={<MessageInboxPage />} />
        </Route>

        {/* Warek */}
        <Route
          path="/warek"
          element={
            <ProtectedRoute allowedRoles={['warek3']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/warek/dashboard" replace />} />
          <Route path="dashboard" element={<WarekDashboardPage />} />
          <Route path="rekap" element={<WarekRecapPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
  );
}