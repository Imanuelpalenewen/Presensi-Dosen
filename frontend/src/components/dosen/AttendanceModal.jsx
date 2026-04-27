// ============================================================
// components/dosen/AttendanceModal.jsx
// ✅ [ANGGOTA 1 - KAMU] Modal proses dan hasil absensi.
//
// Props:
//   session: data sesi yang sedang diabsen
//   gpsLoading: boolean — sedang mengambil GPS
//   gpsError: string | null — pesan error GPS
//   absenResult: null | { status, pesan, jam_absen, jarak_meter, jarak_aktual, radius_valid }
//   onClose: function — tutup modal
//   onLaporKendala: function — navigasi ke halaman laporan kendala
//
// Tampilan modal berdasarkan state:
//   1. gpsLoading=true          → tampilkan loading "Mengambil koordinat GPS..."
//   2. gpsError != null         → tampilkan error GPS + tombol "Laporkan Kendala"
//   3. absenResult = null & !gpsLoading → loading "Memproses absensi..."
//   4. absenResult.status='success' → konfirmasi hijau dengan jam & jarak
//   5. absenResult.status='error'   → pesan error merah + tombol "Laporkan Kendala"
// ============================================================

export default function AttendanceModal({
  session,
  gpsLoading,
  gpsError,
  absenResult,
  onClose,
  onLaporKendala,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="font-bold text-lg mb-1">{session?.mata_kuliah}</h3>
        <p className="text-sm text-gray-500 mb-4">
          Kelas {session?.kelas} — {session?.jam_mulai}
        </p>

        {/* ─── State 1: GPS Loading ─── */}
        {gpsLoading && (
          <div className="text-center py-6">
            {/* TODO: Spinner animasi */}
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Mengambil koordinat GPS kamu...</p>
            <p className="text-gray-400 text-xs mt-1">
              Pastikan GPS aktif dan izin lokasi diberikan.
            </p>
          </div>
        )}

        {/* ─── State 2: GPS Error ─── */}
        {!gpsLoading && gpsError && (
          <div className="text-center py-4">
            <p className="text-red-600 font-semibold mb-2">⚠️ GPS Gagal</p>
            <p className="text-sm text-gray-600 mb-4">{gpsError}</p>
            {/* TODO: Tombol lapor kendala jika GPS gagal */}
            <button
              onClick={onLaporKendala}
              className="w-full mb-2 bg-yellow-500 text-white py-2 rounded-lg text-sm hover:bg-yellow-600"
            >
              📨 Laporkan Kendala ke Admin
            </button>
            <button onClick={onClose} className="text-sm text-gray-400 hover:underline">
              Tutup
            </button>
          </div>
        )}

        {/* ─── State 3: Memproses absensi ─── */}
        {!gpsLoading && !gpsError && !absenResult && (
          <div className="text-center py-6">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Memproses absensi...</p>
          </div>
        )}

        {/* ─── State 4: Sukses ─── */}
        {absenResult?.status === 'success' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-green-700 font-bold text-lg">Absensi Berhasil!</p>
            <p className="text-sm text-gray-500 mt-1">{absenResult.pesan}</p>
            {/* TODO: Tampilkan detail: jam absen dan jarak ke kelas */}
            <div className="bg-green-50 rounded-lg p-3 mt-3 text-sm text-left">
              <p>🕐 Jam: <strong>{absenResult.jam_absen}</strong></p>
              <p>📍 Jarak: <strong>{absenResult.jarak_meter} meter dari kelas</strong></p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Selesai
            </button>
          </div>
        )}

        {/* ─── State 5: Error dari backend ─── */}
        {absenResult?.status === 'error' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">❌</div>
            <p className="text-red-700 font-bold">Absensi Gagal</p>
            <p className="text-sm text-gray-600 mt-1 mb-3">{absenResult.pesan}</p>

            {/* TODO: Jika OUT_OF_RADIUS, tampilkan info jarak aktual vs radius */}
            {absenResult.kode_error === 'OUT_OF_RADIUS' && (
              <div className="bg-red-50 rounded-lg p-3 text-sm text-left mb-3">
                <p>📍 Jarak kamu: <strong>{absenResult.jarak_aktual}m</strong></p>
                <p>🔒 Batas maksimum: <strong>{absenResult.radius_valid}m</strong></p>
                <p className="text-gray-400 text-xs mt-1">
                  Mendekat ke kelas atau hubungi admin untuk memperluas radius.
                </p>
              </div>
            )}

            {/* TODO: Tombol lapor kendala jika error backend */}
            <button
              onClick={onLaporKendala}
              className="w-full mb-2 bg-yellow-500 text-white py-2 rounded-lg text-sm hover:bg-yellow-600"
            >
              📨 Laporkan Kendala ke Admin
            </button>
            <button onClick={onClose} className="text-sm text-gray-400 hover:underline">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
