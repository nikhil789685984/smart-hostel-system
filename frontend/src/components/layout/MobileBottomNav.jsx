import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  QrCode,
  UtensilsCrossed,
  BookOpen,
  Menu,
  Users,
  AlertCircle,
  Activity,
  Building,
  Sparkles
} from 'lucide-react';

export default function MobileBottomNav({ onToggleSidebar, isSidebarOpen }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Role-specific bottom navigation tabs
  const getTabs = () => {
    switch (user.role) {
      case 'student':
        return [
          {
            label: 'Home',
            to: '/student/dashboard',
            icon: Home,
            badge: null
          },
          {
            label: 'Pass',
            to: '/student/gate-pass',
            icon: QrCode,
            badge: null
          },
          {
            label: 'Mess',
            to: '/student/mess',
            icon: UtensilsCrossed,
            badge: null
          },
          {
            label: 'Study',
            to: '/student/study-hub',
            icon: BookOpen,
            badge: 'NEW'
          }
        ];
      case 'warden':
        return [
          {
            label: 'Home',
            to: '/warden/dashboard',
            icon: Home,
            badge: null
          },
          {
            label: 'Residents',
            to: '/warden/students',
            icon: Users,
            badge: null
          },
          {
            label: 'Passes',
            to: '/warden/gate-passes',
            icon: QrCode,
            badge: null
          },
          {
            label: 'Tickets',
            to: '/warden/complaints',
            icon: AlertCircle,
            badge: null
          }
        ];
      case 'admin':
        return [
          {
            label: 'Home',
            to: '/admin/dashboard',
            icon: Home,
            badge: null
          },
          {
            label: 'Command',
            to: '/admin/command-center',
            icon: Activity,
            badge: 'LIVE'
          },
          {
            label: 'Students',
            to: '/admin/students',
            icon: Users,
            badge: null
          },
          {
            label: 'Rooms',
            to: '/admin/rooms',
            icon: Building,
            badge: null
          }
        ];
      default:
        return [];
    }
  };

  const tabs = getTabs();

  // Check if current route is one of the primary 4 tabs
  const isPrimaryTabActive = tabs.some((tab) => location.pathname === tab.to);
  const isMoreActive = isSidebarOpen || (!isPrimaryTabActive && location.pathname !== '/login' && location.pathname !== '/');

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1"
    >
      <div className="grid grid-cols-5 items-center justify-around px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.to;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative select-none touch-manipulation active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-indigo-600 text-[8px] font-black text-white rounded-full leading-tight uppercase scale-90">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-black text-blue-600' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5 animate-pulse" />
              )}
            </NavLink>
          );
        })}

        {/* More / Menu Drawer Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative select-none touch-manipulation active:scale-95 cursor-pointer ${
            isMoreActive
              ? 'text-blue-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
          aria-label="All features and navigation drawer"
        >
          <div
            className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors duration-200 ${
              isMoreActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
            }`}
          >
            <Menu className={`w-5 h-5 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${isMoreActive ? 'font-black text-blue-600' : 'font-medium'}`}>
            More
          </span>
          {isMoreActive && (
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5 animate-pulse" />
          )}
        </button>
      </div>
    </nav>
  );
}
