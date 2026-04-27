// ============================================================
// pages/auth/LoginPage.jsx
// SEMUA ANGGOTA: Halaman login dipakai semua role.
// Setelah login berhasil, redirect otomatis ke dashboard sesuai role.
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login } from '../../services/authService'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // TODO: Panggil authService.login()
      const { token, user } = await login(email, password)
      authLogin(user, token)

      // TODO: Redirect ke halaman utama masing-masing role:
      // dosen   → /dosen/absen
      // admin   → /admin/jadwal-hari-ini
      // warek3  → /warek/dashboard
      if (user.role === 'dosen') navigate('/dosen/absen')
      else if (user.role === 'admin') navigate('/admin/jadwal-hari-ini')
      else if (user.role === 'warek3') navigate('/warek/dashboard')
    } catch (err) {
      // TODO: Tampilkan pesan error dari backend (email/password salah, dll)
      setError(err.response?.data?.pesan || 'Login gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          Sistem Presensi QR
        </h2>

        {/* TODO: Tampilkan pesan error jika ada */}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TODO: Input email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nama@kampus.ac.id"
            />
          </div>

          {/* TODO: Input password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
