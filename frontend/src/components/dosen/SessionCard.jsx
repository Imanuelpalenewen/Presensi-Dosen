// ============================================================
// components/dosen/SessionCard.jsx
// ✅ [ANGGOTA 1 - KAMU] Kartu tampilan sesi aktif di halaman absensi.
//
// Props:
//   session: { id, mata_kuliah, kelas, jam_mulai, jam_selesai,
//              lokasi_nama, radius_meter, expired_at }
//   onAbsenClick: function(session) → dipanggil saat tombol "Absen Sekarang" diklik
// ============================================================

export default function SessionCard({ session, onAbsenClick }) {
  // TODO: Hitung sisa waktu expired QR dari session.expired_at
  // Tampilkan countdown seperti "Berlaku 12:34 lagi"

  return (
    <div className="bg-white rounded-xl shadow-md p-5 mb-4 border-l-4 border-green-500">
      {/* Status chip */}
      <div className="flex justify-between items-start mb-3">
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
          🟢 Sesi Aktif
        </span>
        {/* TODO: Tampilkan countdown expired */}
        <span className="text-xs text-gray-400">Berlaku: --:--</span>
      </div>

      {/* Info sesi */}
      {/* TODO: Tampilkan semua info sesi */}
      <h3 className="text-lg font-bold text-gray-800">{session.mata_kuliah}</h3>
      <p className="text-sm text-gray-500">
        Kelas {session.kelas} &nbsp;|&nbsp; {session.jam_mulai} – {session.jam_selesai}
      </p>
      <p className="text-sm text-gray-500 mt-1">
        📍 {session.lokasi_nama} &nbsp;|&nbsp; Radius valid: {session.radius_meter}m
      </p>

      {/* Tombol absen */}
      <button
        onClick={() => onAbsenClick(session)}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm"
      >
        📍 Absen Sekarang
      </button>
    </div>
  )
}
