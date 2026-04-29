// components/dosen/DosenLayout.jsx
// Layout dosen: sidebar persis sama seperti admin panel

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ClipboardCheck,
  QrCode,
  History,
  User,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import BottomNav from './BottomNav';

const navItems = [
  { to: '/dosen/absen',   label: 'Absensi',  icon: ClipboardCheck },
  { to: '/dosen/scan',    label: 'Scan QR',  icon: QrCode         },
  { to: '/dosen/riwayat', label: 'Riwayat',  icon: History        },
  { to: '/dosen/pesan',   label: 'Pesan',    icon: MessageSquare  },
  { to: '/dosen/profil',  label: 'Profil',   icon: User           },
];

export default function DosenLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.nama || user?.name || 'D')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* ── Sidebar Desktop ── */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-screen overflow-y-auto shadow-[4px_0_20px_rgba(30,45,120,0.18)]"
        style={{ background: 'linear-gradient(180deg,#1E2D78 0%,#162060 100%)' }}
      >
        {/* Brand */}
        <div className="px-6 pt-7 pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <QrCode size={20} color="#fff" />
            </div>
            <div>
              <div className="text-white font-extrabold text-base tracking-tight">SiPresQR</div>
              <div className="text-white/45 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Portal Dosen</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`flex items-center gap-3 px-3.5 py-2.5 border-none rounded-xl cursor-pointer transition-all duration-150 w-full text-left text-sm
                  ${active
                    ? 'bg-white/15 text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    : 'bg-transparent text-white/55 font-medium hover:bg-white/10'
                  }
                `}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 mb-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.nama || user?.name || 'Dosen'}
              </div>
              <div className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Dosen</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-none rounded-xl cursor-pointer transition-all duration-150 bg-red-500/10 text-red-300 font-semibold text-sm hover:bg-red-500/20"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-x-hidden min-h-screen pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ── Bottom Nav Mobile ── */}
      <BottomNav />
    </div>
  );
}