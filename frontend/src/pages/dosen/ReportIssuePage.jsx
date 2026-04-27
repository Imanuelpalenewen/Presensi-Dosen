// ============================================================
// pages/dosen/ReportIssuePage.jsx
// ✅ [ANGGOTA 1 - KAMU] Halaman laporan kendala dosen ke admin.
//
// Fitur ini digunakan ketika dosen TIDAK BISA melakukan absensi
// karena kendala teknis (GPS mati, sesi expired, sinyal lemah, dll).
// Pesan yang dikirim akan masuk ke inbox admin di halaman MessageInboxPage.
//
// Fitur yang harus dibuat:
//  1. Form: pilih jenis kendala (dropdown), isi keterangan (textarea)
//  2. Opsional: pilih sesi yang bermasalah dari daftar sesi hari ini
//  3. Tombol kirim → panggil messageService.sendIssueToAdmin()
//  4. Tampilkan konfirmasi sukses setelah terkirim
//  5. Tombol kembali ke halaman absen
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import { sendIssueToAdmin } from '../../services/messageService'
import { getActiveSessions } from '../../services/dosenService'

// Daftar jenis kendala yang bisa dipilih dosen
const JENIS_KENDALA = [
  { value: 'gps_mati', label: 'GPS tidak aktif / tidak bisa diakses' },
  { value: 'sesi_expired', label: 'Sesi sudah expired sebelum saya absen' },
  { value: 'diluar_radius', label: 'Saya di kelas tapi sistem bilang di luar radius' },
  { value: 'sinyal_lemah', label: 'Sinyal internet/GPS lemah di dalam gedung' },
  { value: 'sesi_tidak_muncul', label: 'Sesi kelas tidak muncul di aplikasi' },
  { value: 'lainnya', label: 'Kendala lainnya (jelaskan di keterangan)' },
]

export default function ReportIssuePage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [form, setForm] = useState({
    jenisKendala: '',
    keterangan: '',
    sessionId: '',
  })
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)
  const [error, setError] = useState('')

  // TODO: Fetch sesi hari ini (aktif maupun tidak) untuk opsi dropdown
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getActiveSessions()
        setSessions(data)
      } catch (_) {
        // Tidak fatal jika gagal, dosen tetap bisa kirim tanpa pilih sesi
      }
    }
    fetch()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.jenisKendala || !form.keterangan.trim()) {
      setError('Mohon pilih jenis kendala dan isi keterangan.')
      return
    }

    setLoading(true)
    try {
      // TODO: Kirim pesan ke admin via messageService
      // Judul: otomatis dari jenis kendala yang dipilih
      const judulKendala = JENIS_KENDALA.find(
        (k) => k.value === form.jenisKendala
      )?.label

      await sendIssueToAdmin({
        judul: `[Kendala Absensi] ${judulKendala}`,
        isi: form.keterangan,
        sessionId: form.sessionId || null,
      })
      setSukses(true)
    } catch (err) {
      setError(err.response?.data?.pesan || 'Gagal mengirim laporan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (sukses) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          {/* TODO: Tampilan sukses setelah pesan terkirim */}
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-green-700 mb-2">
            Laporan Terkirim!
          </h3>
          <p className="text-gray-500 mb-6">
            Admin sudah menerima laporan kendalamu dan akan segera menindaklanjuti.
          </p>
          <button
            onClick={() => navigate('/dosen/absen')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali ke Halaman Absen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/dosen/absen')}
          className="text-sm text-blue-600 hover:underline mb-4 block"
        >
          ← Kembali ke Absensi
        </button>

        <h2 className="text-xl font-bold mb-1">Laporkan Kendala Absensi</h2>
        <p className="text-sm text-gray-500 mb-6">
          Jika kamu tidak bisa melakukan absensi karena kendala teknis, isi formulir
          ini. Pesanmu akan langsung masuk ke inbox admin.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
          {/* TODO: Dropdown pilih sesi yang bermasalah (opsional) */}
          {sessions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sesi yang Bermasalah (opsional)
              </label>
              <select
                value={form.sessionId}
                onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                className="w-full border px-3 py-2 rounded-lg text-sm"
              >
                <option value="">-- Pilih sesi (opsional) --</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.mata_kuliah} — {s.kelas} ({s.jam_mulai}–{s.jam_selesai})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TODO: Dropdown jenis kendala */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Kendala <span className="text-red-500">*</span>
            </label>
            <select
              value={form.jenisKendala}
              onChange={(e) => setForm({ ...form, jenisKendala: e.target.value })}
              required
              className="w-full border px-3 py-2 rounded-lg text-sm"
            >
              <option value="">-- Pilih jenis kendala --</option>
              {JENIS_KENDALA.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          {/* TODO: Textarea keterangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan Detail <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={4}
              required
              placeholder="Ceritakan kendala yang kamu alami secara detail..."
              className="w-full border px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Mengirim...' : '📨 Kirim Laporan ke Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
