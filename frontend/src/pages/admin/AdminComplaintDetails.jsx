import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { 
  ArrowLeft, CheckCircle2, Clock, Sparkles, Send, 
  MessageSquare, User, Phone, Mail, MapPin, ShieldAlert, Activity 
} from 'lucide-react';

export default function AdminComplaintDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const basePath = user?.role === 'student' ? '/student/complaints' : (user?.role === 'admin' ? '/admin/complaints' : '/warden/complaints');
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Messaging state
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.getComplaintDetails(id);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if(!msgText.trim()) return;
    setSending(true);
    try {
      const res = await api.addComplaintUpdate(id, msgText);
      if (res.success) {
        setData(prev => ({ ...prev, complaint: { ...prev.complaint, updates: res.updates } }));
        setMsgText('');
      }
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data?.complaint) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800">Ticket not found</h2>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-medium mt-4 inline-block hover:underline">Go Back</button>
      </div>
    );
  }

  const { complaint } = data;
  const updates = complaint.updates || [];

  const statusColors = {
    'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'Assigned': 'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const priorityColors = {
    'Low': 'bg-slate-100 text-slate-600',
    'Medium': 'bg-blue-100 text-blue-600',
    'High': 'bg-orange-100 text-orange-600',
    'Critical': 'bg-rose-100 text-rose-600 animate-pulse'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ticket #{complaint.id}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[complaint.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {complaint.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{new Date(complaint.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: Ticket & Triage */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${priorityColors[complaint.priority]}`}>
                {complaint.priority} Priority
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                {complaint.category}
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-3">{complaint.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {complaint.description}
            </p>

            {complaint.ai_summary && (
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">AI Root Cause Analysis</h4>
                </div>
                <p className="text-sm text-indigo-800 leading-relaxed font-medium">{complaint.ai_summary}</p>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-1 rounded-md bg-white/60 text-indigo-700 text-[10px] font-bold shadow-sm">
                    Dept: {complaint.department}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Messaging Thread */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-black text-slate-800">{user?.role === "student" ? "Ticket Chat & Updates" : "Contact Student / Updates"}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {updates.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600">No updates yet</p>
                </div>
              ) : (
                updates.map(u => {
                  const isMe = u.updater_role === user?.role || (u.updater_role === 'admin' && user?.role === 'warden') || (u.updater_role === 'warden' && user?.role === 'admin');
                  return (
                    <div key={u.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                        <div className="flex items-center gap-2 mb-1 opacity-80">
                          <span className="text-[10px] font-black uppercase tracking-wider">{u.updater_name}</span>
                          <span className="text-[9px]">• {new Date(u.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{u.update_text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <input 
                type="text" 
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder={user?.role === "student" ? "Reply to admin/warden..." : "Send a direct message to the student..."}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-medium transition"
              />
              <button 
                type="submit" 
                disabled={sending || !msgText.trim()}
                className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition shrink-0"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send className="w-5 h-5 ml-1"/>}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COL: Student Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Complainant Details
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-md flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{complaint.student_name}</h4>
                <p className="text-xs font-mono text-slate-500">{complaint.roll_number}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-700">{complaint.student_phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                  <p className="text-sm font-semibold text-slate-700 truncate max-w-[150px]">{complaint.student_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Room Allocation</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {complaint.block_name ? `${complaint.block_name} - ${complaint.room_number}` : 'Unallocated'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
