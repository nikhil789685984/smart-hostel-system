import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Package, Search, KeyRound, Truck, CheckCircle2, User, Building, SearchX, ScanBarcode, Send, X } from 'lucide-react';

export default function ManageParcels() {
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

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading Mailroom Data...</div>;

  const pending = parcels.filter(p => p.status === 'Awaiting_Collection');
  const collected = parcels.filter(p => p.status === 'Collected');

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.roll_number?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.room_number && s.room_number.toString().toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-sans">
      
      {/* 📦 Hero Header */}
      <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-indigo-950 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 blur-[100px] opacity-20 rounded-full"></div>
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner text-indigo-300">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Smart Mailroom</h1>
            <p className="mt-1 text-indigo-200 font-medium text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Secure OTP-Based Parcel Handover System
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Awaiting Pickup</p>
            <p className="text-3xl font-black text-white leading-none mt-1">{pending.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Handed Over</p>
            <p className="text-3xl font-black text-white leading-none mt-1">{collected.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Log New Parcel */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 lg:p-8 h-fit">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-6">
            <ScanBarcode className="w-6 h-6 text-indigo-600" /> Log Incoming Parcel
          </h2>
          
          <form onSubmit={handleReceive} className="space-y-5">
            
            {/* 🚀 New Smart Searchable Dropdown */}
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
                    setStudentId(''); // reset ID when typing manually
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className={`w-full bg-slate-50 border text-sm font-bold rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    studentId ? 'border-emerald-300 text-emerald-800 bg-emerald-50/30' : 'border-slate-200 text-slate-800'
                  }`}
                />
                
                {/* Clear button if student is selected */}
                {studentId && (
                  <button type="button" onClick={() => { setStudentId(''); setStudentSearch(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Dropdown Menu */}
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
              />
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

        {/* Right: Pending & Handed Over Parcels */}
        <div className="lg:col-span-2 space-y-6">
          
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" /> Awaiting Collection
          </h2>
          
          {pending.length === 0 ? (
            <div className="bg-slate-50 rounded-[2rem] border border-dashed border-slate-300 p-10 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-bold">Mailroom is empty. No pending parcels.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map(p => (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full"></div>
                  
                  <div className="p-5 flex-1 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-md">Pending</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(p.received_at).toLocaleTimeString()}</span>
                    </div>
                    
                    <h3 className="font-black text-slate-800 text-lg">{p.student_name}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Roll: {p.roll_number}</p>
                    
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

          {collected.length > 0 && (
            <div className="pt-8">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" /> Recently Handed Over
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Student</th>
                      <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Courier</th>
                      <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Collected At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collected.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td className="py-3 px-6 text-sm font-bold text-slate-800">{p.student_name}</td>
                        <td className="py-3 px-6 text-sm font-bold text-slate-600">{p.courier}</td>
                        <td className="py-3 px-6 text-xs font-bold text-emerald-600">{new Date(p.collected_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
