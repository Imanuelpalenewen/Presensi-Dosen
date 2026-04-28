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
  { to: '/admin/jadwal-hari-ini', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/jadwal', label: 'Jadwal', icon: CalendarDays },
  { to: '/admin/rekap', label: 'Rekap', icon: ClipboardList },
  { to: '/admin/pesan', label: 'Pesan', icon: Inbox },
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
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* ── Sidebar (Desktop) ── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-screen overflow-y-auto shadow-[4px_0_20px_rgba(30,45,120,0.18)]" style={{ background: 'linear-gradient(180deg,#1E2D78 0%,#162060 100%)' }}>
        {/* Brand */}
        <div className="px-6 pt-7 pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <QrCode size={20} color="#fff" />
            </div>
            <div>
              <div className="text-white font-extrabold text-base tracking-tight">SiPresQR</div>
              <div className="text-white/45 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
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
          
          {/* Lokasi (Only visible in sidebar, not on mobile nav) */}
          <button
                onClick={() => navigate('/admin/lokasi')}
                className={`flex items-center gap-3 px-3.5 py-2.5 border-none rounded-xl cursor-pointer transition-all duration-150 w-full text-left text-sm mt-1
                  ${location.pathname === '/admin/lokasi' 
                    ? 'bg-white/15 text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.12)]' 
                    : 'bg-transparent text-white/55 font-medium hover:bg-white/10'
                  }
                `}
              >
                <MapPin size={18} />
                Lokasi
          </button>
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 mb-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{user?.nama || 'Admin'}</div>
              <div className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Administrator</div>
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
      <main className="flex-1 overflow-x-hidden min-h-screen pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* ── Bottom Navbar (Mobile) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex flex-col items-center justify-center w-16 gap-1 p-1 transition-colors
                ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 ${active ? 'bg-indigo-50' : 'bg-transparent'}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
        {/* Logout Button Mobile */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-16 gap-1 p-1 transition-colors text-slate-400 hover:text-slate-600"
        >
          <div className="p-1.5 rounded-full transition-all duration-200 bg-transparent">
            <LogOut size={20} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium">
            Keluar
          </span>
        </button>
      </nav>
    </div>
  );
}
