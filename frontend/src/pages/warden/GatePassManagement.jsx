import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Search,
  Phone,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Check,
  RotateCcw,
  User,
  ArrowRight
} from 'lucide-react';

export default function GatePassManagement() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPass, setSelectedPass] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('Approved');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchPasses = async () => {
    try {
      const res = await api.getAllGatePasses({ status: statusFilter });
      setPasses(res.passes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, [statusFilter]);

  const openActionModal = (gp, type) => {
    setSelectedPass(gp);
    setActionType(type);
    if (type === 'Approved') {
      setRemarks('Parent phone consultation confirmed. Outing cleared.');
    } else if (type === 'Rejected') {
      setRemarks('Disciplinary curfew restriction or attendance shortage.');
    } else if (type === 'Departed') {
      setRemarks('Turnstile sensor logged exit. Student has departed.');
    } else if (type === 'Returned') {
      setRemarks('Resident safely checked back in before roll call.');
    }
    setActionModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.updateGatePassStatus(selectedPass.id, {
        status: actionType,
        warden_remarks: remarks,
      });
      setMsg(`Gate pass #${selectedPass.id} marked as ${actionType} in central ledger.`);
      setActionModalOpen(false);
      fetchPasses();
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error updating gate pass');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPasses = passes.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.student_name?.toLowerCase().includes(q) ||
      p.roll_number?.toLowerCase().includes(q) ||
      p.destination?.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              Chief Warden Authority
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Gate Pass & Night Outing Authorizations</h1>
          <p className="text-xs text-purple-200/80 mt-1 max-w-xl">
            Review residential exit requests, verify parental telephonic consent, adjust departure schedules, and issue cryptographic QR tokens.
          </p>
        </div>

        <button
          onClick={fetchPasses}
          className="relative z-10 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto backdrop-blur-md"
        >
          <RotateCcw className="w-4 h-4" /> Refresh Ledger
        </button>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {['All', 'Pending', 'Approved', 'Departed', 'Returned', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl transition whitespace-nowrap text-xs font-bold ${
                statusFilter === status
                  ? 'bg-purple-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, roll no..."
            className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 w-full sm:w-64 focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Passes List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-bold">Loading residential gate pass ledger...</span>
        </div>
      ) : filteredPasses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/90 text-center text-xs text-slate-500 shadow-sm">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-black text-base text-slate-800">No gate passes matching filter</p>
          <p className="mt-1 text-slate-400">All student requests in this category have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredPasses.map((gp, idx) => {
              const isPending = gp.status === 'Pending';
              const isApproved = gp.status === 'Approved';
              const isDeparted = gp.status === 'Departed';

              return (
                <motion.div
                  key={gp.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase text-purple-700 bg-purple-100/80 px-3 py-1 rounded-full border border-purple-200/60">
                          {gp.pass_type}
                        </span>
                        <span className="text-xs font-mono font-black text-slate-400">#GP-{gp.id}</span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            gp.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : gp.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                              : gp.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {gp.status}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 mt-1">
                        {gp.student_name} <span className="text-xs font-mono text-slate-500 font-bold">({gp.roll_number})</span> • <span className="text-purple-700 font-bold">{gp.room_number || 'Room B-204'} ({gp.block_name || 'Block A'})</span>
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold pt-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Destination: <strong className="text-slate-900">{gp.destination}</strong></span>
                      </div>
                      <p className="text-xs text-slate-500 italic pl-5">"{gp.reason}"</p>
                    </div>

                    {/* Quick Warden Decision Controls */}
                    <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => openActionModal(gp, 'Approved')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve & Issue QR
                          </button>
                          <button
                            onClick={() => openActionModal(gp, 'Rejected')}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/20 transition flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => openActionModal(gp, 'Departed')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5"
                        >
                          <ArrowRight className="w-4 h-4" /> Mark Departed (Turnstile Gate)
                        </button>
                      )}

                      {isDeparted && (
                        <button
                          onClick={() => openActionModal(gp, 'Returned')}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Mark Safely Returned
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timing & Parent Verification Bar */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Outing Departure</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {new Date(gp.departure_time).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Curfew Expected Return</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {new Date(gp.expected_return).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Parent / Guardian Phone</span>
                      <p className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> {gp.parent_phone || '+91 98124 55210'}
                      </p>
                    </div>
                  </div>

                  {gp.warden_remarks && (
                    <p className="text-xs text-purple-900 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100 font-medium">
                      <strong className="text-purple-950">Warden Verification Note: </strong>
                      {gp.warden_remarks}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={`${actionType} Gate Pass #${selectedPass?.id}`}
        subtitle={`Resident: ${selectedPass?.student_name} (${selectedPass?.roll_number})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleActionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Warden Remarks & Verification Record *
            </label>
            <textarea
              required
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActionModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className={`px-5 py-2.5 text-xs font-black text-white rounded-xl shadow transition ${
                actionType === 'Rejected'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {processing ? 'Submitting...' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
}
