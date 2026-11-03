import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import {
  Bed,
  CheckCircle,
  AlertCircle,
  CreditCard,
  UtensilsCrossed,
  Bell,
  QrCode,
  Bot,
  User,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  Zap,
  Phone,
  DoorOpen
} from 'lucide-react';

import DigitalIDCard from '../../components/ui/DigitalIDCard';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idModalOpen, setIdModalOpen] = useState(false);


  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getStudentDashboard();
      setData(res.dashboard);
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // 🔄 4s Real-Time Polling for live dashboard sync
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 4000);

    // ⚡ Window Focus / Visibility Change Listener (Instantly syncs when user switches back)
    const handleFocus = () => fetchDashboard(true);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchDashboard(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 📡 Cross-Tab Sync via BroadcastChannel
    let bc = null;
    try {
      bc = new BroadcastChannel('hostel_sync_channel');
      bc.onmessage = (event) => {
        if (event.data?.type) {
          fetchDashboard(true);
        }
      };
    } catch (e) {}

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (bc) bc.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { student, roomInfo, roommates = [], attendance, complaints, fee, todayMenu, notices = [], gatePass, latestWellness } = data || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      
      {/* Welcome & Student Identity Banner with Glassmorphism */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[11px] font-black uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {roomInfo ? `${roomInfo.block_name} • Room ${roomInfo.room_number}` : 'Campus Resident'}
            </span>
            <span className="text-xs text-blue-200 font-mono">Bed #{roomInfo?.bed_number || '1'}</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl font-medium">
            {student?.branch} • Year {student?.year} (Sem {student?.semester}) • Roll: <strong className="font-mono text-white">{student?.roll_number}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 relative z-10 w-full md:w-auto">
          <button
            onClick={() => setIdModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>🪪</span> My Digital ID
          </button>
          <Link
            to="/student/fees"
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/20 transition flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <DoorOpen className="w-4 h-4 text-amber-300" /> Checkout
          </Link>
          <Link
            to="/student/complaints"
            className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-800 text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <AlertCircle className="w-4 h-4 text-amber-500" /> + Log Complaint
          </Link>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Mental Health & Counselor Verification Banner */}
      {latestWellness?.status === 'Approved' ? (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/10 border-2 border-emerald-500/70 rounded-3xl p-5 shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden backdrop-blur-sm"
        >
          <div className="flex items-start sm:items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md text-2xl">
              ✅
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                  Verified by Counselor
                </span>
                <span className="text-xs text-emerald-800 font-semibold">
                  {latestWellness.approved_at ? new Date(latestWellness.approved_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently Verified'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                Your details are verified by counselor. They will call you soon.
              </h3>
              <p className="text-xs text-slate-700 mt-0.5">
                Counselor <strong>{latestWellness.counselor_name || 'Dr. Nikhil Sheoran'}</strong> has reviewed your assessment with strict confidentiality. Please keep your phone reachable.
              </p>
            </div>
          </div>
          <Link
            to="/student/wellness"
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center relative z-10"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      ) : latestWellness?.status === 'Pending' ? (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/60 rounded-3xl p-4 sm:p-5 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden backdrop-blur-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md text-2xl">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                  Under Counselor Review
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                Your depression screening is being reviewed by Counselor Dr. Nikhil Sheoran.
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Details dispatched to counselor. Once verified, you will see an update here and counselor will contact you.
              </p>
            </div>
          </div>
          <Link
            to="/student/wellness"
            className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Track Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-indigo-500/10 border border-rose-200/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden backdrop-blur-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0 shadow-sm text-2xl">
              🧠
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Free & Confidential Depression Screening Test</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white">Free • 100% Private</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Feeling stressed, overwhelmed, or low? Take a quick 2-minute clinical PHQ-9 self-check and request free counselor guidance.
              </p>
            </div>
          </div>
          <Link
            to="/student/wellness"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Take Test Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      {/* KPI Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          title="Assigned Bed"
          value={roomInfo ? `${roomInfo.room_number} (${roomInfo.bed_number})` : 'Unassigned'}
          subtitle={roomInfo ? `${roomInfo.block_name}, Floor ${roomInfo.floor}` : 'Contact Warden'}
          icon={Bed}
          color="blue"
        />
        <StatCard
          title="Biometric Attendance"
          value={`${attendance?.percentage || 94}%`}
          subtitle="Night curfew compliance"
          icon={CheckCircle}
          color="emerald"
          trend="Regular"
        />
        <StatCard
          title="Maintenance Tickets"
          value={complaints?.pending > 0 ? `${complaints.pending} Active` : '0 Active'}
          subtitle={`${complaints?.total || 0} lifetime registered`}
          icon={AlertCircle}
          color={complaints?.pending > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Hostel Fee Balance"
          value={fee?.pending_amount > 0 ? `₹${Number(fee.pending_amount).toLocaleString()}` : 'Fully Cleared'}
          subtitle={fee?.pending_amount > 0 ? `Due: ${fee.due_date}` : 'All Semester Dues Paid'}
          icon={CreditCard}
          color={fee?.pending_amount > 0 ? 'rose' : 'emerald'}
          trend={fee?.status}
        />
      </motion.div>

      {/* Main Content: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today's Mess & Roommate / Gate Pass */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Mess Schedule Card */}
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Today's Dining Schedule</h3>
                  <p className="text-xs text-slate-500 font-medium">{todayMenu?.day_of_week || 'Today'} • Active Dining Cycle</p>
                </div>
              </div>
              <Link
                to="/student/mess"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                Weekly Menu <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-white transition space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Breakfast (7:30 - 9:00 AM)</span>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">{todayMenu?.breakfast || 'Masala Dosa, Sambar, Tea'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-white transition space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lunch (12:30 - 2:00 PM)</span>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">{todayMenu?.lunch || 'Rajma Masala, Rice, Roti, Curd'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-white transition space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Evening Snacks (5:00 - 6:00 PM)</span>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">{todayMenu?.snacks || 'Samosa & Ginger Tea'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-200/70 hover:bg-blue-500/20 transition space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Dinner (7:30 - 9:30 PM)</span>
                <p className="text-xs font-bold text-slate-900 leading-relaxed">{todayMenu?.dinner || 'Paneer Butter Masala, Dal, Roti'}</p>
                {todayMenu?.special_item && (
                  <span className="inline-block mt-1.5 text-[10px] font-black text-blue-700 bg-white/80 px-2 py-0.5 rounded-full border border-blue-200">
                    Special Treat: {todayMenu.special_item}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Assigned Caretaker / Resident Warden Card */}
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-3xl p-6 border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center text-xl">
                  🛡️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Assigned Caretaker & Resident Warden</h3>
                  <p className="text-xs text-indigo-700 font-semibold">Your designated campus welfare officer</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200/80">
                Active Supervision
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/20">
                  {(student?.caretaker_name || 'C')[0]}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">{student?.caretaker_name || 'Resident Caretaker'}</h4>
                    {student?.caretaker_staff_id && (
                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        {student.caretaker_staff_id}
                      </span>
                    )}
                    {student?.caretaker_shift && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                        {student.caretaker_shift}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{student?.caretaker_role || 'Facility Caretaker & Room Support'}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <span>📍 Assigned: {student?.caretaker_block || student?.block_name || 'Resident Block'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={student?.caretaker_phone ? `tel:${student.caretaker_phone}` : '#'}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>📞</span> Call Caretaker
                </a>
              </div>
            </div>
          </motion.div>

          {/* Room Details & Roommates */}
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Room Details & Roommates</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {roomInfo ? `${roomInfo.room_type} Room • ${roomInfo.room_number}` : 'Room details'}
                </p>
              </div>
              <Link
                to="/student/room"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                Room Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {roommates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roommates.map((rm, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5 hover:bg-white transition">
                    <img
                      src={rm.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                      alt={rm.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-300"
                    />
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-900 truncate">{rm.name}</p>
                        <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {rm.bed_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{rm.roll_number} • {rm.branch}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rm.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                Single occupancy room or no other roommate allocated currently.
              </div>
            )}
          </motion.div>

        </div>

        {/* Right 1 Col: Urgent Notices & Gate Pass */}
        <div className="space-y-6">
          
          {/* Active Gate Pass Status */}
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-purple-600" /> Digital Gate Pass
              </span>
              <Link to="/student/gate-pass" className="text-xs font-bold text-purple-600 hover:underline">
                Apply Pass
              </Link>
            </div>

            {gatePass ? (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900">{gatePass.pass_type}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      gatePass.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : gatePass.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {gatePass.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium line-clamp-1">Destination: {gatePass.destination}</p>
                <p className="text-[11px] text-slate-500 font-mono">Token: {gatePass.qr_token}</p>
                <div className="pt-2 border-t border-purple-100 text-[11px] text-purple-700 font-semibold">
                  {gatePass.status === 'Approved' ? '✅ Approved by Warden. Scan QR at security gate.' : '⏳ Pending Warden authorization.'}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                No active outing or leave pass.
                <div className="mt-2">
                  <Link to="/student/gate-pass" className="font-bold text-purple-600 hover:underline">
                    Request new pass
                  </Link>
                </div>
              </div>
            )}
          </motion.div>

          {/* Recent Notices */}
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-blue-600" /> Campus Circulars
              </span>
              <Link to="/student/notices" className="text-xs font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {notices.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/50 border border-slate-100 transition space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{n.title}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        n.priority === 'Urgent'
                          ? 'bg-red-100 text-red-700'
                          : n.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {n.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </div>

      {idModalOpen && (
        <DigitalIDCard
          student={student ? { ...student, name: user?.name, avatar_url: user?.avatar_url } : user}
          isOpen={idModalOpen}
          onClose={() => setIdModalOpen(false)}
        />
      )}

    </motion.div>
  );
}

