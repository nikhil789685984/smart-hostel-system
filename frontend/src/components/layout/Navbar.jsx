import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Sparkles,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

import DigitalIDCard from '../ui/DigitalIDCard';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, quickSwitchRole } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [roleSwitching, setRoleSwitching] = useState(false);
  const [idModalOpen, setIdModalOpen] = useState(false);
  const navigate = useNavigate();


  const handleRoleSwitch = async (role) => {
    if (role === user?.role) return;
    setRoleSwitching(true);
    try {
      await quickSwitchRole(role);
      setProfileMenuOpen(false);
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'warden') navigate('/warden/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setRoleSwitching(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Student</span>;
      case 'warden':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Hostel Warden</span>;
      case 'admin':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">System Admin</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand & Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                aria-label="Toggle Sidebar"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link to={user ? `/${user.role}/dashboard` : "/"} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
                  Apex <span className="text-blue-600">SmartHostel</span>
                </span>
                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                  Campus Living Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Viva Quick Role Switcher */}
          {user && (
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <span className="text-slate-600 px-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Viva Switch:
              </span>
              <button
                disabled={roleSwitching}
                onClick={() => handleRoleSwitch('student')}
                className={`px-3 py-1 rounded-lg transition ${
                  user.role === 'student'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Student
              </button>
              <button
                disabled={roleSwitching}
                onClick={() => handleRoleSwitch('warden')}
                className={`px-3 py-1 rounded-lg transition ${
                  user.role === 'warden'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Warden
              </button>
              <button
                disabled={roleSwitching}
                onClick={() => handleRoleSwitch('admin')}
                className={`px-3 py-1 rounded-lg transition ${
                  user.role === 'admin'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Admin
              </button>
            </div>
          )}

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'student' && (
                  <button
                    onClick={() => setIdModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-amber-300 border border-amber-400/40 text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🪪</span>
                    <span className="hidden sm:inline">Digital ID</span>
                  </button>
                )}

                <NotificationDropdown />


                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                  >
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-300"
                    />
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 leading-none">{user.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {profileMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                      onMouseLeave={() => setProfileMenuOpen(false)}
                    >
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <div className="mt-2 flex items-center justify-between">
                          {getRoleBadge(user.role)}
                          {user.student && (
                            <span className="text-[11px] font-mono text-slate-500">
                              {user.student.roll_number}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mobile Viva Role Switcher */}
                      <div className="md:hidden px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Quick Switch Role:
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-xs font-semibold">
                          <button
                            onClick={() => handleRoleSwitch('student')}
                            className={`py-1 rounded ${user.role === 'student' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                          >
                            Student
                          </button>
                          <button
                            onClick={() => handleRoleSwitch('warden')}
                            className={`py-1 rounded ${user.role === 'warden' ? 'bg-purple-600 text-white' : 'bg-white border'}`}
                          >
                            Warden
                          </button>
                          <button
                            onClick={() => handleRoleSwitch('admin')}
                            className={`py-1 rounded ${user.role === 'admin' ? 'bg-rose-600 text-white' : 'bg-white border'}`}
                          >
                            Admin
                          </button>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            logout();
                            navigate('/login');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
                >
                  Student Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {user && (
        <DigitalIDCard
          student={user.student ? { ...user.student, name: user.name, avatar_url: user.avatar_url } : user}
          isOpen={idModalOpen}
          onClose={() => setIdModalOpen(false)}
        />
      )}
    </header>

  );
}
