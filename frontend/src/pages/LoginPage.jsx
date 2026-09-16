import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Building2, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('student@hostel.com');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'warden') navigate('/warden/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'student') {
      setEmail('student@hostel.com');
      setPassword('student123');
    } else if (role === 'warden') {
      setEmail('warden@hostel.com');
      setPassword('warden123');
    } else if (role === 'admin') {
      setEmail('admin@hostel.com');
      setPassword('admin123');
    }
    setError(null);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(forgotEmail || email);
      setForgotMsg(res.message);
    } catch (err) {
      setForgotMsg(err.message || 'Error requesting password reset.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Global Ambient Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px] mix-blend-multiply" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-emerald-200/40 rounded-full blur-[120px] mix-blend-multiply" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
            <Building2 className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tight">
          Apex <span className="text-blue-600">SmartHostel</span>
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Authorized Campus Access Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-white/70 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-[32px] shadow-2xl shadow-indigo-900/10 border border-white/50">
          
          {/* Viva 1-Click Demo Buttons */}
          <div className="mb-6 p-3 rounded-2xl bg-white/50 border border-slate-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Fill Demo Credentials:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemo('student')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                  email === 'student@hostel.com'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border hover:bg-slate-100'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => fillDemo('warden')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                  email === 'warden@hostel.com'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border hover:bg-slate-100'
                }`}
              >
                Warden
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                  email === 'admin@hostel.com'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border hover:bg-slate-100'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 font-semibold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Campus Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@hostel.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotModalOpen(true);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
            <span>New student resident? </span>
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
              Register here
            </Link>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => {
          setForgotModalOpen(false);
          setForgotMsg(null);
        }}
        title="Reset Portal Password"
        subtitle="Enter your campus registered email address"
      >
        {forgotMsg ? (
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-900 text-xs font-medium space-y-3">
            <p>{forgotMsg}</p>
            <button
              onClick={() => {
                setForgotModalOpen(false);
                setForgotMsg(null);
              }}
              className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus Email</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your.email@hostel.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Send Reset Instructions
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
}
