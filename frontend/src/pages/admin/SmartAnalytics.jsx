import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, CartesianGrid
} from 'recharts';
import {
  TrendingUp, Printer, CheckCircle2, AlertTriangle, ShieldCheck, 
  CreditCard, Building, Users, Activity, BatteryCharging, Zap, Layers, RefreshCw
} from 'lucide-react';

export default function SmartAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.getHostelAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Initializing Data Core...</p>
      </div>
    );
  }

  const { stats, charts = {}, insights = [] } = data || {};
  const { complaintsByCategory = [], complaintsByStatus = [], blockStats = [] } = charts;

  const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

  // Synthetic data for AreaChart (Revenue Growth / Predictive)
  const revenueGrowthData = [
    { name: 'Jan', revenue: 400000, projected: 410000 },
    { name: 'Feb', revenue: 650000, projected: 670000 },
    { name: 'Mar', revenue: 980000, projected: 990000 },
    { name: 'Apr', revenue: 1100000, projected: 1200000 },
    { name: 'May', revenue: stats?.totalRevenue || 1400000, projected: 1550000 },
    { name: 'Jun', revenue: null, projected: 1800000 },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans pb-10">
      
      {/* 🌌 Hero Header */}
      <div className="relative overflow-hidden p-8 rounded-[2.5rem] shadow-2xl border flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-950 border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 blur-3xl opacity-20 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500 blur-3xl opacity-10 rounded-full"></div>

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner bg-slate-800 text-cyan-400 border border-slate-700/50">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Smart Analysis Core</h1>
            <p className="mt-1 text-slate-400 font-medium flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              Live Predictive Intelligence & Financial Telemetry
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors border border-white/10"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black hover:bg-slate-100 transition flex items-center gap-2 shadow-lg"
          >
            <Printer className="w-5 h-5" /> Export Report
          </button>
        </div>
      </div>

      {/* 📊 KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Gross Billed Demand" 
          value={`₹${Number(stats?.totalBilledDemand || 0).toLocaleString()}`} 
          subtitle="Base Fees + All Fines" 
          icon={Layers} 
          color="indigo" 
        />
        <KpiCard 
          title="Settled Revenue" 
          value={`₹${Number(stats?.totalRevenue || 0).toLocaleString()}`} 
          subtitle={`₹${Number(stats?.finesRevenue || 0).toLocaleString()} from fines`} 
          icon={CreditCard} 
          color="emerald" 
        />
        <KpiCard 
          title="Outstanding Debt" 
          value={`₹${Number(stats?.totalPending || 0).toLocaleString()}`} 
          subtitle="Unpaid student dues" 
          icon={AlertTriangle} 
          color="rose" 
          alert
        />
        <KpiCard 
          title="Occupancy Yield" 
          value={`${stats?.occupancyRate || 0}%`} 
          subtitle={`${stats?.occupiedBeds || 0} / ${stats?.totalBeds || 0} beds filled`} 
          icon={Building} 
          color="cyan" 
        />
      </div>

      {/* 🚀 Predictive & Deep Analytics Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Revenue Projection (AreaChart) */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">Revenue Velocity & Forecasting</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">AI-Projected Collections vs Actuals</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-indigo-500"></div> Actual</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-300"></div> Projected</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueGrowthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', color: '#fff', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="projected" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Strategic Insights AI Output Box */}
        <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white">Neural Insights</h3>
          </div>

          <div className="space-y-4 flex-1 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-[1.2rem] flex gap-3 group hover:bg-white/10 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 group-hover:scale-150 transition-transform"></div>
                <p className="text-sm font-medium text-slate-300 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 🧱 Structural Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Block Wise Distribution (Bar Chart) */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-1">Block Distribution</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Rooms & Capacity Mapping</p>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockStats} layout="vertical" margin={{ left: -20, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="block_name" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="total_rooms" name="Total Rooms" fill="#94a3b8" radius={[0, 8, 8, 0]} barSize={12} />
                <Bar dataKey="occupied_beds" name="Occupied Beds" fill="#10b981" radius={[0, 8, 8, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Distribution */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-900 mb-1">Maintenance Pipeline</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Service Ticket Lifecycle</p>
          
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="h-48 w-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    stroke="none"
                  >
                    {complaintsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-800">{stats?.totalComplaints || 0}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tickets</span>
              </div>
            </div>

            <div className="space-y-3">
              {complaintsByStatus.map((status, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: STATUS_COLORS[idx % STATUS_COLORS.length]}}></div>
                  <span className="text-sm font-bold text-slate-700 w-24">{status.name}</span>
                  <span className="text-sm font-black text-slate-900">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, color, alert }) {
  const bgStyles = {
    indigo: 'bg-indigo-50 border-indigo-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    rose: 'bg-rose-50 border-rose-100',
    cyan: 'bg-cyan-50 border-cyan-100'
  };
  const iconStyles = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    rose: 'bg-rose-100 text-rose-600',
    cyan: 'bg-cyan-100 text-cyan-600'
  };

  return (
    <div className={`p-6 rounded-[2rem] border shadow-sm flex flex-col ${bgStyles[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${iconStyles[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</p>
        <h3 className={`text-3xl font-black tracking-tight ${alert && parseInt(value.replace(/\D/g,'')) > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
          {value}
        </h3>
        <p className="text-[11px] font-bold text-slate-500 mt-2 line-clamp-1">{subtitle}</p>
      </div>
    </div>
  );
}
