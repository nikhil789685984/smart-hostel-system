import React, { useState } from 'react';
import { Navigation, Phone, User, CheckCircle2, ChevronRight, Zap, MapPin, Star, AlertCircle, CircleDashed, Briefcase, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function StudentRickshaw() {
  const [bookingState, setBookingState] = useState('idle');
  const [pickup, setPickup] = useState('Boys Hostel (Block B)');
  const [drop, setDrop] = useState('Main Campus Gate');
  const [luggage, setLuggage] = useState('No Luggage');
  const [reason, setReason] = useState('Regular Commute');
  const [customReason, setCustomReason] = useState('');
  const [driver, setDriver] = useState(null);

  const [fleet, setFleet] = useState(
    Array.from({ length: 15 }).map((_, i) => ({
      id: i + 1,
      number: `AUTO-${1040 + i}`,
      status: i < 6 ? 'Currently Not Available' : i === 12 ? 'Maintenance' : 'Available',
    }))
  );

  const locations = [
    'Boys Hostel (Block A)', 'Boys Hostel (Block B)', 'Boys Hostel (Block C)', 'Boys Hostel (Block D)',
    'Girls Hostel (Block A)', 'Girls Hostel (Block B)'
  ];

  const reasons = [
    'Regular Commute', 'Carrying Heavy Luggage', 'Medical Emergency 🚑', 'Late For Exam ⏰', 'Other (Type custom)'
  ];

  const isHighPriority = reason.includes('Emergency') || reason.includes('Heavy Luggage') || luggage === 'Heavy Luggage' || reason === 'Other (Type custom)';
  const displayReason = reason === 'Other (Type custom)' ? (customReason || 'Custom Emergency') : reason;

  const availableCount = fleet.filter(f => f.status === 'Available').length;

  const handleBook = () => {
    if (bookingState !== 'idle' || availableCount === 0) return;
    setBookingState('confirming');
  };

  const handleConfirm = () => {
    const availableRik = fleet.find(f => f.status === 'Available');
    if (!availableRik) return;
    
    setFleet(prev => prev.map(f => f.id === availableRik.id ? { ...f, status: 'Currently Not Available' } : f));
    
    setDriver({
      name: 'Ramesh Kumar',
      rating: 4.9,
      vehicle: availableRik.number,
      eta: isHighPriority ? '1 min (Priority Routed)' : '3 mins',
      trips: 1240
    });
    
    setBookingState('matched');
  };

  const handleCancel = () => {
    setBookingState('idle');
    if(driver) {
      setFleet(prev => prev.map(f => f.number === driver.vehicle ? { ...f, status: 'Available' } : f));
      setDriver(null);
    }
  };

  return (
    <div className="relative h-[85vh] w-full rounded-[2.5rem] overflow-y-auto overflow-x-hidden custom-scrollbar bg-black flex flex-col justify-end shadow-2xl border border-white/10">
      
      <div className="absolute inset-0 z-0 fixed pointer-events-none">
        <img 
          src="/rickshaw_fleet.jpg" 
          alt="3D Rickshaw Fleet" 
          className="w-full h-full object-cover opacity-80 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
      </div>

      <div className="relative z-20 mt-8 ml-8">
        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter drop-shadow-2xl flex items-center gap-3">
          Apex Campus Rides <Zap className="w-10 h-10 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-cyan-100 font-bold mt-2 text-sm drop-shadow-md">Premium Electric Fleet Booking</p>
      </div>

      <div className="relative lg:absolute top-8 right-8 z-20 w-[90%] mx-auto lg:mx-0 lg:w-60 max-h-[45vh] flex flex-col mt-4 lg:mt-0">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-white font-black text-base">Fleet Status</p>
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider">{availableCount} / 15 Autos Free</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <CircleDashed className="w-5 h-5 text-cyan-400 animate-spin-slow" />
            </div>
          </div>
          
          <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
            {fleet.map((auto) => (
              <div key={auto.id} className="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition">
                <span className="font-black text-white text-xs">{auto.number}</span>
                {auto.status === 'Available' ? (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Available
                  </span>
                ) : auto.status === 'Maintenance' ? (
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Repair
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                    Not Available
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-30 px-8 pb-8 mt-10 lg:pt-40 w-full flex justify-start">
        
        {bookingState === 'idle' && (
          <div className="w-full max-w-5xl bg-black/50 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-5 lg:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 bg-white/5 border border-white/10 rounded-[2rem] p-2 w-full">
                
                <div className="px-4 py-3 w-full">
                  <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Pickup Point
                  </p>
                  <select 
                    className="w-full bg-transparent text-xs lg:text-sm font-black text-white focus:outline-none appearance-none cursor-pointer"
                    value={pickup}
                    onChange={e => setPickup(e.target.value)}
                  >
                    {locations.map(loc => <option key={loc} className="bg-slate-900 text-white">{loc}</option>)}
                  </select>
                </div>

                <div className="px-4 py-3 w-full border-t md:border-t-0 md:border-l border-white/10">
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Navigation className="w-4 h-4" /> Drop Destination
                  </p>
                  <select 
                    className="w-full bg-transparent text-xs lg:text-sm font-black text-white focus:outline-none appearance-none cursor-pointer"
                    value={drop}
                    onChange={e => setDrop(e.target.value)}
                  >
                    <option className="bg-slate-900 text-white">Main Campus Gate</option>
                  </select>
                </div>

                <div className="px-4 py-3 w-full border-t lg:border-t-0 lg:border-l border-white/10">
                  <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Luggage
                  </p>
                  <select 
                    className="w-full bg-transparent text-xs lg:text-sm font-black text-white focus:outline-none appearance-none cursor-pointer"
                    value={luggage}
                    onChange={e => setLuggage(e.target.value)}
                  >
                    <option className="bg-slate-900 text-white">No Luggage</option>
                    <option className="bg-slate-900 text-white">1-2 Small Bags</option>
                    <option className="bg-slate-900 text-white">Heavy Luggage</option>
                  </select>
                </div>

                <div className="px-4 py-3 w-full border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-center">
                  <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Reason / Emergency
                  </p>
                  <select 
                    className={`w-full bg-transparent text-xs lg:text-sm font-black text-white focus:outline-none appearance-none cursor-pointer ${reason === 'Other (Type custom)' ? 'mb-2' : ''}`}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  >
                    {reasons.map(r => <option key={r} className="bg-slate-900 text-white">{r}</option>)}
                  </select>
                  {reason === 'Other (Type custom)' && (
                    <input 
                      type="text" 
                      placeholder="Type reason..." 
                      className="w-full bg-white/10 text-white px-3 py-1.5 rounded-lg text-sm font-bold border border-white/20 focus:outline-none focus:border-rose-400 transition"
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      autoFocus
                    />
                  )}
                </div>

              </div>

              <button 
                onClick={handleBook}
                disabled={availableCount === 0}
                className="w-full py-3 bg-white hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-[2rem] font-black text-lg shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all transform hover:scale-[1.01] flex items-center justify-center gap-4 group whitespace-nowrap"
              >
                {availableCount === 0 ? 'All Rides Busy' : 'Book Auto Now'} <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>

            </div>
          </div>
        )}

        {bookingState === 'confirming' && (
          <div className="w-full max-w-2xl bg-black/70 backdrop-blur-3xl border border-cyan-500/30 rounded-[2.5rem] p-6 lg:p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            <h3 className="text-2xl font-black text-white mb-4 text-center tracking-tight">Review Trip Details</h3>
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 mb-8 relative overflow-hidden">
              {isHighPriority && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl flex items-center gap-1 shadow-lg">
                  <ShieldAlert className="w-3 h-3" /> High Priority Routing
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Pickup</p>
                  <p className="text-lg font-bold text-white">{pickup}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                  <Navigation className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Drop</p>
                  <p className="text-lg font-bold text-white">{drop}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-4">
                <div>
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Luggage</p>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" /> {luggage}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Reason</p>
                  <p className={`text-sm font-bold flex items-center gap-2 ${isHighPriority ? 'text-red-400' : 'text-white'}`}>
                    <AlertTriangle className={`w-4 h-4 ${isHighPriority ? 'text-red-400' : 'text-yellow-400'}`} /> 
                    {displayReason}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <p className="text-sm font-bold text-white/50 uppercase tracking-widest">Campus Ride Fare</p>
                <p className="text-xl font-black text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">FREE</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setBookingState('idle')}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-base transition"
              >
                Edit
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-[2] py-3 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 rounded-2xl font-bold text-base shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {isHighPriority ? 'Confirm Emergency Ride' : 'Confirm & Find Auto'} <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {bookingState === 'matched' && (
          <div className="w-full max-w-4xl bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-3 ${isHighPriority ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 text-center md:text-left">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 border ${isHighPriority ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]'}`}>
                  {isHighPriority ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">Auto is Confirmed!</h3>
                <p className={`text-xl font-bold mt-2 ${isHighPriority ? 'text-red-400' : 'text-emerald-400'}`}>Arriving in {driver.eta}</p>
                {isHighPriority && <p className="text-sm font-bold text-red-300 mt-1">Driver notified of priority status.</p>}
                
                <div className="mt-10 flex gap-6 justify-center md:justify-start">
                  <a href="tel:+919876543210" className="px-8 py-5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-2xl font-bold text-xl flex items-center gap-3 hover:bg-cyan-500/30 transition shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <Phone className="w-6 h-6" /> Call Driver
                  </a>
                  <button 
                    onClick={handleCancel}
                    className="px-8 py-5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-2xl font-bold text-xl hover:bg-red-500/30 transition"
                  >
                    Cancel Ride
                  </button>
                </div>
              </div>

              <div className="w-full md:w-[320px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 shrink-0">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 shrink-0 border-2 border-white/20 shadow-xl">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{driver.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {driver.rating}
                      </span>
                      <span className="text-sm font-bold text-white/50">• {driver.trips} Trips</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Auto No.</p>
                    <p className="text-xl font-black text-white">{driver.vehicle}</p>
                  </div>
                  <div className="bg-cyan-500 p-5 rounded-2xl border border-cyan-400 text-center shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                    <p className="text-xs font-bold text-cyan-950 uppercase tracking-widest mb-1">Booking OTP</p>
                    <p className="text-2xl font-black text-white tracking-widest">7492</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
