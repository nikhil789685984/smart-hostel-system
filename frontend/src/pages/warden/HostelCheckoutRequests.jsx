import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  UserCheck,
  Building,
  Bed,
  Calendar,
  CreditCard,
  ShieldCheck,
  Clock,
  LogOut,
  FileText,
  Check,
  X,
  Zap,
  RefreshCw
} from 'lucide-react';

export default function HostelCheckoutRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Pending'); // 'All' | 'Pending' | 'Approved' | 'Rejected'
  const [msg, setMsg] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});

  const fetchRequests = async () => {
    try {
      const res = await api.getCheckoutRequests();
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error('Failed to load checkout requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRemarkChange = (id, val) => {
    setRemarksMap(prev => ({ ...prev, [id]: val }));
  };

  const handleProcess = async (requestId, action, studentName) => {
    const remarks = remarksMap[requestId] || (action === 'Approve' ? 'Room inspection clear. All dues verified.' : 'Checkout flagged during warden room inspection.');
    
    if (action === 'Reject' && !window.confirm(`Flag / Reject checkout clearance request for ${studentName}?`)) return;
    if (action === 'Approve' && !window.confirm(`Approve official hostel checkout for ${studentName}?\n\nThis will vacate their assigned room/bed and set status to "Checked Out".`)) return;

    setProcessingId(requestId);
    try {
      const res = await api.processCheckoutRequest(requestId, {
        action,
        remarks
      });

      setMsg(res.message);
      setTimeout(() => setMsg(null), 5000);
      fetchRequests();
    } catch (err) {
      alert(err.message || `Failed to ${action.toLowerCase()} checkout request`);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = (
      req.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      req.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
      req.room_number?.toLowerCase().includes(search.toLowerCase()) ||
      req.block_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && req.status === activeTab;
  });

  // Summary Metrics
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;
  const defaulterCount = requests.filter(r => r.status === 'Pending' && r.totalDues > 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Loading Hostel Clearance Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                Institutional No-Dues & Room Vacate Clearance Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Hostel Checkout Clearance & Approval Hub</h1>
            <p className="text-xs text-indigo-200/80 max-w-2xl font-medium">
              Warden room inspection portal, zero-dues financial verification, bed de-allocation console, and automated exit certificate generation.
            </p>
          </div>

          <button
            onClick={fetchRequests}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-2 self-start md:self-auto backdrop-blur"
          >
            <RefreshCw className="w-4 h-4 text-indigo-300" /> Refresh Requests
          </button>
        </div>
      </div>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-3 shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </motion.div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Inspection</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting Warden Review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Blocked (Pending Dues)</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{defaulterCount}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Financial Clearance Needed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Approved & Vacated</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Official Exit Completed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Flagged / Rejected</span>
            <h3 className="text-2xl font-black text-slate-700 mt-1">{rejectedCount}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Issues Citation Flagged</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <X className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100/80 rounded-2xl">
          {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                activeTab === tab 
                  ? 'bg-white text-indigo-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'Pending' ? `⏳ Pending (${pendingCount})` :
               tab === 'Approved' ? `✅ Approved (${approvedCount})` :
               tab === 'Rejected' ? `🛑 Flagged (${rejectedCount})` : `All (${requests.length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, roll, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-slate-50/50"
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/90 text-center space-y-3">
          <DoorOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-900">No Checkout Requests Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'No requests match your current search query.' : `There are currently no hostel checkout requests under tab "${activeTab}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req) => {
            const isBlocked = req.totalDues > 0;
            const isPending = req.status === 'Pending';
            const isApproved = req.status === 'Approved';
            const isRejected = req.status === 'Rejected';

            return (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl border-2 p-6 shadow-sm space-y-5 transition-all ${
                  isPending ? (isBlocked ? 'border-rose-200 bg-gradient-to-r from-white via-rose-50/20 to-white' : 'border-amber-200 bg-gradient-to-r from-white via-amber-50/20 to-white') :
                  isApproved ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 to-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                      {req.student_name?.[0] || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">{req.student_name}</h3>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {req.roll_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {req.branch} • Year {req.year} • Phone: <strong className="text-slate-800">{req.phone || 'N/A'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                      <Bed className="w-3.5 h-3.5 text-indigo-600" />
                      {req.room_number ? `${req.block_name || 'Block A'} • Room ${req.room_number} (${req.bed_number || 'Bed'})` : 'Unassigned Bed'}
                    </span>

                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      isRejected ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {req.status === 'Pending' ? '⏳ Pending Review' : req.status}
                    </span>
                  </div>
                </div>

                {/* Request Details & Financial Status Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  
                  {/* Left: Request Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Checkout Date</span>
                      <span className="font-bold font-mono text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                        📅 {req.expected_checkout_date}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Reason for Leaving</span>
                      <p className="font-bold text-slate-800 mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                        "{req.reason}"
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400 font-semibold pt-1">
                      Application Submitted: {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Right: Dues Status Box */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                    isBlocked 
                      ? 'bg-rose-50/80 border-rose-300 text-rose-950' 
                      : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Financial Ledger Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isBlocked ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {isBlocked ? '🛑 Dues Pending' : '✅ 0 Dues Cleared'}
                      </span>
                    </div>

                    {isBlocked ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-white/90 rounded-xl border border-rose-200 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Fees</span>
                            <span className="font-mono font-black text-rose-700">₹{Number(req.pendingFee).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Unpaid Fines</span>
                            <span className="font-mono font-black text-rose-700">₹{Number(req.pendingFines).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Total Dues: <strong>₹{Number(req.totalDues).toLocaleString()}</strong>. Checkout approval is blocked until settled.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 space-y-1">
                        <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All Dues Cleared (₹0 Outstanding Balance)
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Student has settled all semester fees and fines. Eligible for room inspection clearance.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Remarks & Warden Action Footer */}
                {isPending && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Warden Room Inspection Remarks / Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Room key returned, electricity meter cleared, furniture intact..."
                        value={remarksMap[req.id] || ''}
                        onChange={(e) => handleRemarkChange(req.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleProcess(req.id, 'Reject', req.student_name)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4 text-rose-600" /> Flag / Reject Application
                      </button>

                      <motion.button
                        whileHover={{ scale: isBlocked ? 1 : 1.02 }}
                        whileTap={{ scale: isBlocked ? 1 : 0.98 }}
                        disabled={processingId === req.id || isBlocked}
                        onClick={() => handleProcess(req.id, 'Approve', req.student_name)}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                          isBlocked 
                            ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                        }`}
                      >
                        {processingId === req.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing Approval...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Approve & Finalize Checkout
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Completed Remarks Footer (If Approved or Rejected) */}
                {!isPending && req.remarks && (
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Warden Remarks: <strong>"{req.remarks}"</strong></span>
                  </div>
                )}

              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}
