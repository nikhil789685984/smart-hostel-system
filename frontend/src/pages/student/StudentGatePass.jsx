import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import QRCode from 'react-qr-code';
import {
  QrCode,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Plus,
  ArrowRight,
  Download,
  Share2,
  Sparkles,
  Phone,
  Edit3,
  Trash2,
  Check,
  AlertTriangle,
  FileText,
  Building,
  UserCheck
} from 'lucide-react';

const QUICK_PRESETS = [
  {
    type: 'Day Outing',
    title: 'Central Library / Book Depot',
    reason: 'Referencing textbooks and journal papers for academic project thesis.',
    hoursOut: 4
  },
  {
    type: 'Night Out',
    title: 'Weekend Family Residence',
    reason: 'Family gathering and personal commitments over the weekend.',
    hoursOut: 48
  },
  {
    type: 'Emergency Leave',
    title: 'Apollo Diagnostic Clinic',
    reason: 'Scheduled doctor consultation and routine blood testing.',
    hoursOut: 6
  }
];

export default function StudentGatePass() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    pass_type: 'Night Out',
    destination: '',
    reason: '',
    departure_time: '',
    expected_return: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPass, setEditingPass] = useState(null);
  const [editFormData, setEditFormData] = useState({
    pass_type: 'Night Out',
    destination: '',
    reason: '',
    departure_time: '',
    expected_return: '',
  });
  const [updating, setUpdating] = useState(false);

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrPass, setSelectedQrPass] = useState(null);

  const [msg, setMsg] = useState(null);

  const fetchPasses = async () => {
    try {
      const res = await api.getMyGatePasses();
      setPasses(res.passes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const applyPreset = (preset) => {
    const now = new Date();
    const returnTime = new Date(now.getTime() + preset.hoursOut * 60 * 60 * 1000);

    const formatDt = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setFormData({
      pass_type: preset.type,
      destination: preset.title,
      reason: preset.reason,
      departure_time: formatDt(now),
      expected_return: formatDt(returnTime),
    });
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.applyGatePass(formData);
      setMsg('Gate pass application submitted! Status: Pending Warden Verification.');
      setApplyModalOpen(false);
      setFormData({
        pass_type: 'Night Out',
        destination: '',
        reason: '',
        departure_time: '',
        expected_return: '',
      });
      fetchPasses();
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error submitting gate pass');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (gp) => {
    setEditingPass(gp);
    setEditFormData({
      pass_type: gp.pass_type,
      destination: gp.destination,
      reason: gp.reason,
      departure_time: gp.departure_time?.slice(0, 16) || '',
      expected_return: gp.expected_return?.slice(0, 16) || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPass) return;
    setUpdating(true);
    try {
      await api.updateMyGatePass(editingPass.id, editFormData);
      setMsg(`Gate Pass #${editingPass.id} updated and re-submitted to Warden.`);
      setEditModalOpen(false);
      setEditingPass(null);
      fetchPasses();
      setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Error updating gate pass');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelPass = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this gate pass request?')) {
      return;
    }
    try {
      await api.cancelGatePass(id);
      setMsg(`Gate Pass #${id} cancelled and removed.`);
      // Optimistic UI update
      setPasses(prev => prev.filter(p => p.id !== id));
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Error cancelling gate pass');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              Automated Campus Turnstile Security Gate
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Digital Gate Pass & Outing Clearance
          </h1>
          <p className="text-xs text-purple-200/80 mt-1 max-w-xl">
            Apply for outings, edit pending departure schedules, review parental consent verification, and access live turnstile QR tokens.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setApplyModalOpen(true)}
          className="relative z-10 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-purple-500/30 transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Apply for Gate Pass
        </motion.button>
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

      {/* Curfew Rules Notice Bar */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Institutional Curfew Turnstile Protocol
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Hostel turnstiles lock automatically at <strong>09:30 PM sharp</strong>. Only approved QR tokens grant turnstile barrier clearance.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-[11px] font-mono font-bold bg-slate-800 px-3 py-1.5 rounded-xl text-slate-300 border border-slate-700">
            Roll Call: 21:30 - 22:15 IST
          </span>
        </div>
      </div>

      {/* Passes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-bold">Querying residential turnstile ledger...</span>
        </div>
      ) : passes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl p-12 border border-slate-200/90 text-center text-xs text-slate-500 shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-black text-base text-slate-800">No active gate passes found</p>
          <p className="mt-1 text-slate-500 max-w-sm mx-auto">
            Need to leave campus for an outing, coaching, or home visit? Click the button above to register an outing pass.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {passes.map((gp, idx) => {
              const isApproved = gp.status === 'Approved';
              const isPending = gp.status === 'Pending';
              const isRejected = gp.status === 'Rejected';
              const isDeparted = gp.status === 'Departed';

              return (
                <motion.div
                  key={gp.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`bg-white rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md ${
                    isApproved
                      ? 'border-purple-200 bg-gradient-to-br from-white to-purple-50/20'
                      : isPending
                      ? 'border-amber-200 bg-gradient-to-br from-white to-amber-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Perforated Header */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100/80 px-3 py-1 rounded-full border border-purple-200/60">
                        {gp.pass_type}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-400">#GP-{gp.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            : isDeparted
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {gp.status}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                        <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>{gp.destination}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 pl-6 leading-relaxed font-medium">{gp.reason}</p>
                    </div>

                    {/* Departure vs Return Timeline */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Outing Departure</span>
                        <p className="font-black text-slate-800 mt-0.5">
                          {new Date(gp.departure_time).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Curfew Return By</span>
                        <p className="font-black text-slate-800 mt-0.5">
                          {new Date(gp.expected_return).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* QR Code Pass Card for Approved Passes */}
                    {isApproved && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 to-slate-900 text-white flex items-center justify-between gap-4 shadow-md">
                        <div
                          onClick={() => {
                            setSelectedQrPass(gp);
                            setQrModalOpen(true);
                          }}
                          className="w-16 h-16 bg-white p-1.5 rounded-xl flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition shadow"
                        >
                          <QrCode className="w-12 h-12 text-slate-950" />
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" /> Turnstile Gate Token
                          </span>
                          <p className="text-xs font-mono font-black text-white truncate mt-0.5">{gp.qr_token}</p>
                          <p className="text-[10px] text-purple-200 mt-1 font-medium">
                            {gp.warden_remarks || 'Parent confirmation phone verified.'}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedQrPass(gp);
                            setQrModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold shrink-0 transition"
                        >
                          Enlarge
                        </button>
                      </div>
                    )}

                    {isPending && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-semibold">Awaiting Warden telephonic verification call.</span>
                        </div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                        <p className="font-bold">Declined by Chief Warden:</p>
                        <p className="mt-0.5">{gp.warden_remarks || 'Attendance shortage or security restriction.'}</p>
                      </div>
                    )}

                    {/* Action Buttons: EDIT & CANCEL for Pending Passes */}
                    {isPending && (
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => openEditModal(gp)}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Edit Pass Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelPass(gp.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Apply Modal with 1-Click Presets */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Digital Gate Pass"
        subtitle="Turnstile clearance token will be generated once verified by Chief Warden"
        maxWidth="max-w-xl"
      >
        {/* Quick presets */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            ⚡ Quick Viva Outing Presets (1-Click Fill)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {QUICK_PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50/70 hover:bg-purple-50/50 transition text-xs group"
              >
                <div className="font-bold text-slate-800 group-hover:text-purple-700 truncate">{p.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.type} • {p.hoursOut}h</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleApplySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Pass Category
            </label>
            <select
              value={formData.pass_type}
              onChange={(e) => setFormData({ ...formData, pass_type: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option>Day Outing</option>
              <option>Night Out</option>
              <option>Emergency Leave</option>
              <option>Vacation / Semester Break</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Destination City & Address *
            </label>
            <input
              type="text"
              required
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Central Library Campus / Family Residence, Sec-14"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Detailed Reason for Outing *
            </label>
            <textarea
              required
              rows={2}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Completing laboratory experiments / Visiting local guardian..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Departure Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Expected Return By *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.expected_return}
                onChange={(e) => setFormData({ ...formData, expected_return: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-500/25 transition flex items-center gap-1.5"
            >
              {submitting ? 'Transmitting Request...' : 'Submit Gate Pass'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* EDIT Gate Pass Modal (User requested: "edit k option gate paas m") */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Gate Pass #${editingPass?.id}`}
        subtitle="Modify your destination, dates, or leave reason before warden review"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Pass Category
            </label>
            <select
              value={editFormData.pass_type}
              onChange={(e) => setEditFormData({ ...editFormData, pass_type: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option>Day Outing</option>
              <option>Night Out</option>
              <option>Emergency Leave</option>
              <option>Vacation / Semester Break</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Destination City & Address *
            </label>
            <input
              type="text"
              required
              value={editFormData.destination}
              onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Detailed Reason for Outing *
            </label>
            <textarea
              required
              rows={2}
              value={editFormData.reason}
              onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Departure Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={editFormData.departure_time}
                onChange={(e) => setEditFormData({ ...editFormData, departure_time: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Expected Return By *
              </label>
              <input
                type="datetime-local"
                required
                value={editFormData.expected_return}
                onChange={(e) => setEditFormData({ ...editFormData, expected_return: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={updating}
              className="px-5 py-2.5 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-500/25 transition flex items-center gap-1.5"
            >
              {updating ? 'Saving Changes...' : 'Save & Update Gate Pass'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Enlarge Turnstile QR Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Hostel Turnstile QR Gate Token"
        subtitle="Hold in front of the optical laser reader at Main Campus Gate"
        maxWidth="max-w-sm"
      >
        {selectedQrPass && (
          <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-white border-4 border-slate-900 rounded-3xl shadow-xl">
              <QRCode 
                value={JSON.stringify({type: 'GATE', id: selectedQrPass.id})} 
                size={192} 
                style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                viewBox={`0 0 192 192`} 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cryptographic Token</span>
              <p className="font-mono font-black text-base text-purple-700 mt-0.5">{selectedQrPass.qr_token}</p>
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 w-full">
              <div className="flex justify-between py-1">
                <span>Destination:</span>
                <strong className="text-slate-800">{selectedQrPass.destination}</strong>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-200/60">
                <span>Return Curfew:</span>
                <strong className="text-slate-800">
                  {new Date(selectedQrPass.expected_return).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </div>
            </div>
            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
            >
              Close Token View
            </button>
          </div>
        )}
      </Modal>

    </motion.div>
  );
}
