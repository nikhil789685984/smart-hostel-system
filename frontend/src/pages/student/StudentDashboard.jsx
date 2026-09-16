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


  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.getStudentDashboard();
        setData(res.dashboard);
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { student, roomInfo, roommates = [], attendance, complaints, fee, todayMenu, notices = [], gatePass } = data || {};

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

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setIdModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🪪</span> My Digital ID Card
          </button>
          <Link
            to="/student/fees"
            className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5"
          >
            <DoorOpen className="w-4 h-4 text-amber-300" /> Checkout
          </Link>
          <Link
            to="/student/complaints"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-800 text-xs font-black shadow-md transition flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4 text-amber-500" /> + Log Complaint
          </Link>
        </div>


        {/* Ambient background blur */}
        <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      <DigitalIDCard
        student={student ? { ...student, name: user?.name, avatar_url: user?.avatar_url } : user}
        isOpen={idModalOpen}
        onClose={() => setIdModalOpen(false)}
      />

    </motion.div>
  );
}

