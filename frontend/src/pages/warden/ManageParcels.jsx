import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, Search, KeyRound, Truck, CheckCircle2, User, Building, 
  SearchX, ScanBarcode, Send, X, History, ShieldCheck, Filter, 
  Clock, ChevronLeft, ChevronRight, Hash, ArrowUpDown, Calendar, Check
} from 'lucide-react';

export default function ManageParcels() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [parcels, setParcels] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Parcel Form
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [receiving, setReceiving] = useState(false);

  // OTP Verification
  const [verifyId, setVerifyId] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);

  // Admin History Search & Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [historyCourierFilter, setHistoryCourierFilter] = useState('ALL');
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [parcelRes, stdRes] = await Promise.all([
        api.getAllParcels(),
        api.getAdminStudents()
      ]);
      if (parcelRes.success) setParcels(parcelRes.parcels);
      if (stdRes.success) setStudents(stdRes.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    if (!studentId || !courier) return alert("Select student and courier");
    setReceiving(true);
    try {
      await api.receiveParcel({ student_id: studentId, courier, tracking_number: trackingNumber });
      setStudentId(''); setStudentSearch(''); setCourier(''); setTrackingNumber('');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setReceiving(false);
    }
  };

  const handleVerify = async (id) => {
    const code = otp.join('');
    if (code.length !== 6) return alert("Enter full 6-digit OTP");
    setVerifying(true);
    try {
      const res = await api.verifyAndCollectParcel(id, code);
      alert(res.message);
      setVerifyId(null);
      setOtp(['', '', '', '', '', '']);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Group pending vs historical collected parcels
  const pending = parcels.filter(p => p.status === 'Awaiting_Collection' || p.status === 'Pending');
  const collected = parcels.filter(p => p.status === 'Collected' || p.status === 'Delivered');

  // Filter students for the dropdown
  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.roll_number?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.room_number && s.room_number.toString().toLowerCase().includes(studentSearch.toLowerCase()))
  );

  // Admin History Search & Courier Filter
  const filteredHistory = useMemo(() => {
    return collected.filter(p => {
      const q = historySearch.toLowerCase().trim();
      const matchesSearch = !q || (
        (p.student_name && p.student_name.toLowerCase().includes(q)) ||
        (p.roll_number && p.roll_number.toLowerCase().includes(q)) ||
        (p.courier && p.courier.toLowerCase().includes(q)) ||
        (p.tracking_number && p.tracking_number.toLowerCase().includes(q)) ||
        (p.room_number && p.room_number.toString().toLowerCase().includes(q)) ||
        (p.block_name && p.block_name.toLowerCase().includes(q)) ||
        (p.collected_at && new Date(p.collected_at).toLocaleDateString().toLowerCase().includes(q))
      );

      const matchesCourier = historyCourierFilter === 'ALL' || 
        (p.courier && p.courier.toLowerCase() === historyCourierFilter.toLowerCase());

      return matchesSearch && matchesCourier;
    });
  }, [collected, historySearch, historyCourierFilter]);

  // Pagination for history
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, historyPage]);

  // Reset page on search change
  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, historyCourierFilter]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading Mailroom Data...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 font-sans">
      
      {/* 📦 Hero Header */}
      <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-indigo-950 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 blur-[100px] opacity-20 rounded-full"></div>
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner text-indigo-300">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Smart Mailroom</h1>
              {isAdmin ? (
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/20 border border-purple-400/30 text-purple-200">
                  Admin Authority
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 border border-blue-400/30 text-blue-200">
                  Warden Desk
                </span>
              )}
            </div>
            <p className="mt-1 text-indigo-200 font-medium text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Secure OTP-Based Parcel Handover & Real-Time Tracking
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Awaiting Pickup</p>
            <p className="text-3xl font-black text-white leading-none mt-1">{pending.length}</p>
          </div>
          
          {isAdmin && (
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-300" /> Total History
              </p>
              <p className="text-3xl font-black text-white leading-none mt-1">{collected.length}</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Log New Parcel & Pending Parcels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Log New Parcel */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 lg:p-8 h-fit">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-6">
            <ScanBarcode className="w-6 h-6 text-indigo-600" /> Log Incoming Parcel
          </h2>
          
          <form onSubmit={handleReceive} className="space-y-5">
            
            {/* Smart Searchable Dropdown */}
            <div className="relative">
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Student Search</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Type Name, Roll, or Room #..."
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    setStudentId('');
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className={`w-full bg-slate-50 border text-sm font-bold rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    studentId ? 'border-emerald-300 text-emerald-800 bg-emerald-50/30' : 'border-slate-200 text-slate-800'
                  }`}
                />
                
                {studentId && (
                  <button type="button" onClick={() => { setStudentId(''); setStudentSearch(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {showDropdown && !studentId && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-xs font-bold text-slate-400 text-center">No student found</div>
                    ) : (
                      filteredStudents.map(s => (
                        <div 
                          key={s.id} 
                          onClick={() => {
                            setStudentId(s.id);
                            setStudentSearch(`${s.name} (${s.roll_number})`);
                            setShowDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                        >
                          <p className="text-[13px] font-black text-slate-800">{s.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase flex gap-2 mt-0.5">
                             <span>Roll: {s.roll_number}</span>
                             {s.room_number ? <span className="text-indigo-500 bg-indigo-50 px-1.5 rounded">Room: {s.room_number}</span> : <span className="text-slate-400">No Room</span>}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Courier / App</label>
              <select 
                value={courier} onChange={e => setCourier(e.target.value)} required
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Provider...</option>
                {['Amazon', 'Flipkart', 'Myntra', 'Blinkit', 'Zomato', 'Swiggy', 'BlueDart', 'Delhivery', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Tracking / AWB # (Optional)</label>
              <input 
                type="text" placeholder="e.g. FMP123456789"
                value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
              </input>
            </div>

            <button 
              type="submit" disabled={receiving || !studentId}
              className={`w-full font-black text-sm py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                studentId 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {receiving ? 'Logging...' : <><Send className="w-5 h-5"/> Notify Student & Generate OTP</>}
            </button>
          </form>
        </div>

        {/* Right: Pending Awaiting Collection Parcels */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-500" /> Awaiting Collection
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">{pending.length} Active</span>
            </h2>
          </div>
          
          {pending.length === 0 ? (
            <div className="bg-slate-50 rounded-[2rem] border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold">Mailroom is empty.</p>
              <p className="text-xs text-slate-400 mt-1">No pending parcels awaiting student collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {pending.map(p => (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative hover:border-indigo-200 transition-all">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full"></div>
                  
                  <div className="p-5 flex-1 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-md">Pending</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(p.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    <h3 className="font-black text-slate-800 text-lg">{p.student_name}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Roll: {p.roll_number}</p>
                    
                    {p.room_number && (
                      <p className="text-[11px] font-extrabold text-indigo-600 mt-1 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" /> {p.block_name ? `${p.block_name} • Room ${p.room_number}` : `Room ${p.room_number}`}
                      </p>
                    )}

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-xs font-black text-slate-700 uppercase shadow-sm">
                        {p.courier.substring(0,2)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700">{p.courier}</p>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider">#{p.tracking_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {verifyId === p.id ? (
                    <div className="p-4 bg-indigo-50 border-t border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2 text-center">Ask student for 6-Digit OTP</p>
                      <div className="flex items-center justify-center gap-1.5 mb-3">
                        {otp.map((d, i) => (
                          <input key={i} id={`otp-${i}`} type="text" maxLength="1" value={d} onChange={e => handleOtpChange(i, e.target.value)} className="w-8 h-10 text-center font-black text-lg bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {setVerifyId(null); setOtp(['','','','','','']);}} className="flex-1 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200">Cancel</button>
                        <button onClick={() => handleVerify(p.id)} disabled={verifying} className="flex-1 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg shadow-md shadow-indigo-500/30 hover:bg-indigo-700">{verifying ? '...' : 'Verify'}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <button onClick={() => setVerifyId(p.id)} className="w-full py-3 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-black tracking-wide transition-colors flex items-center justify-center gap-2">
                        <KeyRound className="w-4 h-4" /> Verify OTP & Handover
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🔐 Admin-Only Parcel Handover History with Real-Time Search */}
      {isAdmin && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-xl overflow-hidden mt-8 transition-all">
          
          {/* Header & Controls Bar */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-black text-white tracking-tight">Parcel Handover History</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Admin Exclusive
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                    Complete audit trail of all student parcel collections & OTP verifications
                  </p>
                </div>
              </div>

              {/* Total Count Badge */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-white">
                  Total Dispatched: <span className="font-black text-emerald-400 text-sm ml-1">{collected.length}</span>
                </div>
              </div>
            </div>

            {/* 🔍 Search Input & Courier Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              
              {/* Search Field */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search historical parcels by Student, Roll #, Room, Courier, Tracking #..."
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-400 text-sm font-semibold rounded-xl pl-11 pr-10 py-3 border border-white/20 focus:border-indigo-400 focus:outline-none transition-all shadow-inner"
                />
                {historySearch && (
                  <button 
                    onClick={() => setHistorySearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Courier Provider Filter */}
              <div className="relative">
                <select
                  value={historyCourierFilter}
                  onChange={e => setHistoryCourierFilter(e.target.value)}
                  className="w-full bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-xl px-4 py-3 border border-white/20 focus:outline-none focus:border-indigo-400 transition-all cursor-pointer"
                >
                  <option value="ALL" className="text-slate-800">All Providers ({collected.length})</option>
                  {['Amazon', 'Flipkart', 'Myntra', 'Blinkit', 'Zomato', 'Swiggy', 'BlueDart', 'Delhivery', 'Other'].map(c => {
                    const count = collected.filter(p => p.courier?.toLowerCase() === c.toLowerCase()).length;
                    return (
                      <option key={c} value={c} className="text-slate-800">
                        {c} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary & Quick Pills */}
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-500">
              Showing <span className="font-black text-slate-800">{filteredHistory.length}</span> of {collected.length} total records
              {historySearch && <span className="text-indigo-600 font-extrabold ml-1">matching "{historySearch}"</span>}
            </span>

            {historySearch && (
              <button 
                onClick={() => setHistorySearch('')}
                className="text-xs font-black text-rose-600 hover:underline flex items-center gap-1"
              >
                Clear Search <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* History Data Table */}
          {filteredHistory.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <SearchX className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-base font-black text-slate-700">No handover history found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                No collected parcel records matched your search query or courier filter.
              </p>
              {historySearch && (
                <button 
                  onClick={() => { setHistorySearch(''); setHistoryCourierFilter('ALL'); }}
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Student Details</th>
                    <th className="py-4 px-6">Room / Hostel</th>
                    <th className="py-4 px-6">Courier & Tracking</th>
                    <th className="py-4 px-6">Received At</th>
                    <th className="py-4 px-6">Handed Over At</th>
                    <th className="py-4 px-6 text-center">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedHistory.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Student Details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-700">
                            {p.student_name ? p.student_name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 leading-tight">{p.student_name || 'Student'}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Roll: {p.roll_number || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Room & Block */}
                      <td className="py-4 px-6">
                        {p.room_number ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-black text-xs text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2.5 py-1 rounded-lg">
                              <Building className="w-3 h-3 text-indigo-500" />
                              Room {p.room_number}
                            </span>
                            {p.block_name && (
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate max-w-[150px]">
                                {p.block_name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">—</span>
                        )}
                      </td>

                      {/* Courier & Tracking */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-black border border-slate-200">
                            {p.courier}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            #{p.tracking_number || 'TRK-Direct'}
                          </span>
                        </div>
                      </td>

                      {/* Received Date */}
                      <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(p.received_at).toLocaleDateString()}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{new Date(p.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Collected Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{p.collected_at ? new Date(p.collected_at).toLocaleDateString() : new Date(p.received_at).toLocaleDateString()}</span>
                          <span className="text-emerald-600/70 font-mono text-[11px]">
                            {p.collected_at ? new Date(p.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </td>

                      {/* Status & OTP Badge */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-black uppercase tracking-wider">
                            <Check className="w-3 h-3 stroke-[3]" /> Handed Over
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">
                            Verified by OTP
                          </span>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredHistory.length > itemsPerPage && (
            <div className="p-4 md:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Page <span className="font-black text-slate-800">{historyPage}</span> of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  disabled={historyPage === totalPages}
                  onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
