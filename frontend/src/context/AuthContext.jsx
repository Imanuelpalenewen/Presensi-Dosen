// ============================================================
// context/AuthContext.jsx
// SEMUA ANGGOTA: Gunakan hook useAuth() untuk akses user & token.
// Jangan simpan token di tempat lain.
// ============================================================

import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // TODO: Inisialisasi state dari localStorage (cek apakah user sudah login sebelumnya)
  // Struktur user: { id, nama, email, role: 'dosen' | 'admin' | 'warek3' }
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser || savedUser === 'undefined') return null;
      return JSON.parse(savedUser);
    } catch (err) {
      console.error("Auth initialization error:", err);
      localStorage.removeItem('user');
      return null;
    }
  })
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return (savedToken && savedToken !== 'undefined') ? savedToken : null;
  })

  // TODO: Implementasi fungsi login — simpan token & user ke state dan localStorage
  const login = (userData, jwtToken) => {
    setUser(userData)
    setToken(jwtToken)
    localStorage.setItem('token', jwtToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  // TODO: Implementasi fungsi logout — hapus token dari state dan localStorage
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook untuk digunakan di seluruh komponen
export function useAuth() {
  return useContext(AuthContext)
}
