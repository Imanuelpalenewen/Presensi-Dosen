// ============================================================
// components/common/LoadingSpinner.jsx
// Komponen loading yang dipakai di semua halaman.
// Props: message (string) — teks yang ditampilkan di bawah spinner
// ============================================================

export default function LoadingSpinner({ message = 'Memuat...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      {/* TODO: Bisa diganti dengan animasi Tailwind atau library Lottie */}
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}
