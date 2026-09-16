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
  PieChart as PieIcon,
  ShieldCheck,
  AlertCircle,
  Building,
  UtensilsCrossed
} from 'lucide-react';

export default function WardenAnalytics() {
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { stats, charts = {}, insights = [] } = data || {};
  const { complaintsByCategory = [], complaintsByStatus = [], blockStats = [] } = charts;

  const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Hostel Operational Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Quantitative metrics on room occupancy, maintenance bottlenecks, and dining satisfaction.
        </p>
      </div>

      {/* Smart Automated Insights Strip */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-black">AI & Statistical Intelligence Digest</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {insights.map((insight, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-xs font-semibold">
              <p className="leading-relaxed text-purple-100">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Complaints by Category Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Complaints by Maintenance Category</h3>
              <p className="text-xs text-slate-400">Total tickets logged by residents</p>
            </div>
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintsByCategory}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint Resolution Status Pie */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Complaint Resolution Pipeline</h3>
              <p className="text-xs text-slate-400">Current ticket distribution</p>
            </div>
            <PieIcon className="w-5 h-5 text-purple-600" />
          </div>

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
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Block Occupancy Comparison */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Block-wise Capacity vs Occupancy</h3>
              <p className="text-xs text-slate-400">Total beds vs occupied beds across hostel blocks</p>
            </div>
            <Building className="w-5 h-5 text-purple-600" />
          </div>

          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockStats}>
                <XAxis dataKey="block_name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="total_beds" fill="#cbd5e1" name="Total Beds" radius={[4, 4, 0, 0]} />
                <Bar dataKey="occupied_beds" fill="#3b82f6" name="Occupied Beds" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vacant_beds" fill="#10b981" name="Vacant Beds" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
