import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart, LayoutDashboard, Users, History, Map, AlertCircle, FileText, Bot, Trophy, PackageSearch, Package, Settings, CreditCard, Building, BedDouble, UtensilsCrossed, Leaf, Coffee, Activity, DoorOpen, MessageSquare, ShieldAlert, BarChart3, QrCode, ShoppingBag, FolderSync, Video, Search, PhoneCall, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const studentNav = [
    { name: '🧠 Free Depression Test', to: '/student/wellness', icon: Heart, highlight: true },
    { name: '📚 Study Hub', to: '/student/study-hub', icon: FileText, highlight: true },
    { name: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { name: '🤫 Live Quiet Heatmap', to: '/noise-heatmap', icon: Activity, highlight: true },
    { name: '🛒 Hostel Marketplace', to: '/marketplace', icon: ShoppingBag },
    { name: '🏆 Cleanest Block Ranks', to: '/leaderboard', icon: Trophy },
    { name: '🌱 Eco-Warriors', to: '/eco-leaderboard', icon: Leaf },
    { name: '🍔 Night Canteen', to: '/canteen', icon: Coffee },
    { name: '👕 Digital Lost & Found', to: '/student/lost-found', icon: PackageSearch },
    { name: '📦 Mailroom', to: '/student/parcels', icon: Package, highlight: true },
    { name: '🛏️ Guest Pass', to: '/guest-pass', icon: Users },
    { name: 'My Room & Roommates', to: '/student/room', icon: BedDouble },
    { name: 'Complaints & AI Triage', to: '/student/complaints', icon: AlertCircle },
    { name: 'Report Warden', to: '/student/report-warden', icon: ShieldAlert },
    { name: 'Mess Menu & Ratings', to: '/student/mess', icon: UtensilsCrossed },
    { name: 'Report Mess/Food', to: '/student/report-mess', icon: AlertCircle },
    { name: 'Digital Gate Pass', to: '/student/gate-pass', icon: QrCode },
    { name: 'Fee Invoices & Pay', to: '/student/fees', icon: CreditCard },
    { name: 'AI Hostel Assistant', to: '/student/ai-assistant', icon: Bot },
    { name: '🛺 E-Rickshaw Booking', to: '/student/rickshaw', icon: Map, highlight: true },
    { name: 'Notice Board', to: '/student/notices', icon: FileText },
  ];

  const wardenNav = [
    { name: '🧠 Student Wellness Hub', to: '/warden/wellness', icon: Heart, highlight: true },
    { name: '📚 Study Hub', to: '/warden/study-hub', icon: FileText, highlight: true },
    { name: '💳 Fee & Fine Audit', to: '/warden/fees', icon: CreditCard, highlight: true },
    { name: 'Warden Dashboard', to: '/warden/dashboard', icon: LayoutDashboard },
    { name: '📷 Live Security Scanner', to: '/warden/scanner', icon: QrCode },
    { name: '👕 Manage Lost & Found', to: '/warden/lost-found', icon: PackageSearch },
    { name: '📦 Manage Mailroom', to: '/warden/parcels', icon: Package, highlight: true },
    { name: '🤫 Live Quiet Heatmap', to: '/noise-heatmap', icon: Activity },
    { name: '🛒 Hostel Marketplace', to: '/marketplace', icon: ShoppingBag },
    { name: '🏆 Cleanest Block Hub', to: '/leaderboard', icon: Trophy },
    { name: '🌱 Eco-Warriors', to: '/eco-leaderboard', icon: Leaf },
    { name: 'Hostel Checkout Hub', to: '/warden/checkout-requests', icon: DoorOpen },
    { name: 'Admin Comms & Messages', to: '/warden/messages', icon: MessageSquare },
    { name: 'Student Resident Directory', to: '/warden/students', icon: Users },
    { name: 'Room & Bed Allocation', to: '/warden/allocations', icon: BedDouble },
    { name: 'Complaint Resolution', to: '/warden/complaints', icon: AlertCircle },
    { name: 'Gate Pass Approvals', to: '/warden/gate-passes', icon: QrCode },
    { name: 'Guest Pass Approvals', to: '/warden/guest-passes', icon: Users },
    { name: 'Room Change Requests', to: '/warden/room-requests', icon: Users },
    { name: 'Mess Menu & Feedback', to: '/warden/mess', icon: UtensilsCrossed },
    { name: 'Hostel Notices', to: '/warden/notices', icon: FileText },
    { name: 'Warden Analytics', to: '/warden/analytics', icon: BarChart3 },
  ];

  const adminNav = [
    { name: '🧠 Student Wellness Hub', to: '/admin/wellness', icon: Heart, highlight: true },
    { name: '📚 Study Hub', to: '/admin/study-hub', icon: FileText, highlight: true },
    { name: '💳 AI Fee & Fine Audit', to: '/admin/fees', icon: CreditCard, highlight: true },
    { name: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: '🔥 Command Center', to: '/admin/command-center', icon: Activity, highlight: true },
    { name: '📦 Manage Mailroom', to: '/admin/parcels', icon: Package, highlight: true },
    { name: '🤫 Live Quiet Heatmap', to: '/noise-heatmap', icon: Activity },
    { name: '🛒 Campus Marketplace', to: '/marketplace', icon: ShoppingBag },
    { name: '🏆 Block Leaderboard', to: '/leaderboard', icon: Trophy },
    { name: 'Hostel Checkout Hub', to: '/admin/checkout-requests', icon: DoorOpen },
    { name: 'Warden Comms & Dispatch', to: '/admin/messages', icon: MessageSquare },
    { name: 'Manage Students', to: '/admin/students', icon: Users },
    { name: 'Student History', to: '/admin/student-history', icon: History },
    { name: 'Manage Wardens', to: '/admin/wardens', icon: ShieldAlert },
    { name: 'Hostels & Rooms', to: '/admin/rooms', icon: Building },
    { name: 'Mess & Food Governance', to: '/admin/mess', icon: UtensilsCrossed },
    { name: 'Complaint Oversight', to: '/admin/complaints', icon: AlertCircle },
    { name: 'Gate Pass Governance', to: '/admin/gate-passes', icon: QrCode },
    { name: 'Guest Pass Governance', to: '/admin/guest-passes', icon: Users },
    { name: 'Smart Campus Analytics', to: '/admin/analytics', icon: BarChart3 },
    { name: 'Campus Notices', to: '/admin/notices', icon: FileText },
  ];

  const navItems = user.role === 'student' ? studentNav : (user.role === 'warden' ? wardenNav : adminNav);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white/95 backdrop-blur-2xl border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:top-16 lg:bottom-0 lg:z-30 lg:w-64 lg:bg-white/70 lg:backdrop-blur-xl lg:border-white/50 lg:shadow-none shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="py-4 px-3 overflow-y-auto flex-1">
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                🏢
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-tight">Apex SmartHostel</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Navigation Menu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Quick Info Banner */}
          <div className="mb-4 px-3 py-3 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={user.name}
                className="w-10 h-10 rounded-xl object-cover border border-blue-200"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-extrabold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {user.student?.roll_number || user.warden?.employee_id || user.email}
                </p>
                <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Main Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== `/${user.role}/dashboard` && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } ${item.highlight && !isActive ? 'text-indigo-600 bg-indigo-50/70 border border-indigo-100' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                  {item.highlight && (
                    <span className="ml-auto text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                      NEW
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom System Status */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between px-2 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Portal Active
            </span>
            <span className="font-mono text-[10px]">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
