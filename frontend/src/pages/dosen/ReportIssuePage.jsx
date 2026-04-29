import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dosenService from '../../services/dosenService';
import { AlertCircle, Clock, XCircle, RefreshCw, MessageCircle, ArrowLeft, Send } from 'lucide-react';

const ISSUE_TYPES = [
  { value: 'gps_not_accurate', label: 'GPS Tidak Akurat',     desc: 'Lokasi terdeteksi salah padahal sudah di kelas', Icon: AlertCircle },
  { value: 'session_expired',  label: 'Sesi Sudah Expired',   desc: 'Sesi kedaluwarsa sebelum sempat absen',          Icon: Clock       },
  { value: 'token_invalid',    label: 'Token Tidak Valid',     desc: 'Token QR tidak dikenali sistem',                Icon: XCircle     },
  { value: 'already_marked',   label: 'Sudah Ditandai Hadir', desc: 'Sistem menganggap sudah absen padahal belum',   Icon: RefreshCw   },
  { value: 'other',            label: 'Lainnya',              desc: 'Masalah lain yang tidak termasuk di atas',      Icon: MessageCircle },
];

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [issueType, setIssueType] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!issueType || !subject.trim() || !body.trim()) {
      setError('Harap lengkapi semua kolom terlebih dahulu.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await dosenService.sendMessage({
        judul: subject.trim(),
        isi: `[${issueType}] ${body.trim()}`,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim laporan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', padding: 32, textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#d1fae5', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 16,
        }}>
          <Send size={32} color="#059669" />
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
          Laporan Terkirim
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Laporan Anda telah diteruskan ke admin. Tim akan meninjau dan menghubungi Anda
          jika diperlukan tindakan lebih lanjut.
        </p>
        <button
          onClick={() => navigate('/dosen/absen')}
          style={{
            background: 'linear-gradient(135deg,#1E2D78,#2d3f9e)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '14px 28px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 6px 20px rgba(30,45,120,0.3)',
          }}
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#64748b', fontWeight: 600,
            padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <ArrowLeft size={14} /> Kembali
        </button>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.4px' }}>
          Laporkan Kendala
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Sampaikan masalah absensi Anda ke admin untuk ditindaklanjuti.
        </p>
      </div>

      {/* Issue type */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>
          Jenis Kendala *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ISSUE_TYPES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setIssueType(opt.value)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                border: `1.5px solid ${issueType === opt.value ? '#1E2D78' : '#e2e8f0'}`,
                background: issueType === opt.value ? '#eff6ff' : '#fff',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `2px solid ${issueType === opt.value ? '#1E2D78' : '#cbd5e1'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>
                {issueType === opt.value && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E2D78' }} />
                )}
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                  {opt.label}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
          Judul Laporan *
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Contoh: Tidak bisa absen Kalkulus Lanjut 14 Apr"
          maxLength={120}
          style={{
            width: '100%', padding: '13px 14px', borderRadius: 12,
            border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
            color: '#1e293b', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Body */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
          Detail Kendala *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Jelaskan kendala secara singkat: mata kuliah apa, kelas mana, jam berapa, dan apa yang terjadi…"
          rows={5}
          maxLength={800}
          style={{
            width: '100%', padding: '13px 14px', borderRadius: 12,
            border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
            color: '#1e293b', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>
          {body.length}/800
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12,
          padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: '100%', padding: '15px', borderRadius: 14, border: 'none',
          background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#1E2D78,#2d3f9e)',
          color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          boxShadow: !submitting ? '0 6px 20px rgba(30,45,120,0.3)' : 'none',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {submitting
          ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Mengirim…</>
          : <><Send size={16} /> Kirim Laporan</>
        }
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: '14px 0 0', lineHeight: 1.6 }}>
        Laporan akan diterima admin dan ditindaklanjuti dalam waktu 1x24 jam kerja.
      </p>
    </div>
  );
}