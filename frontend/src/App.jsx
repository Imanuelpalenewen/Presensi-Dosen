// ============================================================
// App.jsx — Root komponen aplikasi
// Semua anggota: jangan ubah file ini tanpa diskusi tim.
// ============================================================

import AppRouter from './routes/AppRouter'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      {/* AppRouter menangani semua routing dan proteksi halaman */}
      <AppRouter />
    </AuthProvider>
  )
}

export default App
