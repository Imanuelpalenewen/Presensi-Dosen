import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getTodaySchedules, activateSession, closeSession } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  PlayCircle, StopCircle, Clock, MapPin, Users, QrCode,
  CheckCircle, AlertCircle, Copy, ExternalLink, RefreshCw,
} from 'lucide-react';

function useCountdown(expiredAt) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiredAt) return;
    const calc = () => Math.max(0, Math.floor((new Date(expiredAt) - Date.now()) / 1000));
    setSecondsLeft(calc());
    const id = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [expiredAt]);

  const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const s = String(secondsLeft % 60).padStart(2, '0');
  return { display: `${m}:${s}`, expired: secondsLeft === 0 };
}

function SessionBadge({ session }) {
  if (!session) return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
      Belum Aktif
    </span>
  );
  const colors = {
    active: { bg: '#dcfce7', color: '#15803d' },
    closed: { bg: '#fee2e2', color: '#dc2626' },
    expired: { bg: '#fef9c3', color: '#ca8a04' },
  };
  const c = colors[session.status] || colors.expired;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: c.bg, color: c.color }}>
      {session.status === 'active' ? 'Sesi Aktif' : session.status === 'closed' ? 'Ditutup' : 'Kedaluwarsa'}
    </span>
  );
}

function QRModal({ session, scheduleInfo, onClose, onClose_session }) {
  const { display, expired } = useCountdown(session.expired_at);
  const token = session.qr_token;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 24, padding: '32px',
          maxWidth: 440, width: '100%',
          boxShadow: '0 32px 80px rgba(15,23,42,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>QR Code Absensi</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.4px' }}>{scheduleInfo.mata_kuliah}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {scheduleInfo.kelas} · {scheduleInfo.jam_mulai}–{scheduleInfo.jam_selesai}
          </div>
        </div>

        {/* QR */}
        <div style={{
          padding: 16, background: '#f8fafc', borderRadius: 16,
          border: expired ? '2px solid #fca5a5' : '2px solid #bbf7d0',
          opacity: expired ? 0.5 : 1,
        }}>
          <QRCodeSVG value={token} size={200} level="M" includeMargin={false} />
        </div>

        {/* Countdown */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: expired ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${expired ? '#fca5a5' : '#86efac'}`,
          borderRadius: 12, padding: '10px 20px',
        }}>
          <Clock size={16} color={expired ? '#dc2626' : '#16a34a'} />
          <span style={{ fontWeight: 700, fontSize: 22, fontFamily: 'monospace', color: expired ? '#dc2626' : '#15803d' }}>
            {expired ? 'EXPIRED' : display}
          </span>
          <span style={{ fontSize: 12, color: expired ? '#dc2626' : '#16a34a' }}>
            {expired ? '' : 'tersisa'}
          </span>
        </div>

        {/* Token String */}
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Token Absensi
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, background: '#f1f5f9', borderRadius: 8,
              padding: '8px 12px', fontSize: 12, color: '#475569',
              fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {token}
            </div>
            <button
              id="copy-link-btn"
              onClick={handleCopy}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: copied ? '#dcfce7' : '#e2e8f0',
                color: copied ? '#15803d' : '#64748b',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              }}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Disalin!' : 'Salin Token'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            id="close-session-btn"
            onClick={onClose_session}
            style={{
              flex: 1, padding: '11px', borderRadius: 10, border: 'none',
              background: '#fef2f2', color: '#dc2626',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
          >
            <StopCircle size={16} /> Tutup Sesi
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', borderRadius: 10, border: 'none',
              background: '#f1f5f9', color: '#475569',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleRow({ item, onActivate, onShowQR, activating }) {
  const hasActiveSession = item.session && item.session.status === 'active';
  const hasClosed = item.session && (item.session.status === 'closed' || item.session.status === 'expired');

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      border: '1px solid #e2e8f0', marginBottom: 12,
      boxShadow: '0 2px 8px rgba(30,45,120,0.05)',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(30,45,120,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,45,120,0.05)'; }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <SessionBadge session={item.session} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.3px', marginBottom: 6 }}>
            {item.mata_kuliah}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 13, color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={13} /> {item.dosen?.nama || `Dosen ID: ${item.dosen_id}`}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} /> {item.jam_mulai} – {item.jam_selesai} · Kelas {item.kelas}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={13} /> {item.lokasi_nama} ({item.radius_meter}m)
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {hasActiveSession && (
            <button
              id={`show-qr-${item.ID}`}
              onClick={() => onShowQR(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#1E2D78,#2d3f9e)',
                color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                boxShadow: '0 4px 14px rgba(30,45,120,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            >
              <QrCode size={15} /> Lihat QR
            </button>
          )}
          {!item.session && (
            <button
              id={`activate-${item.ID}`}
              onClick={() => onActivate(item.ID)}
              disabled={activating === item.ID}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: activating === item.ID ? '#cbd5e1' : 'linear-gradient(135deg,#10B981,#059669)',
                color: '#fff', cursor: activating === item.ID ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 13,
                boxShadow: activating === item.ID ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
                transition: 'all 0.2s',
              }}
            >
              <PlayCircle size={15} />
              {activating === item.ID ? 'Mengaktifkan...' : 'Aktifkan Sesi'}
            </button>
          )}
          {hasClosed && (
            <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Sesi selesai</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TodaySchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activating, setActivating] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTodaySchedules();
      setSchedules(res.data || []);
    } catch (err) {
      setError('Gagal memuat jadwal. Periksa koneksi atau login ulang.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleActivate = async (scheduleId) => {
    setActivating(scheduleId);
    try {
      await activateSession(scheduleId);
      await fetchSchedules();
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal mengaktifkan sesi.');
    } finally {
      setActivating(null);
    }
  };

  const handleShowQR = (item) => {
    setQrModal(item);
  };

  const handleCloseSession = async () => {
    if (!qrModal?.session?.ID) return;
    try {
      await closeSession(qrModal.session.ID);
      setQrModal(null);
      fetchSchedules();
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal menutup sesi.');
    }
  };

  const totalSchedules = schedules.length;
  const activeSchedules = schedules.filter((s) => s.session?.status === 'active').length;
  const unstartedSchedules = schedules.filter((s) => !s.session).length;
  const completedSchedules = schedules.filter((s) => s.session?.status === 'closed' || s.session?.status === 'expired').length;

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>{today}</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', marginBottom: 16 }}>
          Jadwal Hari Ini
        </h1>
        
        {/* Summary Section */}
        {!loading && totalSchedules > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 8 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Jadwal</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{totalSchedules}</span>
            </div>
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Sesi Aktif</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#15803d' }}>{activeSchedules}</span>
            </div>
            <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>Belum Dimulai</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#334155' }}>{unstartedSchedules}</span>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Selesai / Ditutup</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#b91c1c' }}>{completedSchedules}</span>
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          id="refresh-schedules-btn"
          onClick={fetchSchedules}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0',
            background: '#fff', color: '#64748b', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
        >
          <RefreshCw size={14} /> Muat Ulang
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '60px 0', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <LoadingSpinner message="Memuat jadwal hari ini..." />
        </div>
      ) : error ? (
        <div style={{ padding: '48px 24px', background: '#fff', borderRadius: 16, border: '1px solid #fca5a5', textAlign: 'center' }}>
          <AlertCircle size={36} color="#dc2626" style={{ marginBottom: 12 }} />
          <p style={{ color: '#dc2626', fontWeight: 600, margin: '0 0 14px' }}>{error}</p>
          <button
            onClick={fetchSchedules}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#1E2D78', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Coba Lagi
          </button>
        </div>
      ) : schedules.length === 0 ? (
        <div style={{ padding: '64px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>📅</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Tidak Ada Jadwal</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Belum ada jadwal kuliah untuk hari ini.</p>
        </div>
      ) : (
        schedules.map((item) => (
          <ScheduleRow
            key={item.ID}
            item={item}
            onActivate={handleActivate}
            onShowQR={handleShowQR}
            activating={activating}
          />
        ))
      )}

      {/* QR Modal */}
      {qrModal && qrModal.session && (
        <QRModal
          session={qrModal.session}
          scheduleInfo={qrModal}
          onClose={() => setQrModal(null)}
          onClose_session={handleCloseSession}
        />
      )}
    </div>
  );
}
