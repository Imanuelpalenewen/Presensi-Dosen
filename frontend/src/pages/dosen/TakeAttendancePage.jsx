import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import dosenService from '../../services/dosenService';
import { useAuth } from '../../hooks/useAuth';

// Haversine distance (meters)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

function formatGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi,';
  if (h < 15) return 'Selamat siang,';
  if (h < 18) return 'Selamat sore,';
  return 'Selamat malam,';
}

function formatDateId() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Sesi Aktif', bg: '#dcfce7', color: '#16a34a' },
    expired: { label: 'QR Expired', bg: '#fef9c3', color: '#ca8a04' },
    closed: { label: 'Sesi Ditutup', bg: '#fee2e2', color: '#dc2626' },
  };
  const s = map[status] || map.active;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 700,
        padding: '5px 12px',
        borderRadius: 20,
        letterSpacing: '0.03em',
      }}
    >
      {s.label}
    </span>
  );
}

function DistanceBar({ distance, radius }) {
  const pct = Math.min((distance / radius) * 100, 100);
  const inRange = distance <= radius;
  return (
    <div
      style={{
        background: inRange ? '#f0fdf4' : '#fff7ed',
        border: `1px solid ${inRange ? '#bbf7d0' : '#fed7aa'}`,
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: inRange ? '#dcfce7' : '#fed7aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={inRange ? '#16a34a' : '#ea580c'}
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: inRange ? '#16a34a' : '#ea580c' }}>
            Anda ~{Math.round(distance)}m dari kelas
          </div>
          <div style={{ fontSize: 11, color: inRange ? '#16a34a' : '#ea580c', marginTop: 2 }}>
            {inRange ? 'Dalam jangkauan' : 'Di luar jangkauan'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', minWidth: 20 }}>0m</span>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 99,
            background: '#e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 99,
              background: inRange
                ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                : 'linear-gradient(90deg,#fb923c,#dc2626)',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', minWidth: 40, textAlign: 'right' }}>
          {radius}m
        </span>
      </div>
    </div>
  );
}

function SessionCard({ session, onAbsen, submitting, absenDone }) {
  const { location, loading: locLoading, error: locError, getLocation } = useGeolocation();
  const [distance, setDistance] = useState(null);
  const [watching, setWatching] = useState(false);

  const startWatch = useCallback(async () => {
    setWatching(true);
    try {
      const coords = await getLocation();
      const d = haversineDistance(
        coords.latitude,
        coords.longitude,
        session.lokasi_lat,
        session.lokasi_lng
      );
      setDistance(d);
    } catch {
      setWatching(false);
    }
  }, [getLocation, session]);

  useEffect(() => {
    if (!watching && !location) startWatch();
  }, []);

  const inRange = distance !== null && distance <= session.radius_meter;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '24px',
        boxShadow: '0 4px 24px rgba(30,45,120,0.09)',
        border: '1px solid #e8ecf4',
      }}
    >
      {/* Header with status badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
        <StatusBadge status={session.status} />
        {absenDone && (
          <span
            style={{
              background: '#dcfce7',
              color: '#15803d',
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 20,
            }}
          >
            Sudah Absen
          </span>
        )}
      </div>

      {/* Course Title */}
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: '0 0 18px', letterSpacing: '-0.5px' }}>
        {session.mata_kuliah}
      </h2>

      {/* Info Grid - Responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '14px',
      }}>
        {[
          { label: 'Kelas', value: `${session.kelas}` },
          { label: 'Waktu', value: `${session.jam_mulai}–${session.jam_selesai} WIB` },
          { label: 'Lokasi', value: session.lokasi_nama || 'Tidak diatur' },
          { label: 'Radius', value: `${session.radius_meter}m` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Distance Bar */}
      {locLoading && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid #3b82f6',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 500 }}>Mengambil lokasi GPS Anda...</span>
        </div>
      )}
      {locError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
            Gagal mendapatkan lokasi
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#ef4444' }}>{locError}</p>
          <button
            onClick={startWatch}
            style={{
              background: 'none',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              color: '#dc2626',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#fef2f2';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'none';
            }}
          >
            Coba Lagi
          </button>
        </div>
      )}
      {distance !== null && !absenDone && (
        <div style={{ marginBottom: 16 }}>
          <DistanceBar distance={distance} radius={session.radius_meter} />
        </div>
      )}

      {/* Action Button */}
      {!absenDone && (
        <button
          onClick={() => onAbsen(session, location)}
          disabled={submitting || locLoading || !location || !inRange}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: 14,
            border: 'none',
            background:
              submitting || locLoading || !location || !inRange
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #1E2D78 0%, #2d3f9e 100%)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor:
              submitting || locLoading || !location || !inRange
                ? 'not-allowed'
                : 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.02em',
            boxShadow:
              !submitting && !locLoading && location && inRange
                ? '0 8px 24px rgba(30,45,120,0.3)'
                : 'none',
          }}
          onMouseOver={(e) => {
            if (!submitting && !locLoading && location && inRange) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 28px rgba(30,45,120,0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!submitting && !locLoading && location && inRange) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 24px rgba(30,45,120,0.3)';
            }
          }}
        >
          {submitting
            ? 'Memproses...'
            : locLoading
            ? 'Mengambil Lokasi...'
            : !location
            ? 'Aktifkan GPS'
            : !inRange
            ? `Di Luar Jangkauan (${Math.round(distance)}m)`
            : 'Absen Sekarang'}
        </button>
      )}

      {absenDone && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: 14,
            padding: '20px 18px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: 24,
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>
            Absensi Berhasil
          </div>
          <div style={{ fontSize: 13, color: '#16a34a' }}>
            {distance !== null ? `${Math.round(distance)} meter dari kelas` : 'Dicatat dengan baik'}
          </div>
        </div>
      )}
    </div>
  );
}

function NoSession() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '48px 24px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(30,45,120,0.07)',
        border: '1px solid #e8ecf4',
      }}
    >
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: '#eff6ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: 28,
      }}>
        —
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
        Tidak Ada Sesi Aktif
      </h3>
      <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
        Belum ada sesi pembelajaran yang diaktifkan oleh admin untuk jadwal Anda hari ini. Silakan pantau secara berkala atau hubungi admin jika diperlukan.
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TakeAttendancePage() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [absenDone, setAbsenDone] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchSession = useCallback(async () => {
    try {
      setPageLoading(true);
      setPageError(null);
      const res = await dosenService.getActiveSession();
      const sessions = res.data?.data || [];
      setSession(Array.isArray(sessions) ? sessions[0] || null : sessions || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setSession(null);
      } else {
        setPageError('Gagal memuat data sesi. Periksa koneksi internet Anda.');
      }
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 30000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAbsen = async (sess, location) => {
    if (!location) return showToast('Lokasi GPS belum tersedia. Coba lagi.', 'error');
    try {
      setSubmitting(true);
      await dosenService.submitAttendance({
        session_id: sess.id,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setAbsenDone(true);
      showToast('Absensi berhasil dicatat! Selamat mengajar', 'success');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Gagal melakukan absensi. Silakan coba lagi.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      padding: '24px 20px',
      maxWidth: 1400,
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 76,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99,
            background: toast.type === 'success' ? '#16a34a' : '#dc2626',
            color: '#fff',
            padding: '14px 24px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 10px 32px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
            textAlign: 'center',
            animation: 'slideInDown 0.3s ease',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header Section */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b', fontWeight: 500 }}>
          {formatGreeting()}
        </p>
        <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
          {user?.nama || 'Dosen'}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>{formatDateId()}</p>
      </div>

      {/* Main Content - Responsive Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px',
        gridAutoFlow: 'dense',
      }}>
        {/* Left Column - Session Card */}
        <div style={{ gridColumn: 'auto' }}>
          {pageLoading ? (
            <div style={{
              height: 320,
              borderRadius: 20,
              background: 'linear-gradient(90deg,#e8ecf4 25%,#f1f4fb 50%,#e8ecf4 75%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          ) : pageError ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 24,
                textAlign: 'center',
                border: '1px solid #fecaca',
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: 28,
                fontWeight: 700,
                color: '#dc2626',
              }}>
                !
              </div>
              <p style={{ color: '#dc2626', fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>
                {pageError}
              </p>
              <button
                onClick={fetchSession}
                style={{
                  background: 'linear-gradient(135deg, #1E2D78 0%, #2d3f9e 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(30,45,120,0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Muat Ulang
              </button>
            </div>
          ) : session ? (
            <SessionCard
              session={session}
              onAbsen={handleAbsen}
              submitting={submitting}
              absenDone={absenDone}
            />
          ) : (
            <NoSession />
          )}
        </div>

        {/* Right Column - Info & Additional Resources */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {/* Info Card */}
          <div
            style={{
              background: '#eff6ff',
              borderRadius: 16,
              padding: '18px 20px',
              border: '1px solid #bfdbfe',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 14,
                fontWeight: 600,
                color: '#1d4ed8',
              }}>
                i
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
                  Cara Melakukan Absensi
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#3b82f6', lineHeight: 1.6 }}>
                  Pastikan Anda berada di sekitar ruang kelas dan akses GPS aktif. Tekan tombol <strong>Absen Sekarang</strong> untuk memproses absensi Anda secara otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Reference Card */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 16,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
              Persyaratan Absensi
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'GPS harus aktif dan terkalibrasi',
                'Berada dalam radius yang ditentukan',
                'Sesi pembelajaran masih aktif',
                'Koneksi internet stabil',
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#1d4ed8',
                    marginTop: 2,
                  }}>
                    ✓
                  </div>
                  <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @media (max-width: 768px) {
          div { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}