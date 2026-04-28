import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  CalendarDays,
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Inbox,
  LogOut,
  QrCode,
} from 'lucide-react';

const navItems = [
  { to: '/admin/jadwal-hari-ini', label: 'Hari Ini', icon: LayoutDashboard },
  { to: '/admin/jadwal', label: 'Jadwal', icon: CalendarDays },
  { to: '/admin/rekap', label: 'Rekap Absensi', icon: ClipboardList },
  { to: '/admin/lokasi', label: 'Lokasi', icon: MapPin },
  { to: '/admin/pesan', label: 'Inbox Pesan', icon: Inbox },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.nama || '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'A';

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#f1f5f9', fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 256,
        flexShrink: 0,
        background: 'linear-gradient(180deg,#1E2D78 0%,#162060 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100dvh',
        overflowY: 'auto',
        boxShadow: '4px 0 20px rgba(30,45,120,0.18)',
      }}>
        {/* Brand */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <QrCode size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>SiPresQR</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <button
                key={to}
                id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => navigate(to)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
                  width: '100%',
                  textAlign: 'left',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0,
            }}>{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nama || 'Admin'}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>Administrator</div>
            </div>
          </div>
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', border: 'none', borderRadius: 10,
              cursor: 'pointer', transition: 'all 0.18s',
              background: 'rgba(239,68,68,0.12)',
              color: '#fca5a5', fontWeight: 600, fontSize: 14,
              fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowX: 'hidden', minHeight: '100dvh' }}>
        <Outlet />
      </main>
    </div>
  );
}
