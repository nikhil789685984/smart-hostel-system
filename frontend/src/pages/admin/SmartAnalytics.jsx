import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  ShieldCheck,
  CreditCard,
  Building,
  Users
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
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const { stats, charts = {}, insights = [] } = data || {};
  const { complaintsByCategory = [], complaintsByStatus = [], blockStats = [] } = charts;

  const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Campus Residential Intelligence & Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional metrics on facility uptime, bed yield, revenue velocity, and maintenance dispatch.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 self-start"
        >
          <Printer className="w-4 h-4" /> Print Analytics Report
        </button>
      </div>

      {/* High-Level Financial & Operational Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue Inflow</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            ₹{Number(stats?.totalRevenue || 72000).toLocaleString()}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Semester ledger settlement</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupancy Efficiency</span>
          <h3 className="text-2xl font-black text-blue-600 mt-1">{stats?.occupancyRate || 87}%</h3>
          <p className="text-xs text-slate-500 mt-1">{stats?.vacantBeds || 0} vacant inventory</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maintenance Tickets</span>
          <h3 className="text-2xl font-black text-purple-600 mt-1">{stats?.totalComplaints || 4} Total</h3>
          <p className="text-xs text-slate-500 mt-1">{stats?.resolvedComplaints || 0} successfully closed</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mess Quality Score</span>
          <h3 className="text-2xl font-black text-orange-600 mt-1">{stats?.messStats?.avgRating || 4.2} ★</h3>
          <p className="text-xs text-slate-500 mt-1">{stats?.messStats?.totalReviews || 3} student votes</p>
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-rose-600" />
          <h3 className="text-base font-black text-slate-900">Institutional Strategic Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 mt-1.5"></span>
              <span className="leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Complaints Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900">Maintenance Distribution by Trade</h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintsByCategory}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="count" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution Pipeline */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900">Ticket Resolution Pipeline</h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complaintsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {complaintsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
