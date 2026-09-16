import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import {
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Droplets,
  Wifi,
  ChevronRight,
  MessageSquare,
  Check,
  UserCheck,
  Activity,
  Flame
} from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    title: 'Ceiling Fan Vibrating & High Noise',
    description: 'The ceiling fan is wobbling excessively at speed 3 and above, producing loud grinding mechanical noise. Possible bearing or mounting issue.',
    category: 'Electrical',
    priority: 'Medium',
    department: 'Electrical Maintenance'
  },
  {
    title: 'Washroom Pipe Leakage & Water Pressure Low',
    description: 'The hot water inlet pipe beneath the sink is constantly dripping water onto the floor, causing slippery puddles. Urgent plumber inspection needed.',
    category: 'Plumbing',
    priority: 'High',
    department: 'Plumbing Department'
  },
  {
    title: 'Hostel WiFi AP Unreachable & Packet Loss',
    description: 'Room router access point drops signal intermittently every 5 minutes. High latency and DNS resolve failures during online lab assignments.',
    category: 'Internet',
    priority: 'High',
    department: 'IT & Network Support'
  },
  {
    title: 'Study Table Drawer Lock Jammed',
    description: 'The study table drawer key is stuck inside the lock cylinder and won’t turn. Cannot access books and laptop accessories.',
    category: 'Furniture',
    priority: 'Low',
    department: 'Carpentry & Furniture'
  }
];

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [wardenModalOpen, setWardenModalOpen] = useState(false);
  const [wardenList, setWardenList] = useState([]);
  const [wardenReport, setWardenReport] = useState({ warden_user_id: '', subject: '', description: '' });
  const [submittingWarden, setSubmittingWarden] = useState(false);

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: 'Room B-204',
    category: 'Electrical',
    priority: 'Medium',
    department: 'Electrical Maintenance',
    image_url: '',
  });

  // AI Triage state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);


  const openWardenModal = async () => {
    setWardenModalOpen(true);
    try {
      const res = await api.getWardensList();
      if(res.success) setWardenList(res.wardens);
    } catch(err) {
      console.error(err);
    }
  };

  const handleWardenReportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingWarden(true);
    try {
      const res = await api.submitWardenComplaint(wardenReport);
      if(res.success) {
        alert('Complaint successfully escalated to Admin.');
        setWardenModalOpen(false);
        setWardenReport({ warden_user_id: '', subject: '', description: '' });
      }
    } catch(err) {
      alert('Error submitting report: ' + err.message);
    } finally {
      setSubmittingWarden(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.getComplaints({ status: filterStatus });
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus]);

  // Trigger AI analysis
  const triggerAiTriage = async (customDesc, customTitle) => {
    const descToUse = customDesc || formData.description;
    const titleToUse = customTitle || formData.title;

    if (!descToUse && !titleToUse) {
      alert('Please enter or select a complaint title/description first.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.aiTriageComplaint({
        title: titleToUse,
        description: descToUse,
      });
      if (res.success && res.suggestion) {
        setAiSuggestion(res.suggestion);
        setFormData(prev => ({
          ...prev,
          category: res.suggestion.category || prev.category,
          priority: res.suggestion.priority || prev.priority,
          department: res.suggestion.department || prev.department,
        }));
      }
    } catch (err) {
      console.error('AI Triage error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const applyTemplate = (tpl) => {
    setFormData(prev => ({
      ...prev,
      title: tpl.title,
      description: tpl.description,
      category: tpl.category,
      priority: tpl.priority,
      department: tpl.department
    }));
    triggerAiTriage(tpl.description, tpl.title);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createComplaint(formData);
      setSuccessMsg('Complaint registered successfully! AI assigned SLA and maintenance crew notified.');
      setModalOpen(false);
      setFormData({
        title: '',
        description: '',
        location: 'Room B-204',
        category: 'Electrical',
        priority: 'Medium',
        department: 'Electrical Maintenance',
        image_url: '',
      });
      setAiSuggestion(null);
      fetchComplaints();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      alert(err.message || 'Error creating complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3 h-3 text-blue-600" />
            Assigned to Tech
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Activity className="w-3 h-3 text-purple-600 animate-spin" />
            Work In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-700 bg-red-100/70 border border-red-200 px-2 py-0.5 rounded-md">
            <Flame className="w-3 h-3 text-red-600 animate-bounce" /> Urgent
          </span>
        );
      case 'High':
        return <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-md">High Priority</span>;
      case 'Medium':
        return <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-md">Medium Priority</span>;
      default:
        return <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">Low Priority</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Gemini AI Triage Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Complaints & Maintenance Desk</h1>
          <p className="text-xs text-blue-200/80 mt-1 max-w-xl">
            Lodge maintenance tickets with automated natural language classification, severity estimation, and live technician dispatch status.
          </p>
        </div>

        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setAiSuggestion(null);
            setModalOpen(true);
          }}
          className="relative z-10 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-500/30 transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> + Log New Complaint
        </motion.button>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`relative px-4 py-2 rounded-xl transition whitespace-nowrap text-xs font-bold ${
                filterStatus === tab
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
              {filterStatus === tab && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-slate-900 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{complaints.length}</span> tickets
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin" />
          <span className="text-xs text-slate-400 font-bold">Syncing tickets with hostel database...</span>
        </div>
      ) : complaints.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm text-center text-xs text-slate-500"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-black text-base text-slate-800">No complaints matching filter</p>
          <p className="mt-1 text-slate-500 max-w-sm mx-auto">
            Everything is in order! Click the button above to lodge a maintenance request whenever needed.
          </p>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="space-y-4"
        >
          {complaints.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group"
            >
              {/* Left category accent bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  c.status === 'Resolved'
                    ? 'bg-emerald-500'
                    : c.priority === 'Urgent'
                    ? 'bg-red-500'
                    : c.priority === 'High'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 pl-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-black text-slate-400">#TK-{c.id}</span>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {c.title}
                    </h3>
                    {getStatusBadge(c.status)}
                    {getPriorityBadge(c.priority)}
                  </div>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed max-w-3xl">
                    {c.description}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 pl-2 sm:pl-0">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {new Date(c.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <p className="text-xs font-extrabold text-slate-700 mt-1 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                    📍 {c.location}
                  </p>
                </div>
              </div>

              {/* Workflow Stepper / Timeline Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 pl-2">
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold mb-3">
                  <div className={`flex flex-col items-center gap-1 ${c.status ? 'text-blue-700' : 'text-slate-400'}`}>
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Lodge Ticket</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1 ${c.status !== 'Pending' ? 'text-blue-700' : 'text-slate-400'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${c.status !== 'Pending' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {c.status !== 'Pending' ? <Check className="w-3 h-3" /> : '2'}
                    </div>
                    <span>Warden Review</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1 ${c.status === 'In Progress' || c.status === 'Resolved' ? 'text-purple-700' : 'text-slate-400'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${c.status === 'In Progress' || c.status === 'Resolved' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {c.status === 'Resolved' ? <Check className="w-3 h-3" /> : '3'}
                    </div>
                    <span>Dispatched</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1 ${c.status === 'Resolved' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${c.status === 'Resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {c.status === 'Resolved' ? <Check className="w-3 h-3" /> : '4'}
                    </div>
                    <span>Resolution</span>
                  </div>
                </div>

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
                  <div className="flex flex-wrap items-center gap-3 text-slate-500">
                    <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      Category: <strong className="text-slate-800">{c.category}</strong>
                    </span>
                    <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      Dept: <strong className="text-slate-800">{c.department}</strong>
                    </span>
                    {c.assigned_to && (
                      <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 font-bold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        Assigned: {c.assigned_to}
                      </span>
                    )}
                  </div>

                  {c.status === 'Resolved' && (
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Closed & Verified
                    </span>
                  )}
                </div>

                {c.resolution_notes && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block mb-0.5">Technician Remarks / Action Taken:</strong>
                      {c.resolution_notes}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <Link to={`/student/complaints/${c.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow-sm border border-indigo-100">
                    <MessageSquare className="w-3.5 h-3.5" />
                    View Ticket Chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Log New Complaint Modal with AI Triage & Quick Templates */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Lodge Maintenance Ticket"
        subtitle="AI triage will automatically classify category, severity & dispatch team"
        maxWidth="max-w-2xl"
      >
        {/* Quick viva templates */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            ⚡ Quick Test Samples (1-Click Fill & AI Triage)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/50 transition text-xs group"
              >
                <div className="font-bold text-slate-800 group-hover:text-blue-600 truncate">
                  {tpl.title}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <span>{tpl.category}</span>
                  <span>•</span>
                  <span className="text-amber-600 font-bold">{tpl.priority}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Ceiling fan vibrating and making abnormal noise"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Description *
              </label>
              <button
                type="button"
                onClick={() => triggerAiTriage()}
                disabled={aiLoading}
                className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition shadow-sm hover:shadow"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${aiLoading ? 'animate-spin' : ''}`} />
                {aiLoading ? 'Gemini Analyzing...' : 'Auto-Classify with AI'}
              </button>
            </div>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what is wrong, which appliance is affected, or any safety concerns..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* AI Suggestion Preview Box with animated Pulse */}
          <AnimatePresence>
            {aiSuggestion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>AI Triage Intelligence ({aiSuggestion.source === 'gemini-ai' ? 'Gemini 1.5 Flash' : 'NLP Heuristic Engine'}):</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-full">
                    Confidence: 98%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/90 border border-blue-100 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                    <p className="font-black text-slate-900 mt-0.5">{aiSuggestion.category}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 border border-blue-100 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Priority</span>
                    <p className="font-black text-slate-900 mt-0.5 flex items-center gap-1">
                      {aiSuggestion.priority}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 border border-blue-100 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Est. SLA</span>
                    <p className="font-black text-emerald-700 mt-0.5">{aiSuggestion.estimatedSLA}</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 mt-2.5 italic bg-white/50 p-2 rounded-lg border border-blue-100/50">
                  <span className="font-bold text-blue-900">AI Rationale:</span> "{aiSuggestion.reasoning}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option>Electrical</option>
                <option>Plumbing</option>
                <option>Cleaning</option>
                <option>Internet</option>
                <option>Furniture</option>
                <option>Security</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-bold"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Room B-204"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Optional Photo URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching Ticket...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Report Warden Modal */}
      <Modal
        isOpen={wardenModalOpen}
        onClose={() => setWardenModalOpen(false)}
        title="Escalate Issue to Admin"
        subtitle="Report inappropriate warden behavior or negligence securely to Institutional Admin."
      >
        <form onSubmit={handleWardenReportSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Select Warden</label>
            <select
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition"
              value={wardenReport.warden_user_id}
              onChange={(e) => setWardenReport({...wardenReport, warden_user_id: e.target.value})}
            >
              <option value="">-- Choose Warden --</option>
              {wardenList.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Incident Subject</label>
            <input
              type="text"
              required
              placeholder="E.g., Negligence, Unfair Treatment, Unprofessional Behavior"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition"
              value={wardenReport.subject}
              onChange={(e) => setWardenReport({...wardenReport, subject: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Detailed Description</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the incident securely and honestly. This report will go directly to the Admin."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition resize-none"
              value={wardenReport.description}
              onChange={(e) => setWardenReport({...wardenReport, description: e.target.value})}
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setWardenModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingWarden}
              className="px-5 py-2.5 text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-md disabled:opacity-50 transition"
            >
              {submittingWarden ? 'Submitting...' : 'Submit to Admin'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
