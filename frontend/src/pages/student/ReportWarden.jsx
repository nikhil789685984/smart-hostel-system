import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { ShieldAlert, AlertOctagon, History, User, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ReportWarden() {
  const [wardenList, setWardenList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formData, setFormData] = useState({
    warden_user_id: '',
    subject: '',
    description: ''
  });

  const loadData = async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        api.getWardensList().catch(() => ({ wardens: [] })),
        api.getMyWardenComplaints().catch(() => ({ complaints: [] }))
      ]);
      setWardenList(wRes.wardens || []);
      setComplaints(cRes.complaints || []);
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
      const res = await api.submitWardenComplaint(formData);
      if (res.success) {
        setSuccessMsg('Escalation filed successfully. Super-Admin has been notified.');
        setFormData({ warden_user_id: '', subject: '', description: '' });
        loadData();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      alert(err.message || 'Error submitting escalation');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-300" />
              Confidential Admin Channel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Warden Escalation Portal</h1>
          <p className="text-xs text-rose-200/80 mt-1 max-w-xl">
            Report unprofessional behavior, negligence, or harassment. This channel bypasses all wardens and reports directly to the Institutional Super-Admin.
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
        
        {/* Left Col - Escalation Form */}
        <div className="bg-white/80 backdrop-blur-xl border border-rose-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" /> File New Escalation
          </h2>
          
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex gap-3 shadow-sm">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-black text-rose-800 uppercase mb-1 tracking-wider">Strict Disciplinary Warning</h4>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                Filing a fake, baseless, or malicious complaint against a warden is a severe violation. Strict disciplinary action will be taken against any student found misusing this escalation channel.
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Select Warden</label>
              <select
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition font-medium"
                value={formData.warden_user_id}
                onChange={(e) => setFormData({...formData, warden_user_id: e.target.value})}
              >
                <option value="">-- Choose Warden to Report --</option>
                {wardenList.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Incident Subject</label>
              <input
                type="text"
                required
                placeholder="E.g., Negligence of duty, Unprofessional conduct"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition font-medium"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Detailed Description</label>
              <textarea
                required
                rows={5}
                placeholder="Describe the incident securely and honestly. Note: False reporting is subject to disciplinary action."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition resize-none font-medium"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-sm font-black shadow-lg shadow-rose-500/30 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? 'Transmitting to Admin...' : 'Submit Confidential Report'}
            </button>
          </form>
        </div>

        {/* Right Col - Past Escalations */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" /> Escalation History
            </h2>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
              {complaints.length} Records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
              </div>
            ) : complaints.length > 0 ? (
              complaints.map(c => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded bg-white text-[10px] font-black text-slate-600 uppercase border border-slate-200 flex items-center gap-1">
                      <User className="w-3 h-3 text-rose-500" /> {c.warden_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{c.subject || c.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                  <div className="mt-3 flex justify-end">
                    <Link to={`/student/complaints/${c.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] uppercase rounded-lg transition border border-blue-100">
                      View Ticket Chat <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-900">No Escalations Found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[250px]">You have not filed any confidential reports against a warden.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
