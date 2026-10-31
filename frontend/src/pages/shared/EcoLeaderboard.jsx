import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Leaf, Zap, Droplets, Trophy, Medal, Star, ShieldCheck, Gift, AlertCircle, ArrowRight } from 'lucide-react';

export default function EcoLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Live update every 10s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const lbRes = await api.getEcoLeaderboard();
      if (lbRes.success) {
        setLeaderboard(lbRes.leaderboard);
        setStats(lbRes.stats);
      }

      if (user?.role === 'student') {
        const myRes = await api.getMyEcoStats();
        if (myRes.success) setMyStats(myRes.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if(!window.confirm("Claim your Top 5 Eco-Warrior 5% fee discount?")) return;
    setClaiming(true);
    try {
      const res = await api.claimEcoReward();
      
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        loadData(); // refresh
      } else {
        setMsg({ type: 'error', text: res.message || 'Error claiming' });
      }
      setTimeout(() => setMsg(null), 5000);
    } catch(err) {
      setMsg({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Calculating Campus Carbon Footprint...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-emerald-500/20">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider rounded-full border border-emerald-500/30 mb-3">
              <Leaf className="w-3.5 h-3.5" /> Green Campus Initiative
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-emerald-50">
              Eco-Warrior Leaderboard
            </h1>
            <p className="text-emerald-200 mt-2 text-sm max-w-xl">
              Track your energy efficiency, reduce the hostel's carbon footprint, and earn fee discounts by becoming a Top 5 Eco-Warrior!
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
              <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <div className="text-xl font-black text-white">{Math.round(stats?.total_elec || 0)} kWh</div>
              <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Total Power</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
              <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-xl font-black text-white">{Math.round(stats?.total_water || 0)} L</div>
              <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Total Water</div>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
          {msg.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Hostel Global Rankings
            </h2>
            
            <div className="space-y-3">
              {leaderboard.map((lb, idx) => {
                const isTop3 = idx < 3;
                return (
                  <div key={lb.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    idx === 0 ? 'bg-amber-50 border-amber-200 shadow-sm' : 
                    idx === 1 ? 'bg-slate-50 border-slate-200' :
                    idx === 2 ? 'bg-orange-50 border-orange-200' :
                    'bg-white border-slate-100 hover:border-slate-300'
                  } ${myStats?.id === lb.id ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' : 
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        #{idx + 1}
                      </div>
                      
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {lb.name} 
                          {myStats?.id === lb.id && <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-700 uppercase">You</span>}
                        </div>
                        <div className="text-xs text-slate-500">Room {lb.room_number || 'N/A'} • {lb.badge}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-black text-lg text-emerald-600">{lb.eco_points}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Eco Points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: My Impact & Rules */}
        <div className="space-y-6">
          {user?.role === 'student' && myStats && (
            <div className="bg-gradient-to-b from-white to-emerald-50 rounded-3xl p-6 shadow-sm border border-emerald-100">
              <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-500" />
                My Eco-Impact
              </h2>
              
              <div className="text-center p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm mb-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Rank</div>
                <div className="text-4xl font-black text-emerald-600">#{myStats.rank}</div>
                <div className="text-sm font-bold text-emerald-800 mt-1">{myStats.badge}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                  <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <div className="font-bold text-slate-900">{myStats.electricity_usage} kWh</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                  <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="font-bold text-slate-900">{myStats.water_usage} L</div>
                </div>
              </div>

              {myStats.rank <= 5 ? (
                <div className="bg-emerald-600 p-5 rounded-2xl text-white text-center shadow-lg shadow-emerald-500/30">
                  <Gift className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
                  <h3 className="font-black mb-1">Claim Reward!</h3>
                  <p className="text-xs text-emerald-100 mb-4">You're in the Top 5! Claim your ₹500 fee discount.</p>
                  <button 
                    onClick={handleClaim}
                    disabled={myStats.reward_claimed || claiming}
                    className="w-full py-2.5 bg-white text-emerald-700 font-black rounded-xl hover:bg-emerald-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {claiming ? 'Processing...' : myStats.reward_claimed ? 'Already Claimed ✓' : 'Claim ₹500 Discount'}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-100 p-4 rounded-2xl text-center">
                  <p className="text-xs text-slate-600 font-medium">Reach the <strong className="text-slate-900">Top 5</strong> to unlock the monthly ₹500 fee waiver.</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="font-black flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              How it works
            </h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />
                Your room's electricity and water meters are synced with our IoT gateway.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />
                Lower consumption yields higher Eco Points.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />
                The Top 5 students at the end of each month get a direct ₹500 discount on their pending fees/fines!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
