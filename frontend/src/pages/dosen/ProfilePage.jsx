import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dosenService from '../../services/dosenService';
import { useAuth } from '../../hooks/useAuth';

function InfoRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 17,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 1px', fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: '#1e293b', fontWeight: 600, wordBreak: 'break-word' }}>
          {value || '-'}
        </p>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, sublabel, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 0',
        width: '100%',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid #f1f5f9',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: danger ? '#fef2f2' : '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 17,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 1px', fontSize: 14, fontWeight: 700, color: danger ? '#dc2626' : '#1e293b' }}>
          {label}
        </p>
        {sublabel && (
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{sublabel}</p>
        )}
      </div>
      <span style={{ color: '#cbd5e1', fontSize: 18, flexShrink: 0 }}>›</span>
    </button>
  );
}

function PasswordModal({ onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async () => {
    if (form.next !== form.confirm) {
      setMsg({ ok: false, text: 'Password baru tidak cocok.' });
      return;
    }
    if (form.next.length < 6) {
      setMsg({ ok: false, text: 'Password minimal 6 karakter.' });
      return;
    }
    setSubmitting(true);
    try {
      await dosenService.changePassword({
        current_password: form.current,
        new_password: form.next,
      });
      setMsg({ ok: true, text: 'Password berhasil diubah!' });
      setTimeout(onClose, 1800);
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.message || 'Gagal mengubah password.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px 36px',
          width: '100%',
          maxWidth: 480,
          animation: 'slideUp 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 99,
            background: '#e2e8f0',
            margin: '-10px auto 20px',
          }}
        />
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
          🔒 Ganti Password
        </h3>

        {['current', 'next', 'confirm'].map((field) => (
          <div key={field} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              {field === 'current' ? 'Password Saat Ini' : field === 'next' ? 'Password Baru' : 'Konfirmasi Password Baru'}
            </label>
            <input
              type="password"
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
                color: '#1e293b',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        {msg && (
          <div
            style={{
              background: msg.ok ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${msg.ok ? '#86efac' : '#fca5a5'}`,
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 13,
              color: msg.ok ? '#15803d' : '#dc2626',
              fontWeight: 600,
            }}
          >
            {msg.text}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 14,
            border: 'none',
            background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#1E2D78,#2d3f9e)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Memproses…' : 'Simpan Password'}
        </button>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassModal, setShowPassModal] = useState(false);

  useEffect(() => {
    dosenService
      .getProfile()
      .then((r) => setProfile(r.data?.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const initials = (user?.name || 'D')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const data = profile || user;

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E2D78 0%, #162060 100%)',
          padding: '32px 20px 48px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: '#10B981',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 800,
            margin: '0 auto 14px',
            border: '3px solid rgba(255,255,255,0.25)',
          }}
        >
          {initials}
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#fff' }}>
          {data?.name || 'Dosen'}
        </h2>
        <span
          style={{
            background: '#10B981',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 12px',
            borderRadius: 20,
            letterSpacing: '0.06em',
          }}
        >
          Dosen
        </span>

        {/* Quick stats */}
        {profile && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
            {[
              { v: profile.total_sessions || 0, l: 'semester ini' },
              { v: profile.total_meetings || 0, l: 'pertemuan' },
              { v: `${profile.attendance_rate || 0}%`, l: 'rata-rata' },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '10px 16px',
                  minWidth: 70,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{s.v}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card */}
      <div style={{ padding: '0 16px', marginTop: -18 }}>
        {loading ? (
          <div
            style={{
              height: 200,
              borderRadius: 20,
              background: 'linear-gradient(90deg,#e8ecf4 25%,#f1f4fb 50%,#e8ecf4 75%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 1.4s infinite',
            }}
          />
        ) : (
          <>
            {/* Info card */}
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: '4px 20px',
                marginBottom: 16,
                boxShadow: '0 4px 24px rgba(30,45,120,0.08)',
                border: '1px solid #e8ecf4',
              }}
            >
              <div style={{ padding: '14px 0 4px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Informasi Akun
                </p>
              </div>
              <InfoRow icon="👤" label="Nama Lengkap" value={data?.name} />
              <InfoRow icon="✉️" label="Email" value={data?.email} />
              <InfoRow icon="#️⃣" label="NIP" value={data?.nip} />
              <InfoRow icon="📚" label="Program Studi" value={data?.department} />
              <InfoRow icon="📖" label="Mata Kuliah" value={data?.courses?.join(', ')} />
              <InfoRow icon="🏛️" label="Jabatan" value={data?.position} />
            </div>

            {/* Settings card */}
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: '4px 20px',
                marginBottom: 16,
                boxShadow: '0 4px 24px rgba(30,45,120,0.08)',
                border: '1px solid #e8ecf4',
              }}
            >
              <div style={{ padding: '14px 0 4px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Pengaturan
                </p>
              </div>
              <SettingRow icon="🔔" label="Notifikasi" sublabel="Pengingat sesi aktif" onClick={() => {}} />
              <SettingRow icon="🔒" label="Keamanan" sublabel="Ganti password" onClick={() => setShowPassModal(true)} />
              <SettingRow icon="❓" label="Bantuan" sublabel="FAQ & Kontak admin" onClick={() => {}} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>
              SiPresQR • Universitas • v2.0
            </p>
          </>
        )}
      </div>

      {/* Password modal */}
      {showPassModal && <PasswordModal onClose={() => setShowPassModal(false)} />}

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}