import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, ShieldCheck, UserCheck, Smartphone, Zap } from 'lucide-react';

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(null);

  const handleQuickLogin = async (role) => {
    setLoadingRole(role);
    try {
      let email = '';
      if (role === 'student') email = 'student@hostel.com';
      else if (role === 'warden') email = 'warden@hostel.com';
      else if (role === 'admin') email = 'admin@hostel.com';
      
      const success = await login(email, role + '123');
      if (success) {
        if (role === 'student') navigate('/student');
        else if (role === 'warden') navigate('/warden');
        else if (role === 'admin') navigate('/admin');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden flex flex-col">
      {/* Global Ambient Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px] mix-blend-multiply" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-emerald-200/40 rounded-full blur-[120px] mix-blend-multiply" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Apex Institute of Technology</h1>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Campus Residential ERP</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 hidden sm:block">Sign In</Link>
              <Link to="/register" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md hover:bg-slate-800 transition hidden sm:block">Register</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-widest mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Campus Active
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.1]"
          >
            Smart Hostel <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Management</span> Ecosystem
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-slate-600 max-w-2xl font-medium"
          >
            Experience the next generation of institutional residential governance. Real-time semester fee ledgers, automated digital gate passes, and complete administrative transparency.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left"
          >
            {/* Student Login */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Student Portal</h3>
              <p className="text-sm text-slate-500 mb-6">Manage hostel leaves, semester fees, and mess feedback directly from your phone.</p>
              
              <button 
                onClick={() => handleQuickLogin('student')}
                disabled={loadingRole !== null}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
              >
                {loadingRole === 'student' ? 'Connecting...' : 'Student 1-Click Login'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Warden Login */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Warden Command</h3>
              <p className="text-sm text-slate-500 mb-6">Review automated gate passes, allocate rooms, and broadcast urgent campus notices.</p>
              
              <button 
                onClick={() => handleQuickLogin('warden')}
                disabled={loadingRole !== null}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
              >
                {loadingRole === 'warden' ? 'Connecting...' : 'Warden 1-Click Login'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Login */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Admin Central</h3>
              <p className="text-sm text-slate-500 mb-6">Full institutional oversight. Execute warden payroll, revenue analytics, and security.</p>
              
              <button 
                onClick={() => handleQuickLogin('admin')}
                disabled={loadingRole !== null}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
              >
                {loadingRole === 'admin' ? 'Connecting...' : 'Admin 1-Click Login'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
