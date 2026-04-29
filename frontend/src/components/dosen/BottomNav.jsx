// components/dosen/BottomNav.jsx
// Bottom nav mobile — gaya sama seperti admin panel, pakai lucide icons

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClipboardCheck, QrCode, History, User, LogOut, MessageSquare } from 'lucide-react';

const navItems = [
  { to: '/dosen/absen',   label: 'Absen',   Icon: ClipboardCheck },
  { to: '/dosen/scan',    label: 'Scan QR', Icon: QrCode         },
  { to: '/dosen/riwayat', label: 'Riwayat', Icon: History        },
  { to: '/dosen/pesan',   label: 'Pesan',   Icon: MessageSquare  },
  { to: '/dosen/profil',  label: 'Profil',  Icon: User           },
];

export default function BottomNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-50">
      {navItems.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} className="flex-1 no-underline">
          {({ isActive }) => (
            <div className="flex flex-col items-center justify-center gap-1 py-1 relative">
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-b-full bg-[#1E2D78]" />
              )}
              <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive ? 'bg-indigo-50' : ''}`}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-[#1E2D78]' : 'text-slate-400'}
                />
              </div>
              <span className={`text-[10px] leading-none ${isActive ? 'font-bold text-[#1E2D78]' : 'font-medium text-slate-400'}`}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-1 border-none bg-transparent cursor-pointer"
      >
        <div className="p-1.5 rounded-full">
          <LogOut size={20} strokeWidth={1.8} className="text-slate-400" />
        </div>
        <span className="text-[10px] font-medium text-slate-400 leading-none">Keluar</span>
      </button>
    </nav>
  );
}