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

import React, { useEffect, useState } from 'react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getAdminMessages, markMessageAsRead } from '../../services/messageService'
import { Mail, MailOpen, AlertCircle, Clock, MapPin, User, CheckCircle2 } from 'lucide-react'

export default function MessageInboxPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('') // '' = semua | 'unread' | 'read'

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      try {
        const res = await getAdminMessages(filter)
        setMessages(res.data || [])
      } catch (err) {
        console.error('Gagal ambil pesan:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [filter])

  const handleMarkRead = async (id) => {
    try {
      await markMessageAsRead(id)
      setMessages((prev) =>
        prev.map((m) => (m.ID === id ? { ...m, status: 'read' } : m))
      )
    } catch (err) {
      console.error('Gagal tandai pesan:', err)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'unread') {
      return (
        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
          Belum Dibaca
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
        <CheckCircle2 size={12} className="text-gray-500" />
        Sudah Dibaca
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Mail className="text-blue-600" />
              Inbox Kendala Dosen
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Kelola laporan masalah dan keluhan yang dikirimkan oleh dosen.
            </p>
          </div>

          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            {[
              { val: '', label: 'Semua Pesan', icon: Mail },
              { val: 'unread', label: 'Belum Dibaca', icon: AlertCircle },
              { val: 'read', label: 'Sudah Dibaca', icon: MailOpen },
            ].map(({ val, label, icon: Icon }) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === val
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={16} className={filter === val ? 'text-blue-600' : 'text-gray-400'} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20">
            <LoadingSpinner message="Memuat pesan masuk..." />
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <MailOpen size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Tidak Ada Pesan</h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'Semua pesan laporan kendala sudah Anda baca.'
                : 'Belum ada laporan kendala yang masuk dari dosen.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.ID}
                onClick={() => msg.status === 'unread' && handleMarkRead(msg.ID)}
                className={`group relative bg-white rounded-xl shadow-sm border p-5 transition-all duration-200 ${
                  msg.status === 'unread' 
                    ? 'border-yellow-300 hover:border-yellow-400 hover:shadow-md cursor-pointer' 
                    : 'border-gray-200 opacity-80'
                }`}
              >
                {/* Indicator Line */}
                {msg.status === 'unread' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400 rounded-l-xl"></div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3 pl-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {msg.dosen?.nama || `Dosen ID: ${msg.dosen_id}`}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(msg.CreatedAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 pt-1">
                    {getStatusBadge(msg.status)}
                  </div>
                </div>

                <div className="pl-14">
                  <h5 className="font-medium text-gray-800 mb-1.5">{msg.judul}</h5>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {msg.isi}
                  </p>
                  
                  {msg.session && (
                    <div className="inline-flex items-center gap-2 bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800">
                      <MapPin size={14} className="text-blue-500" />
                      <span className="font-medium">Terkait Kelas:</span>
                      <span>
                        {msg.session.schedule?.mata_kuliah || 'Mata Kuliah'} - {msg.session.schedule?.kelas || 'Kelas'}
                      </span>
                    </div>
                  )}
                </div>
                
                {msg.status === 'unread' && (
                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                      <CheckCircle2 size={12} />
                      Tandai Dibaca
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
