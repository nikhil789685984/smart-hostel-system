import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { UtensilsCrossed, AlertCircle, History, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export default function ReportMess() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formData, setFormData] = useState({
    issue_type: '',
    description: ''
  });

  const loadData = async () => {
    try {
      const res = await api.getMyMessComplaints().catch(() => ({ complaints: [] }));
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitMessComplaint(formData);
      if (res.success) {
        setSuccessMsg('Mess complaint filed successfully. Admin has been notified.');
        setFormData({ issue_type: '', description: '' });
        loadData();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      alert(err.message || 'Error submitting complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30 flex items-center gap-1">
              <UtensilsCrossed className="w-3 h-3 text-amber-300" />
              Mess & Hygiene Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Report Mess Issues</h1>
          <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
            Report issues regarding food quality, hygiene, or mess staff behavior. These reports are strictly monitored by the Hostel Administration.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Col - Complaint Form */}
        <div className="bg-white/80 backdrop-blur-xl border border-amber-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" /> File New Mess Complaint
          </h2>
          
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-black text-amber-800 uppercase mb-1 tracking-wider">Quality Assurance</h4>
              <p className="text-xs text-amber-700 leading-relaxed font-medium">
                Your feedback directly influences the vendor ratings. Please provide accurate details regarding date, meal, and specific issues faced.
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Issue Category</label>
              <select
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm transition font-medium"
                value={formData.issue_type}
                onChange={(e) => setFormData({...formData, issue_type: e.target.value})}
              >
                <option value="">-- Select Issue Type --</option>
                <option value="Food Quality (Raw/Stale/Taste)">Food Quality (Raw/Stale/Taste)</option>
                <option value="Hygiene & Cleanliness">Hygiene (Insects/Dirty Utensils)</option>
                <option value="Staff Behavior">Mess Staff Behavior/Rudeness</option>
                <option value="Menu Non-Compliance">Menu Non-Compliance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Detailed Description</label>
              <textarea
                required
                rows={5}
                placeholder="Describe the issue. Mention which meal (Breakfast/Lunch/Dinner) and what exactly went wrong."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm transition resize-none font-medium"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-black shadow-lg shadow-amber-500/30 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Mess Complaint'}
            </button>
          </form>
        </div>

        {/* Right Col - Past Complaints */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" /> Complaint History
            </h2>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
              {complaints.length} Records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
            ) : complaints.length > 0 ? (
              complaints.map(c => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded bg-white text-[10px] font-black text-slate-600 uppercase border border-slate-200">
                      {c.issue_type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.description}</p>
                  <div className="mt-3 flex justify-end">
                    <Link to={`/student/complaints/${c.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] uppercase rounded-lg transition border border-amber-100">
                      View Ticket Chat <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-900">No Complaints Found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[250px]">You have not filed any mess complaints.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
