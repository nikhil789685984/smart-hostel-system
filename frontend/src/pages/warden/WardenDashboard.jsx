import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import {
  Users,
  Bed,
  AlertCircle,
  UtensilsCrossed,
  QrCode,
  Building,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Radio,
  Sparkles,
  Bell,
  Check,
  ExternalLink,
  Megaphone,
  Send
} from 'lucide-react';

export default function WardenDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickAlertText, setQuickAlertText] = useState('');
  const [alertSent, setAlertSent] = useState(false);
  const [salaryInfo, setSalaryInfo] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, salaryRes] = await Promise.all([
          api.getHostelAnalytics(),
          api.getStaffAccount().catch(() => null)
        ]);
        if (dashRes && dashRes.success !== false) {
           setAnalytics(dashRes);
        }
        if (salaryRes && salaryRes.success) {
           setSalaryInfo(salaryRes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBroadcastQuickAlert = async (e) => {
    e.preventDefault();
    if (!quickAlertText.trim()) return;
    try {
      await api.createNotice({
        title: 'URGENT WARDEN NOTICE: ' + quickAlertText.slice(0, 40),
        description: quickAlertText,
        category: 'Emergency',
        target_audience: 'students',
        priority: 'Urgent'
      });
      setAlertSent(true);
      setQuickAlertText('');
      setTimeout(() => setAlertSent(false), 5000);
    } catch (err) {
      alert('Error broadcasting notice: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3">
        <div className="w-10 h-10 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-bold">Synchronizing warden command records...</span>
      </div>
    );
  }

  const { stats, insights = [] } = analytics || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
      {/* Warden Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                {user?.warden?.hostel_name || 'Himalaya Boys Hostel'} • Command Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Warden Administration Console
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-xl">
              Chief Officer: <strong className="text-white">{user?.name}</strong> ({user?.warden?.employee_id || 'EMP-WRD-042'}) • Location: {user?.warden?.office_location || 'Admin Wing Block-A'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <Link
              to="/warden/students"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white text-purple-900 text-xs font-black shadow-lg hover:bg-purple-50 transition flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4 text-purple-700" /> Student Directory
            </Link>
            <Link
              to="/warden/allocations"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-500/30 border border-purple-400/40 text-purple-100 text-xs font-black hover:bg-purple-500/50 transition flex items-center justify-center gap-1.5 backdrop-blur-md"
            >
              <Bed className="w-4 h-4 text-amber-300" /> Bed Allocator
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          title="Total Residents"
          value={stats?.totalStudents || 120}
          subtitle="Registered active scholars"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Bed Occupancy"
          value={`${stats?.occupancyRate || 85}%`}
          subtitle={`${stats?.occupiedBeds || 0} / ${stats?.totalBeds || 0} occupied`}
          icon={Bed}
          color="blue"
          trend={`${stats?.vacantBeds || 0} vacant`}
        />
        <StatCard
          title="Open Complaints"
          value={stats?.pendingComplaints || 0}
          subtitle={`${stats?.inProgressComplaints || 0} currently in progress`}
          icon={AlertCircle}
          color={stats?.pendingComplaints > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Mess Satisfaction"
          value={`${stats?.messStats?.avgRating || 4.2} ★`}
          subtitle={`Audited from ${stats?.messStats?.totalReviews || 0} reviews`}
          icon={UtensilsCrossed}
          color="emerald"
        />
      </div>

      {/* Quick Live Broadcast Box & Intelligence Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Hostel Intelligence Insights */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900">Live Residential Intelligence & Alerts</h3>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" /> Real-Time Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((insight, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01 }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-start gap-3 shadow-xs"
              >
                <div className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{insight}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Instant Broadcast to Hostel Residents */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-4 h-4 text-rose-400 animate-pulse" />
              <h3 className="text-sm font-black tracking-tight">Instant Public Broadcast</h3>
            </div>
            <p className="text-xs text-slate-300">
              Transmit an emergency alert or roll-call notice directly to all student resident dashboards.
            </p>
          </div>

          <form onSubmit={handleBroadcastQuickAlert} className="space-y-2.5">
            <textarea
              rows={2}
              value={quickAlertText}
              onChange={(e) => setQuickAlertText(e.target.value)}
              placeholder="e.g. Mandatory night roll-call at 9:30 PM in the Central Quadrangle..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />

            {alertSent && (
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Transmitted to digital notice board!
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" /> Transmit Emergency Broadcast
            </button>
          </form>
        </div>

      </div>

      {/* Quick Access Shortcuts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link
          to="/warden/students"
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-300 transition group relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors">
            Student Directory & Checkout
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Browse all student scholars, check room allotments, and execute 1-click hostel checkouts.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-black text-rose-600">
            View Residents <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/warden/allocations"
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-300 transition group relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Bed className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors">
            Bed Allocation Matrix
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Interactive room blueprint. Allocate beds, vacate departed students, and inspect occupancy telemetry.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-black text-blue-600">
            Open Bed Map <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/warden/complaints"
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-300 transition group relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors">
            Complaint Resolution Desk
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Assign maintenance tickets to technicians. Update progress and close verified tickets.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-black text-amber-600">
            Manage Tickets <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/warden/gate-passes"
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-300 transition group relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <QrCode className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors">
            Gate Pass Authorizations
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Review student outings and night-stay requests. Approve and generate digital QR tokens.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-black text-purple-600">
            Review Gate Passes <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

      </div>

    </motion.div>
  );
}
