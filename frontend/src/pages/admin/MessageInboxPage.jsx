// ============================================================
// pages/admin/MessageInboxPage.jsx
// ✅ [ANGGOTA 2 - ADMIN] Inbox pesan kendala dari dosen.
//
// Fitur:
//  1. Daftar pesan masuk dari dosen yang tidak bisa absen
//  2. Filter: semua / belum dibaca / sudah dibaca
//  3. Setiap item tampilkan: nama dosen, judul kendala, isi pesan, waktu kirim, sesi terkait
//  4. Klik item → tandai sebagai dibaca (PATCH /api/admin/messages/:id/read)
//  5. Unread badge di Navbar (opsional, bisa polling setiap 30 detik)
//  Gunakan: messageService.getAdminMessages, markMessageAsRead
// ============================================================

import { useEffect, useState } from 'react'
import Navbar from '../../components/common/Navbar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getAdminMessages, markMessageAsRead } from '../../services/messageService'

export default function MessageInboxPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('') // '' = semua | 'unread' | 'read'

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      try {
        const data = await getAdminMessages(filter)
        setMessages(data)
      } catch (err) {
        console.error('Gagal ambil pesan:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [filter])

  // TODO: Tandai pesan sebagai dibaca lalu update state lokal agar tidak perlu refetch
  const handleMarkRead = async (id) => {
    try {
      await markMessageAsRead(id)
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m))
      )
    } catch (err) {
      console.error('Gagal tandai pesan:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">📨 Inbox Kendala Dosen</h2>

        {/* TODO: Filter tab — Semua / Belum Dibaca / Sudah Dibaca */}
        <div className="flex gap-2 mb-4">
          {[
            ['', 'Semua'],
            ['unread', 'Belum Dibaca'],
            ['read', 'Sudah Dibaca'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-1 rounded-full text-sm border ${
                filter === val
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner message="Memuat pesan..." />
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Tidak ada pesan.</p>
        ) : (
          // TODO: Render setiap pesan sebagai card yang bisa diklik
          messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => msg.status === 'unread' && handleMarkRead(msg.id)}
              className={`bg-white rounded-xl shadow p-4 mb-3 cursor-pointer border-l-4 ${
                msg.status === 'unread' ? 'border-yellow-400' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="font-semibold text-sm text-gray-800">{msg.dosen_nama}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    msg.status === 'unread'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {msg.status === 'unread' ? '● Baru' : 'Dibaca'}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800 mt-1">{msg.judul}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{msg.isi}</p>
              {/* TODO: Jika ada session_id, tampilkan info sesi yang bermasalah */}
              {msg.session_id && (
                <p className="text-xs text-blue-400 mt-1">
                  Terkait sesi: {msg.session_id}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">{msg.created_at}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
