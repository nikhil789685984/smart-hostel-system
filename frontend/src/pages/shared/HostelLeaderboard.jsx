import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  RefreshCw,
  Plus,
  Zap,
  TrendingUp,
  Star,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function HostelLeaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    block_id: '2',
    cleanliness_score: '9.5',
    remarks: 'Routine hygiene check passed cleanly.'
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const isWardenOrAdmin = ['warden', 'admin'].includes(user?.role);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.getLeaderboard();
      setData(res);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitInspection(inspectionForm);
      setMsg(res.message);
      setInspectionModalOpen(false);
      fetchLeaderboard();
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error logging inspection score');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Loading Leaderboard Standings...</span>
      </div>
    );
  }

  const rankings = data?.rankings || [];
  const champion = data?.champion || rankings[0];
  const runnerUp = rankings[1];
  const thirdPlace = rankings[2];
  const remainingRankings = rankings.slice(3);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-amber-500/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur border border-amber-400/30 text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Apex Inter-Block Friendly Competition 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              🏆 Hostel Block Cleanliness Leaderboard
            </h1>
            <p className="text-xs text-amber-200/80 max-w-2xl font-medium leading-relaxed">
              Real-time rankings based on Warden hygiene inspection ratings, complaint resolution speed, and block resident sanitation compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {isWardenOrAdmin && (
              <button
                onClick={() => setInspectionModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Log Block Audit
              </button>
            )}
            <button
              onClick={fetchLeaderboard}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-2 backdrop-blur"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </motion.div>
      )}

      {/* TOP 3 PODIUM DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* SECOND PLACE (SILVER) */}
        {runnerUp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 md:order-1 bg-white rounded-3xl p-6 border-2 border-slate-300 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-slate-400 transition"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-bl-full pointer-events-none -mr-4 -mt-4 flex items-center justify-center pt-2 pr-2">
              <span className="text-3xl">🥈</span>
            </div>
            
            <div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                🥈 2nd Place • Runner Up
              </span>

              <h3 className="text-xl font-black text-slate-900 mt-4">{runnerUp.block_name}</h3>
              <p className="text-xs text-slate-500 font-medium">{runnerUp.hostel_name}</p>

              <div className="mt-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Overall Score:</span>
                  <span className="font-black text-slate-900 text-base">{runnerUp.total_score} / 100</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Cleanliness Rating:</span>
                  <span className="font-bold text-slate-800">⭐ {runnerUp.cleanliness_score} / 10</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Complaint Resolution:</span>
                  <span className="font-bold text-emerald-600">{runnerUp.resolution_rate}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 italic">
              "{runnerUp.remarks}"
            </div>
          </motion.div>
        )}

        {/* FIRST PLACE (GOLD CHAMPION) */}
        {champion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-yellow-400/10 to-white rounded-3xl p-7 border-2 border-amber-400 shadow-xl flex flex-col justify-between relative overflow-hidden group scale-105"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-400 to-yellow-300 rounded-bl-full pointer-events-none -mr-4 -mt-4 flex items-center justify-center pt-2 pr-2 shadow-md">
              <span className="text-4xl animate-bounce">🥇</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                  🥇 1st Place • Cleanest Block Champion
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-950 mt-4 flex items-center gap-2">
                {champion.block_name}
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h2>
              <p className="text-xs text-amber-900 font-bold">{champion.hostel_name}</p>

              <div className="mt-5 p-4 rounded-2xl bg-white/90 border-2 border-amber-300 shadow-sm space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-amber-900 uppercase tracking-wider text-[11px]">Total Points:</span>
                  <span className="font-black text-amber-700 text-xl">{champion.total_score} <span className="text-xs text-slate-400 font-medium">/ 100</span></span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-semibold">Cleanliness Audit Score:</span>
                  <span className="font-extrabold text-amber-600 text-sm">⭐ {champion.cleanliness_score} / 10</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-semibold">Complaint Resolution Rate:</span>
                  <span className="font-black text-emerald-600 text-sm">{champion.resolution_rate}%</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-amber-200/60 space-y-2">
              <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-[11px] font-bold text-amber-950 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600 shrink-0 fill-amber-500" />
                <span>Month Perk: Special Sunday Biryani Feast & Common Room Upgrade!</span>
              </div>
              <p className="text-[11px] text-slate-600 italic">
                "{champion.remarks}"
              </p>
            </div>
          </motion.div>
        )}

        {/* THIRD PLACE (BRONZE) */}
        {thirdPlace && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-3 bg-white rounded-3xl p-6 border-2 border-amber-700/30 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-amber-700/50 transition"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 flex items-center justify-center pt-2 pr-2">
              <span className="text-3xl">🥉</span>
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-300/60">
                🥉 3rd Place • Bronze Tier
              </span>

              <h3 className="text-xl font-black text-slate-900 mt-4">{thirdPlace.block_name}</h3>
              <p className="text-xs text-slate-500 font-medium">{thirdPlace.hostel_name}</p>

              <div className="mt-5 p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Overall Score:</span>
                  <span className="font-black text-slate-900 text-base">{thirdPlace.total_score} / 100</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Cleanliness Rating:</span>
                  <span className="font-bold text-slate-800">⭐ {thirdPlace.cleanliness_score} / 10</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Complaint Resolution:</span>
                  <span className="font-bold text-emerald-600">{thirdPlace.resolution_rate}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 italic">
              "{thirdPlace.remarks}"
            </div>
          </motion.div>
        )}

      </div>

      {/* FULL LEADERBOARD RANKINGS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> Complete Block Standings & Telemetry
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated across all hostel blocks on campus.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            {rankings.length} Blocks Rated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-50/80">
                <th className="py-3 px-4 rounded-l-xl">Rank</th>
                <th className="py-3 px-4">Hostel Block</th>
                <th className="py-3 px-4">Cleanliness Audit</th>
                <th className="py-3 px-4">Resolved Complaints</th>
                <th className="py-3 px-4">Resolution Rate</th>
                <th className="py-3 px-4 text-right">Composite Score</th>
                <th className="py-3 px-4 rounded-r-xl">Status Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.map((blk) => (
                <tr key={blk.id} className="hover:bg-slate-50/80 transition font-medium text-slate-700">
                  <td className="py-4 px-4 font-mono font-black text-sm">
                    {blk.medal ? <span className="text-xl">{blk.medal}</span> : `#${blk.rank}`}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-black text-slate-900 text-sm">{blk.block_name}</div>
                    <div className="text-[11px] text-slate-500">{blk.hostel_name}</div>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900">
                    ⭐ {blk.cleanliness_score} / 10
                  </td>
                  <td className="py-4 px-4 font-mono">
                    {blk.resolved_complaints} / {blk.total_complaints}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${blk.resolution_rate}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-700 font-mono">{blk.resolution_rate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-black text-sm text-slate-900 font-mono">
                    {blk.total_score} pts
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      blk.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      blk.rank === 2 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                      blk.rank === 3 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {blk.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WARDEN LOG INSPECTION MODAL */}
      <Modal
        isOpen={inspectionModalOpen}
        onClose={() => setInspectionModalOpen(false)}
        title="Log Block Cleanliness Inspection"
        subtitle="Submit weekly hygiene rating & audit notes"
      >
        <form onSubmit={handleInspectionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select Hostel Block *
            </label>
            <select
              value={inspectionForm.block_id}
              onChange={(e) => setInspectionForm({ ...inspectionForm, block_id: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {rankings.map(b => (
                <option key={b.id} value={b.id}>{b.block_name} ({b.hostel_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Cleanliness Audit Rating (1.0 to 10.0) *
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={inspectionForm.cleanliness_score}
              onChange={(e) => setInspectionForm({ ...inspectionForm, cleanliness_score: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Inspection Remarks & Sanitation Notes
            </label>
            <textarea
              rows="3"
              placeholder="Describe cleanliness state of corridors, common bathrooms, and waste disposal..."
              value={inspectionForm.remarks}
              onChange={(e) => setInspectionForm({ ...inspectionForm, remarks: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setInspectionModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl hover:from-amber-600 hover:to-yellow-600 shadow-md transition"
            >
              {submitting ? 'Logging...' : 'Submit Audit Rating'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
