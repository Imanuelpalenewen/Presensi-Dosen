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
  const [showPassword, setShowPassword] = useState(false) // Fitur Mata
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(email, password)
      const { token, user } = response.data // Ambil dari property .data
      
      authLogin(user, token)

      if (user.role === 'dosen') navigate('/dosen/absen')
      else if (user.role === 'admin') navigate('/admin/jadwal-hari-ini')
      else if (user.role === 'warek3') navigate('/warek/dashboard')
    } catch (err) {
      setError(err.response?.data?.pesan || 'Login gagal. Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  const fillAndSubmit = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setTimeout(() => {
      document.getElementById('login-btn').click()
    }, 100)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* Kiri - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-600 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="z-10 text-center space-y-6">
          <div className="bg-white/20 p-4 rounded-2xl inline-block backdrop-blur-sm">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Sistem Presensi Dosen</h1>
          <p className="text-indigo-100 text-lg max-w-md">Kehadiran lebih mudah, cepat, dan aman dengan teknologi QR Code dan validasi lokasi.</p>
        </div>
      </div>

      {/* Kanan - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center md:text-left">Selamat Datang 👋</h2>
            <p className="text-slate-500 mt-2 text-sm text-center md:text-left">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm border border-red-100 flex items-center gap-2 animate-shake">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="nama@mail.com"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 focus:ring-4 focus:ring-indigo-100 disabled:opacity-70 transition-all active:scale-[0.98]"
            >
              {loading ? "Memproses..." : "Masuk Sistem"}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100">
            <p className="text-xs text-center font-bold text-slate-400 mb-4 uppercase tracking-widest">Demo Akses Cepat</p>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button onClick={() => fillAndSubmit('dosen@mail.com', 'dosen123')} className="flex-1 min-w-[80px] py-2 px-1 text-[11px] font-semibold bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">🎓 Dosen</button>
              <button onClick={() => fillAndSubmit('admin@mail.com', 'admin123')} className="flex-1 min-w-[80px] py-2 px-1 text-[11px] font-semibold bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">🛠️ Admin</button>
              <button onClick={() => fillAndSubmit('warek@mail.com', 'warek123')} className="flex-1 min-w-[80px] py-2 px-1 text-[11px] font-semibold bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">📊 Warek</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
