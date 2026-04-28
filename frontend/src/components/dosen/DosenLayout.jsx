import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/dosen/absen', label: 'Absensi', icon: '▬' },
  { to: '/dosen/scan', label: 'Scan QR', icon: '◻' },
  { to: '/dosen/riwayat', label: 'Riwayat', icon: '📋' },
  { to: '/dosen/profil', label: 'Profil', icon: '👤' },
];

export default function DosenLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.nama || user?.name)
    ? (user.nama || user.name)
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'D';

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #1E2D78 0%, #162060 100%)',
          padding: isMobile ? '16px 20px 14px' : '18px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 4px 12px rgba(30,45,120,0.15)',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              color: '#fff',
              letterSpacing: '-0.5px',
              backdropFilter: 'blur(10px)',
            }}
          >
            SQ
          </div>
          <span style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: isMobile ? 15 : 18,
            letterSpacing: '-0.3px',
          }}>
            SiPresQR
          </span>
        </div>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && (
            <div style={{ textAlign: 'right', marginRight: 6 }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
                {user?.nama || user?.name || 'Dosen'}
              </div>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#86efac',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 20,
                  display: 'inline-block',
                  marginTop: 3,
                  letterSpacing: '0.05em',
                }}
              >
                Dosen
              </div>
            </div>
          )}
          <div
            style={{
              width: isMobile ? 34 : 40,
              height: isMobile ? 34 : 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: isMobile ? 13 : 16,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!isMobile) {
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar + Mobile Layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100dvh - 64px)' }}>
        {/* Desktop Sidebar Navigation */}
        {!isMobile && (
          <aside
            style={{
              width: 240,
              background: '#fff',
              borderRight: '1px solid #e2e8f0',
              padding: '24px 0',
              overflowY: 'auto',
              boxShadow: '2px 0 8px rgba(30,45,120,0.08)',
            }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 12px' }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      border: 'none',
                      background: isActive ? '#eff6ff' : 'transparent',
                      borderLeft: isActive ? '3px solid #1E2D78' : '3px solid transparent',
                      borderRadius: '8px 0 0 8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#1E2D78' : '#64748b',
                      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.background = '#f1f5f9';
                        e.target.style.color = '#334155';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#64748b';
                      }
                    }}
                  >
                    <span style={{ fontSize: 18, width: 20, textAlign: 'center' }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Divider */}
            <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 12px' }} />

            {/* Logout Button */}
            <div style={{ padding: '0 12px' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  border: 'none',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#dc2626',
                  fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fef2f2';
                }}
              >
                <span style={{ fontSize: 18, width: 20, textAlign: 'center' }}>
                  ◄
                </span>
                Keluar
              </button>
            </div>
          </aside>
        )}

        {/* Page content */}
        <main style={{
          flex: 1,
          paddingBottom: isMobile ? 80 : 24,
          width: '100%',
          overflowX: 'hidden',
        }}>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav - Only on mobile */}
      {isMobile && <BottomNav />}
    </div>
  );
}