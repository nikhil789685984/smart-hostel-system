import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Package, Lock, Unlock, Clock, MapPin, QrCode, CheckCircle2, Copy } from 'lucide-react';

export default function StudentParcels() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealOtp, setRevealOtp] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.getMyParcels();
      if (res.success) setParcels(res.parcels);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOtp = (id) => {
    setRevealOtp(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Checking Mailroom...</div>;

  const pending = parcels.filter(p => p.status === 'Awaiting_Collection');
  const collected = parcels.filter(p => p.status === 'Collected');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 font-sans">
      
      {/* 📦 Hero Header */}
      <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-indigo-950 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 blur-[100px] opacity-20 rounded-full"></div>
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner text-indigo-300">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">My Parcels</h1>
            <p className="mt-1 text-indigo-200 font-medium text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Collect your deliveries from the Hostel Gate
            </p>
          </div>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-black text-slate-700">All Caught Up!</h2>
          <p className="text-slate-500 font-medium mt-1">You have no pending parcels at the mailroom.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Awaiting Your Pickup
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pending.map(p => (
              <div key={p.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative group transition-transform hover:-translate-y-1">
                {/* Barcode top aesthetic */}
                <div className="h-3 w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjQiIGZpbGw9IiNjYmQ1ZTEiLz48L3N2Zz4=')] opacity-50"></div>
                
                <div className="p-6 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-md animate-pulse">
                      Ready at Gate
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(p.received_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-xl font-black text-slate-700 uppercase">{p.courier.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{p.courier} Delivery</h3>
                      <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Hostel Main Gate
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 mb-2 border-t border-dashed border-slate-200 relative">
                    <div className="absolute -left-8 -top-3 w-6 h-6 bg-slate-50 rounded-full border-r border-slate-200"></div>
                    <div className="absolute -right-8 -top-3 w-6 h-6 bg-slate-50 rounded-full border-l border-slate-200"></div>
                  </div>
                </div>

                {/* Secure OTP Section */}
                <div className="p-6 bg-slate-50 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Collection OTP</p>
                  
                  {revealOtp[p.id] ? (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                      <div className="flex gap-1.5 mb-2">
                        {p.otp.split('').map((char, i) => (
                          <div key={i} className="w-10 h-12 bg-white border-2 border-indigo-500 rounded-xl flex items-center justify-center text-2xl font-black text-indigo-700 shadow-md shadow-indigo-500/20">
                            {char}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Show this code to the guard
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => toggleOtp(p.id)}
                      className="group/btn relative px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl transition-all overflow-hidden flex items-center gap-2"
                    >
                      <div className="flex gap-1 blur-sm group-hover/btn:blur-md transition-all">
                        <span className="text-2xl font-black text-slate-500">X</span>
                        <span className="text-2xl font-black text-slate-500">X</span>
                        <span className="text-2xl font-black text-slate-500">X</span>
                        <span className="text-2xl font-black text-slate-500">X</span>
                        <span className="text-2xl font-black text-slate-500">X</span>
                        <span className="text-2xl font-black text-slate-500">X</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                        <Lock className="w-4 h-4 mr-2" /> Tap to Reveal
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {collected.length > 0 && (
        <div className="pt-8 space-y-4">
          <h2 className="text-lg font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Past Deliveries
          </h2>
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            {collected.map((p, idx) => (
              <div key={p.id} className={`p-4 flex items-center justify-between ${idx !== 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500">
                    {p.courier.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{p.courier}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tracking: {p.tracking_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-md">Collected</span>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(p.collected_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
