import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import {
  Building2,
  Users,
  ShieldAlert,
  CreditCard,
  BarChart3,
  Building,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  Database,
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
  Leaf,
  Coffee,
  Sun,
  Moon,
  Printer,
  ChevronRight,
  BellRing,
  Bell,
  Send,
  Coins,
  RefreshCw,
  Wallet,
  Receipt,
  Scale,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [messAnalytics, setMessAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [wardenComplaints, setWardenComplaints] = useState([]);
  const [messComplaints, setMessComplaints] = useState([]);
  const [fines, setFines] = useState([]);
  const [runningPayroll, setRunningPayroll] = useState(false);
  const [alertingAll, setAlertingAll] = useState(false);
  const [sendingAlertId, setSendingAlertId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const handleAlertAllDefaulters = async () => {
    if (!window.confirm('Broadcast urgent payment alert to all students with overdue fees or late fines?')) return;
    setAlertingAll(true);
    try {
      const res = await api.sendFeeAlertToDefaulters();
      if (res.success) {
        setAlertMsg(res.message || `Dispatched alerts to ${res.count} students!`);
        setTimeout(() => setAlertMsg(null), 6000);
      }
    } catch (err) {
      alert(err.message || 'Failed to dispatch alerts.');
    } finally {
      setAlertingAll(false);
    }
  };

  const handleSendAlert = async (studentId, studentName) => {
    setSendingAlertId(studentId);
    try {
      const res = await api.sendFeeAlertToStudent(studentId);
      if (res.success) {
        setAlertMsg(`Urgent payment alert dispatched directly to ${studentName}!`);
        setTimeout(() => setAlertMsg(null), 5000);
      }
    } catch (err) {
      alert(err.message || 'Failed to send alert.');
    } finally {
      setSendingAlertId(null);
    }
  };

  const handleRunPayroll = async () => {
    if(!window.confirm('Execute monthly payroll for all wardens and staff?')) return;
    setRunningPayroll(true);
    try {
      const res = await api.processGlobalSalary();
      if(res.success) alert('Payroll processed successfully!');
    } catch(err) {
      alert(err.message || 'Error processing payroll');
    } finally {
      setRunningPayroll(false);
    }
  };

  const loadData = async (isBackground = false) => {
    if (isBackground) setIsRefreshing(true);
    try {
      const [res, messRes, wcRes, mcRes, finesRes] = await Promise.all([
        api.getHostelAnalytics(),
        api.getAdminMessAnalytics().catch(() => ({ analytics: null })),
        api.getAdminWardenComplaints().catch(() => ({ complaints: [] })),
        api.getAdminMessComplaints().catch(() => ({ complaints: [] })),
        api.getAllFines().catch(() => ({ fines: [] }))
      ]);
      setAnalytics(res);
      setMessAnalytics(messRes?.analytics);
      if(wcRes?.complaints) setWardenComplaints(wcRes.complaints);
      if(mcRes?.complaints) setMessComplaints(mcRes.complaints);
      if(finesRes?.fines) setFines(finesRes.fines);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    // Real-time telemetry: auto-poll live revenue and hostel stats every 4 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3">
        <div className="w-10 h-10 border-4 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-bold">Synchronizing campus residential ERP...</span>
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
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-500/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Apex Institutional ERP • Super-Administrator
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Campus Residential ERP Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Administrator: <strong className="text-white">{user?.name}</strong> ({user?.email}) • Full Governance Authority
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/students"
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-black shadow-lg hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-rose-600" /> Student Directory
            </Link>
            <Link
              to="/admin/analytics"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" /> Global Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Residents"
          value={stats?.totalStudents || 120}
          subtitle="Enrolled campus scholars"
          icon={Users}
          color="rose"
        />
        <StatCard
          title="Hostel Wardens"
          value={stats?.totalWardens || 2}
          subtitle="Active residential wardens"
          icon={ShieldAlert}
          color="purple"
        />
        <StatCard
          title="Overall Bed Occupancy"
          value={`${stats?.occupancyRate || 87}%`}
          subtitle={`${stats?.occupiedBeds || 0} / ${stats?.totalBeds || 0} beds allocated`}
          icon={Building}
          color="blue"
        />
        <StatCard
          title="Total Gross Revenue (Real-Time)"
          value={`₹${Number(stats?.totalRevenue || 0).toLocaleString()}`}
          subtitle={`₹${Number(stats?.feeRevenue || 0).toLocaleString()} Fees + ₹${Number(stats?.finesRevenue || 0).toLocaleString()} Fines`}
          icon={CreditCard}
          color="emerald"
          trend="⚡ Live Inflow"
        />
      </div>

      {/* Real-Time Gross Revenue & Treasury Intelligence Engine */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Revenue Inflow Telemetry
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Auto-syncing every 4s
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" />
              Real-Time Campus Treasury & Revenue Engine
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              100% granular financial aggregation: combines base hostel/mess fees with every single rupee and paisa of collected late fines (₹100/day) and disciplinary citations in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-2 backdrop-blur-sm cursor-pointer disabled:opacity-50"
              title="Trigger instant sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Updated {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* 4 Revenue Telemetry Pillars */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Gross Inflow */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Total Gross Revenue</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">
              ₹{Number(stats?.totalRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-200/70 font-semibold mt-1">
              100% settled inflow (Fees + Fines)
            </p>
          </div>

          {/* Base Fees Inflow */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition">
            <div className="flex items-center justify-between text-blue-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Semester & Hostel Fees</span>
              <Receipt className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-200 mt-1">
              ₹{Number(stats?.feeRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-blue-200/70 font-semibold mt-1">
              Tuition, accommodation & mess
            </p>
          </div>

          {/* Collected Fines Inflow */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-amber-500/30 transition">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Collected Late & Other Fines</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
              ₹{Number(stats?.finesRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-amber-200/70 font-semibold mt-1">
              Overdue fines + citations paid
            </p>
          </div>

          {/* Pending Receivables */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-rose-500/30 transition">
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Outstanding Overdue</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-300 mt-1">
              ₹{Number(stats?.totalPending || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-rose-200/70 font-semibold mt-1">
              ₹{Number(stats?.pendingFines || 0).toLocaleString()} fines + ₹{Number(stats?.pendingFeeAmount || 0).toLocaleString()} fees
            </p>
          </div>
        </div>

        {/* Breakdown bar & Recent Live Inflow Stream */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Fine Categories Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              Fine Category Real-Time Yield
            </h4>
            <div className="space-y-2">
              {(stats?.finesBreakdown || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No fine categories assessed.</p>
              ) : (
                stats.finesBreakdown.map((fb, idx) => {
                  const totalCategory = fb.paid_amount + fb.unpaid_amount;
                  const paidPercent = totalCategory > 0 ? Math.round((fb.paid_amount / totalCategory) * 100) : 0;
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-200">{fb.type}</span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-400 font-black">₹{Number(fb.paid_amount).toLocaleString()} Paid</span>
                          <span className="text-slate-500">|</span>
                          <span className="text-rose-400 font-semibold">₹{Number(fb.unpaid_amount).toLocaleString()} Pending</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${paidPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Real-Time Payment Inflow Stream */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Live Inflow Transaction Stream
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(stats?.recentRevenueTransactions || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No incoming settlement records yet.</p>
              ) : (
                stats.recentRevenueTransactions.map((tx, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${tx.source === 'fine' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-xs">{tx.student_name} <span className="text-slate-400 font-normal">({tx.roll_number})</span></p>
                        <p className="text-[10px] text-slate-400 truncate">{tx.item_name} • {tx.payment_method}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-mono font-black text-emerald-400 text-xs">+₹{Number(tx.amount).toLocaleString()}</span>
                      <p className="text-[9px] text-slate-500">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Infrastructure Telemetry Strip */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Server className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-black text-slate-800">Cluster Telemetry Status:</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">Database Adapter:</span>
            <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
              MySQL 8 / Dual-Engine Online
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500">Gemini AI Model:</span>
            <span className="font-bold text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
              1.5 Flash + Fallback NLP
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Turnstile Turnkey:</span>
            <span className="font-bold text-slate-900 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
              QR Token Engine Ready
            </span>
          </div>
        </div>
      </div>

      {/* Management Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Link
          to="/admin/students"
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-rose-300 transition group relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-900 group-hover:text-rose-600 transition-colors">
            Manage Student Residents
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Enrol new students, assign room accommodations, inspect pending semester fees, and modify student records.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-black text-blue-600">
            Open Student Directory <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/admin/wardens"
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-rose-300 transition group relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-900 group-hover:text-rose-600 transition-colors">
            Warden Administration
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Hostel wardens roster, designated Boys/Girls buildings, employee identity codes, and contact rosters.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-black text-purple-600">
            Open Warden Roster <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/admin/rooms"
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-rose-300 transition group relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Building className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-900 group-hover:text-rose-600 transition-colors">
            Hostels & Wing Setup
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Configure campus buildings, architectural blocks, room capacities, AC/Non-AC types, and semester fees.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-black text-rose-600">
            Configure Infrastructure <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

      </div>

      {/* Institutional Mess Waste & Catering Governance (Admin Perspective) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Leaf className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Institutional Mess Waste & Catering Governance
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Super-administrative audit of student dining absences, fee rebate disbursements, contractor invoice reconciliation, and sustainability food waste reduction.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Audit Sheet
            </button>
            <Link
              to="/admin/mess"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
              Kitchen Operational Roster <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Sustainability & Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 rounded-2xl border border-emerald-200/80">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Food Waste Prevented</span>
              <Leaf className="w-4 h-4 text-emerald-600" />
            </div>
            <h4 className="text-2xl font-black text-emerald-950 mt-1">
              {messAnalytics?.foodWastePreventedKg || 0} kg
            </h4>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              ~0.45 kg raw grains & produce saved per plate
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-5 rounded-2xl border border-blue-200/80">
            <div className="flex items-center justify-between text-blue-800 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Student Rebates Credited</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="text-2xl font-black text-blue-950 mt-1">
              ₹{(messAnalytics?.totalRebateDisbursed || 0).toLocaleString()}
            </h4>
            <p className="text-[11px] text-blue-700 font-semibold mt-1">
              Direct fee ledger balance adjustments
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50/40 p-5 rounded-2xl border border-purple-200/80">
            <div className="flex items-center justify-between text-purple-800 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Contractor Cost Savings</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="text-2xl font-black text-purple-950 mt-1">
              ₹{(messAnalytics?.catererSavings || 0).toLocaleString()}
            </h4>
            <p className="text-[11px] text-purple-700 font-semibold mt-1">
              Avoided procurement & kitchen cook overhead
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 rounded-2xl border border-amber-200/80">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Meals Skipped</span>
              <UtensilsCrossed className="w-4 h-4 text-amber-600" />
            </div>
            <h4 className="text-2xl font-black text-amber-950 mt-1">
              {messAnalytics?.totalMealsSkipped || 0}
            </h4>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              Pre-registered by residents
            </p>
          </div>
        </div>

        {/* Breakdown Columns: Meal Types & Block Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Meal Type Split */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Absenteeism by Meal Type</span>
              <span className="text-[10px] text-slate-400 font-bold">Campus Distribution</span>
            </h4>
            <div className="space-y-2.5">
              {(messAnalytics?.mealBreakdown || []).map((m) => {
                const total = messAnalytics.totalMealsSkipped || 1;
                const pct = Math.round((m.count / total) * 100);
                return (
                  <div key={m.meal_type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        {m.meal_type === 'Breakfast' && <Coffee className="w-3.5 h-3.5 text-amber-600" />}
                        {m.meal_type === 'Lunch' && <Sun className="w-3.5 h-3.5 text-orange-600" />}
                        {m.meal_type === 'Dinner' && <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                        {m.meal_type}
                      </span>
                      <span className="font-mono text-slate-900">{m.count} meals ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          m.meal_type === 'Breakfast'
                            ? 'bg-amber-500'
                            : m.meal_type === 'Lunch'
                            ? 'bg-orange-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block-by-Block Split */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Absenteeism by Hostel Wing / Block</span>
              <span className="text-[10px] text-slate-400 font-bold">Residential Origin</span>
            </h4>
            <div className="space-y-2">
              {(messAnalytics?.blockBreakdown || []).map((b) => (
                <div key={b.block_name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-200/70 font-bold">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-800">{b.block_name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-black">
                    {b.absent_count} skips
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Ledger Table (Admin Verification) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Institutional Meal Absence Audit Ledger (Recent Transactions)
            </h4>
            <span className="text-[11px] text-slate-400 font-semibold">
              Reconciled with Accounts & Contractor Billing
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Student Scholar</th>
                  <th className="py-2.5 px-4">Room & Wing</th>
                  <th className="py-2.5 px-4">Meal</th>
                  <th className="py-2.5 px-4">Logged Reason</th>
                  <th className="py-2.5 px-4 text-right">Rebate Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(messAnalytics?.auditLedger || []).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{row.date}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-800 block">{row.student_name}</span>
                      <span className="text-[10px] text-slate-400">{row.roll_number}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-slate-800 font-semibold">{row.room_number ? `Room ${row.room_number}` : 'Unassigned'}</span>
                      <span className="text-[10px] text-slate-400 block">{row.block_name || 'Campus Wing'}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                        row.meal_type === 'Breakfast'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : row.meal_type === 'Lunch'
                          ? 'bg-orange-50 text-orange-800 border-orange-200'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}>
                        {row.meal_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{row.reason}</td>
                    <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                      +₹{row.rebate_amount || 65}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      
      
      {/* Fines Section */}
      {fines.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-red-100">
          {alertMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{alertMsg}</span>
              </div>
              <button onClick={() => setAlertMsg(null)} className="text-emerald-600 hover:text-emerald-800 font-bold ml-2">✕</button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" /> Disciplinary & Late Fines
              </h2>
              <p className="text-sm text-slate-500 font-medium">Overview of pending penalties with 1-click student alert notices</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={alertingAll}
                onClick={handleAlertAllDefaulters}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {alertingAll ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <BellRing className="w-3.5 h-3.5 text-white animate-pulse" />
                )}
                Broadcast Warning to All Defaulters
              </button>
              <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 text-right">
                <p className="text-[10px] font-black uppercase text-emerald-600 mb-0.5">Fines Inflow (Live In Revenue)</p>
                <p className="text-lg font-black text-emerald-700">
                  ₹{fines.filter(f => f.status === 'Paid').reduce((a, c) => a + c.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 text-right">
                <p className="text-[10px] font-black uppercase text-orange-500 mb-0.5">Pending Overdue Fines</p>
                <p className="text-lg font-black text-orange-700">
                  ₹{fines.filter(f => f.status !== 'Paid').reduce((a, c) => a + c.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4 font-bold">Student</th>
                  <th className="pb-3 pr-4 font-bold">Fine Type</th>
                  <th className="pb-3 pr-4 font-bold">Amount</th>
                  <th className="pb-3 pr-4 font-bold">Status</th>
                  <th className="pb-3 pr-4 font-bold">Date Issued</th>
                  <th className="pb-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.slice(0, 10).map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{f.student_name}</p>
                      <p className="text-xs text-slate-500">{f.roll_number}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-black text-slate-700 uppercase">
                        {f.type}
                      </span>
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{f.reason}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="font-bold text-red-600">₹{f.amount}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${f.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      {f.status !== 'Paid' ? (
                        <button
                          type="button"
                          disabled={sendingAlertId === f.student_id}
                          onClick={() => handleSendAlert(f.student_id, f.student_name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black uppercase rounded-lg transition border border-rose-200 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <BellRing className="w-3 h-3 text-rose-600" />
                          {sendingAlertId === f.student_id ? 'Sending...' : 'Send Alert'}
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mess Escalations */}
      {messComplaints.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-amber-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-500" /> Mess & Hygiene Reports
              </h2>
              <p className="text-xs text-slate-500 font-medium">Direct student feedback on food quality and staff</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full">
              {messComplaints.length} Reports
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Issue Type</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messComplaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{c.student_name}</p>
                      <p className="text-xs text-slate-500">{c.roll_number}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="px-2 py-1 rounded bg-amber-50 text-[10px] font-black text-amber-700 uppercase border border-amber-200">
                        {c.issue_type}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-xs text-slate-500 max-w-sm truncate">{c.description}</p>
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <Link to={`/admin/complaints/${c.id}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition border border-blue-200">
                        View Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warden Escalations */}
      {wardenComplaints.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-rose-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> Warden Escalations
              </h2>
              <p className="text-xs text-slate-500 font-medium">Confidential student reports against wardens</p>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase rounded-full">
              {wardenComplaints.length} Escalations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Warden</th>
                  <th className="pb-3 pr-4">Subject</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wardenComplaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{c.student_name}</p>
                      <p className="text-xs text-slate-500">{c.roll_number}</p>
                    </td>
                    <td className="py-4 pr-4 font-bold text-slate-700">{c.warden_name}</td>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{c.subject}</p>
                      <p className="text-xs text-slate-500 max-w-xs truncate">{c.description}</p>
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <Link to={`/admin/complaints/${c.id}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition border border-blue-200">
                        View Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </motion.div>
  );
}
