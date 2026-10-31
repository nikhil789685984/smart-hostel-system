import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  DoorOpen, CheckCircle2, AlertTriangle, Search, 
  Building, Bed, Calendar, CreditCard, ShieldCheck, 
  Clock, FileText, Check, X, ShieldAlert, BadgeCheck
} from 'lucide-react';

export default function HostelCheckoutRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
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
      const res = await api.processCheckoutRequest(requestId, { action, remarks });
      setMsg({ type: 'success', text: res.message });
      setTimeout(() => setMsg(null), 5000);
      fetchRequests();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || `Failed to ${action.toLowerCase()} request` });
      setTimeout(() => setMsg(null), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const q = search.toLowerCase();
    const matchesSearch = (
      req.student_name?.toLowerCase().includes(q) ||
      req.roll_number?.toLowerCase().includes(q) ||
      req.room_number?.toLowerCase().includes(q) ||
      req.block_name?.toLowerCase().includes(q)
    );
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && req.status === activeTab;
  });

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;
  const defaulterCount = requests.filter(r => r.status === 'Pending' && r.totalDues > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-10">
      
      {/* 🌌 Premium Header Banner */}
      <div className="relative overflow-hidden p-8 rounded-[2.5rem] shadow-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950 border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 blur-3xl opacity-20 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 blur-3xl opacity-10 rounded-full"></div>

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner bg-slate-800 text-indigo-400">
            <DoorOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Checkout Hub</h1>
            <p className="mt-1 text-slate-400 font-medium flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Room Vacate & No-Dues Clearance Pipeline
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <MetricBadge label="Pending" value={pendingCount} color="amber" />
          <MetricBadge label="Defaulters" value={defaulterCount} color="rose" alert />
          <MetricBadge label="Cleared" value={approvedCount} color="emerald" />
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
          msg.type === 'error' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        }`}>
          {msg.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-slate-200/50 backdrop-blur rounded-[1.2rem] border border-slate-300/50 w-full md:w-auto">
          {['Pending', 'Approved', 'Rejected', 'All'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === tab 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search student, roll no, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-[1.2rem] pl-11 pr-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-300 text-center">
          <BadgeCheck className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-black text-slate-700">No Checkouts Found</h3>
          <p className="text-slate-500 font-medium mt-1">
            {search ? 'Try adjusting your search filters.' : `Queue is empty for ${activeTab} status.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {filteredRequests.map((req) => {
              const isPending = req.status === 'Pending';
              const isBlocked = req.totalDues > 0;

              return (
                <div 
                  key={req.id}
                  className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className={`p-6 border-b flex justify-between items-start ${
                    req.status === 'Approved' ? 'bg-emerald-50/50 border-emerald-100' :
                    req.status === 'Rejected' ? 'bg-rose-50/50 border-rose-100' :
                    'bg-slate-50/50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-100 flex items-center justify-center shadow-sm">
                        <span className="text-lg font-black text-indigo-700 uppercase">{req.student_name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800">{req.student_name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider">{req.roll_number}</span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500"><Building className="w-3 h-3"/> {req.block_name}</span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500"><Bed className="w-3 h-3"/> Room {req.room_number}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      req.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {req.status === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                       req.status === 'Rejected' ? <X className="w-3.5 h-3.5" /> : 
                       <Clock className="w-3.5 h-3.5" />}
                      {req.status}
                    </div>
                  </div>

                  {/* Content Split */}
                  <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                    
                    {/* Left: Info */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Expected Checkout</p>
                        <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          {req.expected_checkout_date}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Reason for Leaving</p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-semibold text-slate-700">
                          "{req.reason}"
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-2">
                        Applied: {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Right: Dues */}
                    <div className="flex flex-col h-full">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Financial Clearance</p>
                      
                      {isBlocked ? (
                        <div className="flex-1 bg-rose-50 border border-rose-200 rounded-[1.5rem] p-4 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-3">
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                            <span className="text-sm font-black text-rose-900">Clearance Blocked</span>
                          </div>
                          
                          <div className="bg-white/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-bold mb-3 border border-rose-100 shadow-sm">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Fees</span>
                              <span className="text-rose-700 text-sm">₹{Number(req.pendingFee).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Fines</span>
                              <span className="text-rose-700 text-sm">₹{Number(req.pendingFines).toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-rose-600 text-center uppercase tracking-wider">
                            Total Dues: ₹{Number(req.totalDues).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2 shadow-sm border border-emerald-200">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          </div>
                          <p className="text-sm font-black text-emerald-900">All Dues Cleared</p>
                          <p className="text-[11px] font-bold text-emerald-700 mt-1">₹0 Outstanding Balance</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  {isPending && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Warden Remarks (e.g. Room key returned)..."
                        value={remarksMap[req.id] || ''}
                        onChange={(e) => handleRemarkChange(req.id, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={processingId === req.id}
                          onClick={() => handleProcess(req.id, 'Reject', req.student_name)}
                          className="px-4 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-black transition-colors flex items-center justify-center"
                          title="Reject Application"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          disabled={processingId === req.id || isBlocked}
                          onClick={() => handleProcess(req.id, 'Approve', req.student_name)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                            isBlocked 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                          }`}
                        >
                          {processingId === req.id ? (
                            <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</span>
                          ) : (
                            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Finalize Checkout</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isPending && req.remarks && (
                     <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                       <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                         <FileText className="w-4 h-4 text-slate-400" />
                         Warden Remarks: <span className="text-slate-800">"{req.remarks}"</span>
                       </p>
                     </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function MetricBadge({ label, value, color, alert }) {
  const styles = {
    amber: 'bg-amber-900/40 text-amber-400 border-amber-700/50',
    rose: 'bg-rose-900/40 text-rose-400 border-rose-700/50',
    emerald: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
  };
  return (
    <div className={`px-4 py-2 rounded-2xl border backdrop-blur-md flex items-center gap-3 ${styles[color]}`}>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{label}</p>
        <p className={`text-xl font-black leading-none mt-0.5 ${alert && value > 0 ? 'animate-pulse' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
