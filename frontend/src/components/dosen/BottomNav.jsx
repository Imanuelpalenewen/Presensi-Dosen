import { NavLink } from 'react-router-dom';

const navItems = [
  {
    to: '/dosen/absen',
    label: 'Absen',
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
        stroke={active ? '#1E2D78' : '#9CA3AF'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/dosen/scan',
    label: 'Scan QR',
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
        stroke={active ? '#1E2D78' : '#9CA3AF'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10-2h2m0 0h2m-2 0v2m0 2v2" />
      </svg>
    ),
  },
  {
    to: '/dosen/riwayat',
    label: 'Riwayat',
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
        stroke={active ? '#1E2D78' : '#9CA3AF'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: '/dosen/profil',
    label: 'Profil',
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
        stroke={active ? '#1E2D78' : '#9CA3AF'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: '#fff',
        borderTop: '1px solid #E5E7EB',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'stretch',
        height: 64,
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={{ flex: 1, textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {/* Garis aktif di atas tab */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '25%',
                    right: '25%',
                    height: 3,
                    borderRadius: '0 0 4px 4px',
                    background: '#1E2D78',
                  }}
                />
              )}

              {item.icon(isActive)}

              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#1E2D78' : '#9CA3AF',
                  lineHeight: 1,
                  fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
                }}
              >
                {item.label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}