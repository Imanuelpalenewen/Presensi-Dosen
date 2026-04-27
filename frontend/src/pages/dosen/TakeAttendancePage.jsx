// ============================================================
// pages/dosen/TakeAttendancePage.jsx
// ✅ [ANGGOTA 1 - KAMU] Halaman utama absensi dosen.
//
// Fitur yang harus dibuat di halaman ini:
//  1. Fetch dan tampilkan kartu sesi aktif hari ini milik dosen
//  2. Tombol "Absen Sekarang" → trigger geolocation → submit ke backend
//  3. Tampil modal hasil (sukses dengan jarak, atau error dengan keterangan)
//  4. Jika ada kendala (GPS mati, dll) → tampilkan tombol "Laporkan Kendala"
//     yang mengarah ke /dosen/laporan-kendala
//  5. Jika tidak ada sesi aktif → tampilkan pesan kosong yang informatif
// ============================================================

import { useEffect, useState } from 'react'
import Navbar from '../../components/common/Navbar'
import SessionCard from '../../components/dosen/SessionCard'
import AttendanceModal from '../../components/dosen/AttendanceModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getActiveSessions, submitAttendance } from '../../services/dosenService'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useNavigate } from 'react-router-dom'

export default function TakeAttendancePage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [absenResult, setAbsenResult] = useState(null) // { status, pesan, jarak_meter, jam_absen }
  const { coords, loading: gpsLoading, error: gpsError, getLocation } = useGeolocation()
  const navigate = useNavigate()

  // TODO: Fetch sesi aktif saat halaman pertama dibuka
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getActiveSessions()
        setSessions(data)
      } catch (err) {
        console.error('Gagal mengambil sesi aktif:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  // TODO: Ketika tombol "Absen Sekarang" diklik pada SessionCard:
  // 1. Simpan session yang dipilih ke state
  // 2. Panggil getLocation() untuk ambil GPS
  // 3. Buka AttendanceModal dalam state "loading GPS"
  const handleAbsenClick = (session) => {
    setSelectedSession(session)
    setAbsenResult(null)
    setModalOpen(true)
    getLocation()
  }

  // TODO: Setelah koordinat GPS berhasil didapat (coords berubah),
  // otomatis panggil submitAttendance() dan simpan hasilnya ke absenResult.
  // Jika gagal OUT_OF_RADIUS → tampilkan jarak aktual vs radius valid.
  useEffect(() => {
    if (!coords || !selectedSession) return
    const doSubmit = async () => {
      try {
        const result = await submitAttendance(
          selectedSession.id,
          coords.latitude,
          coords.longitude
        )
        setAbsenResult(result)
      } catch (err) {
        // TODO: Tangani error dari backend dan set absenResult dengan keterangan error
        setAbsenResult({
          status: 'error',
          pesan: err.response?.data?.pesan || 'Terjadi kesalahan saat absensi.',
          jarak_aktual: err.response?.data?.jarak_aktual,
          radius_valid: err.response?.data?.radius_valid,
          kode_error: err.response?.data?.kode_error,
        })
      }
    }
    doSubmit()
  }, [coords])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">
          Sesi Aktif Hari Ini —{' '}
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h2>

        {loading ? (
          <LoadingSpinner message="Mengambil sesi aktif..." />
        ) : sessions.length === 0 ? (
          // TODO: Tampilkan pesan informatif jika tidak ada sesi aktif
          <div className="text-center py-10 text-gray-400">
            <p className="text-lg">Tidak ada sesi aktif saat ini.</p>
            <p className="text-sm mt-1">
              Hubungi admin jika jadwal kamu seharusnya ada hari ini.
            </p>
            {/* TODO: Tampilkan tombol "Laporkan Kendala" di sini */}
            <button
              onClick={() => navigate('/dosen/laporan-kendala')}
              className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
            >
              Laporkan Kendala ke Admin
            </button>
          </div>
        ) : (
          // TODO: Render SessionCard untuk setiap sesi aktif
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onAbsenClick={handleAbsenClick}
            />
          ))
        )}

        {/* TODO: Render AttendanceModal jika terbuka */}
        {modalOpen && (
          <AttendanceModal
            session={selectedSession}
            gpsLoading={gpsLoading}
            gpsError={gpsError}
            absenResult={absenResult}
            onClose={() => {
              setModalOpen(false)
              setSelectedSession(null)
            }}
            onLaporKendala={() => navigate('/dosen/laporan-kendala')}
          />
        )}
      </div>
    </div>
  )
}
