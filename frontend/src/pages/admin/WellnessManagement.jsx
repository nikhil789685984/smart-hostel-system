import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Send,
  X,
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function WellnessManagement() {
  const { user } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, severe: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [inspectModal, setInspectModal] = useState(null); // screening record
  const [approvalModal, setApprovalModal] = useState(null); // screening record
  const [approving, setApproving] = useState(false);
  const [emailLogsModal, setEmailLogsModal] = useState(false);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [toast, setToast] = useState(null);

  // Approval form state
  const [approvalForm, setApprovalForm] = useState({
    session_time: '',
    counselor_name: user?.name || 'Chief Counselor Nikhil Sheoran',
    session_venue: 'Campus Wellness Centre (Room 102) / Telephonic Session',
    admin_notes: 'We have reviewed your assessment. Take a deep breath—we are here to support you in every way possible.'
  });

  useEffect(() => {
    fetchScreenings();
  }, [statusFilter, severityFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchScreenings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (severityFilter !== 'All') params.severity = severityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getAdminWellnessScreenings(params);
      if (res.success) {
        setScreenings(res.screenings || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load screenings:', err);
      showToast('Error loading mental wellness reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchScreenings();
  };

  const openApproval = (item) => {
    setApprovalForm({
      session_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      }),
      counselor_name: user?.name || 'Chief Counselor Nikhil Sheoran',
      session_venue: item.preferred_mode === 'Video Call' ? 'Google Meet / Video Call Link' : 'Campus Wellness Centre (Room 102, Admin Wing)',
      admin_notes: 'We received your depression screening report. You are valued and not alone. Looking forward to speaking with you.'
    });
    setApprovalModal(item);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approvalModal) return;

    try {
      setApproving(true);
      const res = await api.approveWellnessSession(approvalModal.id, approvalForm);
      if (res.success) {
        showToast(`Session approved! Notification email sent to ${approvalModal.email}.`, 'success');
        setApprovalModal(null);
        fetchScreenings();
      } else {
        showToast(res.message || 'Approval failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to approve session.', 'error');
    } finally {
      setApproving(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      setLoadingLogs(true);
      setEmailLogsModal(true);
      const res = await api.getEmailAuditLogs();
      if (res.success) {
        setEmailLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Severe':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">Severe (Critical)</span>;
      case 'Moderately Severe':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-600 text-white">Moderately Severe</span>;
      case 'Moderate':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">Moderate</span>;
      case 'Mild':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-200">Mild</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">Minimal</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-teal-300 text-xs font-black uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
            Student Psychological Support & Counselor Oversight Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Depression Screening & Counseling Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
            Review incoming student clinical test reports. Submissions automatically notify <strong>nikhilsheoran093@gmail.com</strong>. Approving a request instantly dispatches a confirmed counseling schedule to the student's email.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={loadEmailLogs}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer backdrop-blur"
          >
            <Mail className="w-4 h-4 text-teal-300" />
            Email Dispatch Logs
          </button>
          <button
            onClick={fetchScreenings}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Reports
          </button>
        </div>
      </div>

      {/* 4 Telemetry Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Assessments</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{summary.total}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Campus submissions</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            📊
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Severe / High Risk</p>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{summary.severe}</h3>
            <p className="text-[11px] text-rose-500 font-semibold mt-0.5">Priority Care Advised</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            🚨
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Pending Review</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{summary.pending}</h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Awaiting session setup</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            ⏳
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Approved & Scheduled</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{summary.approved}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Students supported</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ✅
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['All', 'Pending', 'Approved'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Severity Filter & Search Form */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="All">All Severity Levels</option>
            <option value="Severe">Severe (20-27)</option>
            <option value="Moderately Severe">Moderately Severe (15-19)</option>
            <option value="Moderate">Moderate (10-14)</option>
            <option value="Mild">Mild (5-9)</option>
            <option value="Minimal">Minimal (0-4)</option>
          </select>

          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 sm:flex-initial">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student, email, roll..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-60"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Screenings Table / Card List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
            Loading student mental health reports...
          </div>
        ) : screenings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Heart className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Assessment Reports Found</p>
            <p className="text-xs text-slate-400">No student screenings match your current filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-4">Student Resident</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">PHQ-9 Score</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Counseling</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {screenings.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Student Name */}
                    <td className="p-4">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{item.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.roll_number || 'N/A'}</p>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="text-slate-800 font-bold">{item.email}</p>
                        {item.phone && <p className="text-slate-500 font-mono text-[11px]">{item.phone}</p>}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      <p className="text-slate-700">{item.block_name || 'Resident Block'}</p>
                      <p className="text-slate-500 text-[11px]">Room: {item.room_number || 'N/A'}</p>
                    </td>

                    {/* Score */}
                    <td className="p-4 font-black">
                      <span className="text-base text-slate-900 font-mono">{item.total_score}</span>
                      <span className="text-slate-400 text-[10px]"> / 27</span>
                    </td>

                    {/* Severity Badge */}
                    <td className="p-4">
                      {getSeverityBadge(item.severity)}
                    </td>

                    {/* Counseling Mode */}
                    <td className="p-4">
                      {item.counseling_requested ? (
                        <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {item.preferred_mode || 'In-Person'}
                        </span>
                      ) : (
                        <span className="text-slate-400">Self-Check Only</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {item.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending Review
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                          title="Inspect Responses"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>

                        {item.status !== 'Approved' ? (
                          <button
                            onClick={() => openApproval(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-sm transition cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve & Schedule
                          </button>
                        ) : (
                          <button
                            onClick={() => openApproval(item)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition cursor-pointer"
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: INSPECT CLINICAL RESPONSES */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  Detailed Clinical Response Sheet
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {inspectModal.name} ({inspectModal.roll_number || 'N/A'})
                </h3>
                <p className="text-xs text-slate-500">
                  Submitted: {new Date(inspectModal.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
              <button
                onClick={() => setInspectModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Severity summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Total PHQ-9 Score</p>
                <p className="text-2xl font-black text-slate-900">{inspectModal.total_score} <span className="text-xs font-normal text-slate-400">/ 27</span></p>
              </div>
              <div>{getSeverityBadge(inspectModal.severity)}</div>
            </div>

            {/* Student personal note */}
            {inspectModal.notes && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-black uppercase tracking-wider text-[10px] text-amber-700">Student's Personal Note:</p>
                <p className="italic leading-relaxed whitespace-pre-wrap">"{inspectModal.notes}"</p>
              </div>
            )}

            {/* 9 Question Responses */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Itemized Responses (0 to 3 scale)</h4>
              <div className="space-y-1.5 text-xs">
                {(inspectModal.answers || []).map((ans, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-400 font-mono">Q{i + 1}.</span>
                      <span className="text-slate-800">{ans.question}</span>
                    </div>
                    <span className={`font-black shrink-0 px-2 py-0.5 rounded ${ans.score >= 2 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                      {ans.score} pt ({ans.label})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              {inspectModal.status !== 'Approved' && (
                <button
                  onClick={() => {
                    const rec = inspectModal;
                    setInspectModal(null);
                    openApproval(rec);
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer shadow-sm"
                >
                  Approve Counseling
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVE & SCHEDULE COUNSELING SESSION */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Counseling Approval & Automated Email Dispatch
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Schedule Session for {approvalModal.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Target Student Email: <strong className="text-teal-700">{approvalModal.email}</strong>
                </p>
              </div>
              <button
                onClick={() => setApprovalModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Appointment Date & Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 18 Oct 2026 at 4:30 PM"
                  value={approvalForm.session_time}
                  onChange={e => setApprovalForm({ ...approvalForm, session_time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Counselor *</label>
                  <input
                    type="text"
                    required
                    value={approvalForm.counselor_name}
                    onChange={e => setApprovalForm({ ...approvalForm, counselor_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Session Mode / Venue *</label>
                  <input
                    type="text"
                    required
                    value={approvalForm.session_venue}
                    onChange={e => setApprovalForm({ ...approvalForm, session_venue: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Personal Supportive Message (Included in Email) *</label>
                <textarea
                  rows={3}
                  required
                  value={approvalForm.admin_notes}
                  onChange={e => setApprovalForm({ ...approvalForm, admin_notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 leading-relaxed">
                ℹ️ Clicking <strong>Approve & Dispatch Email</strong> will immediately mark the status as Approved and send the formal appointment confirmation with 24x7 crisis helplines to <strong>{approvalModal.email}</strong>.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovalModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approving}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {approving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Dispatching Email...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Approve & Dispatch Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EMAIL AUDIT LOGS */}
      {emailLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-4 border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Outgoing Email Dispatch Audit Trail</h3>
                <p className="text-xs text-slate-500">All notifications sent to nikhilsheoran093@gmail.com & students</p>
              </div>
              <button
                onClick={() => setEmailLogsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingLogs ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading email records...</div>
            ) : emailLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No email dispatches recorded yet.</div>
            ) : (
              <div className="space-y-2 text-xs">
                {emailLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">{log.recipient}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                    </div>
                    <p className="font-bold text-teal-800">{log.subject}</p>
                    <p className="text-slate-500 text-[11px] line-clamp-2">{log.body_preview}</p>
                    <p className="text-[10px] text-slate-400 font-mono pt-1">
                      {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
