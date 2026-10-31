import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  User,
  Mail,
  MapPin,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Send,
  Smile,
  Frown,
  Activity,
  Phone,
  Video,
  Info
} from 'lucide-react';

export default function WellnessHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('test'); // 'test' | 'history'
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [myHistory, setMyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toast, setToast] = useState(null);

  // Tracking state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchingStatus, setSearchingStatus] = useState(false);

  // Form state
  const [studentInfo, setStudentInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    roll_number: user?.student?.roll_number || '',
    block_name: user?.student?.block_name || '',
    room_number: user?.student?.room_number || '',
    counseling_requested: true,
    preferred_mode: 'In-Person',
    notes: ''
  });

  // 9 answers initialized to null
  const [answers, setAnswers] = useState(Array(9).fill(null));

  useEffect(() => {
    loadQuestions();
    if (user) {
      loadHistory();
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.getWellnessQuestions();
      if (res.success) {
        setQuestions(res.questions || []);
        setOptions(res.options || []);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getMyWellnessScreenings();
      if (res.success) {
        setMyHistory(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTrackStatus = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Please enter your Roll Number, Phone, or Email.', 'error');
      return;
    }
    try {
      setSearchingStatus(true);
      setSearchResult(null);
      const res = await api.trackWellnessStatus(searchQuery.trim());
      if (res.success && res.screening) {
        setSearchResult(res.screening);
      } else {
        showToast(res.message || 'No assessment record found.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'No assessment record found for this query.', 'error');
    } finally {
      setSearchingStatus(false);
    }
  };

  const handleAnswerSelect = (qIndex, score) => {
    const updated = [...answers];
    updated[qIndex] = score;
    setAnswers(updated);
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercent = Math.round((answeredCount / 9) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentInfo.name.trim()) {
      showToast('Please enter your name.', 'error');
      return;
    }

    if (!studentInfo.email.trim() || !/^\S+@\S+\.\S+$/.test(studentInfo.email.trim())) {
      showToast('Please enter a valid email address so we can notify you.', 'error');
      return;
    }

    if (answeredCount < 9) {
      showToast(`Please answer all 9 questions (${9 - answeredCount} remaining).`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...studentInfo,
        answers
      };

      const res = await api.submitDepressionTest(payload);
      if (res.success) {
        setSubmittedResult(res);
        showToast('Depression screening submitted successfully!', 'success');
        if (user) loadHistory();
      } else {
        showToast(res.message || 'Submission failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Submission error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedResult(null);
    setAnswers(Array(9).fill(null));
    setStudentInfo(prev => ({
      ...prev,
      notes: ''
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner - Compassionate Safe Space */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-200 text-xs font-black uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-emerald-300 text-emerald-300" />
              100% Free & Confidential Student Support
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Student Mental Wellness & Depression Hub
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl font-normal leading-relaxed">
              Take a free 2-minute clinical assessment (PHQ-9). Whether you feel overwhelmed, anxious, or down, our resident counselor is here to help without judgment.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'test' ? 'bg-white text-teal-900 shadow-md font-black' : 'text-emerald-100 hover:text-white'
              }`}
            >
              Take Free Test
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'history' ? 'bg-white text-teal-900 shadow-md font-black' : 'text-emerald-100 hover:text-white'
                }`}
              >
                My Requests ({myHistory.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('track')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'track' ? 'bg-white text-teal-900 shadow-md font-black' : 'text-emerald-100 hover:text-white'
              }`}
            >
              🔍 Check Status
            </button>
          </div>
        </div>
      </div>

      {/* Top Reassurance Banner: If counselor verified */}
      {myHistory.length > 0 && myHistory[0].status === 'Approved' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/10 border-2 border-emerald-500 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
              ✅
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                Verified by Counselor
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                Your details are verified by counselor. They will call you soon.
              </h3>
              <p className="text-xs text-slate-700">
                Counselor <strong>{myHistory[0].counselor_name || 'Dr. Nikhil Sheoran'}</strong> has reviewed your assessment. Please keep your phone reachable.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md whitespace-nowrap self-stretch sm:self-auto cursor-pointer"
          >
            View Details
          </button>
        </motion.div>
      )}

      {/* TAB 1: SCREENING TEST & SUBMISSION */}
      {activeTab === 'test' && (
        <>
          {submittedResult ? (
            /* SUBMISSION SUCCESS & DETAILED REPORT CARD */
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6"
            >
              {/* Header result badge */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-teal-600/30">
                    {submittedResult.totalScore}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                      Score: {submittedResult.totalScore} / 27
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {submittedResult.severity}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {submittedResult.severityInfo?.description}
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Report Dispatched
                </div>
              </div>

              {/* Email notification reassurance banner */}
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Automatic Notification Dispatched:
                </div>
                <p className="leading-relaxed">
                  Your full assessment details have been securely delivered to Counselor <strong>nikhilsheoran093@gmail.com</strong>.
                </p>
                <div className="p-3 bg-white/80 rounded-xl border border-blue-100 flex items-center gap-2 text-blue-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  <span>
                    When the counselor approves and schedules your session, an appointment update will automatically be sent to your email (<strong>{studentInfo.email}</strong>).
                  </span>
                </div>
              </div>

              {/* Action guidance */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Counselor Recommended Next Steps:</h4>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {submittedResult.severityInfo?.actionGuide}
                </p>
              </div>

              {/* 24x7 Helplines */}
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <PhoneCall className="w-4 h-4 text-rose-600" />
                  24x7 Free Student Crisis & Mental Health Helplines
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-rose-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Govt. of India Tele-MANAS</p>
                    <a href="tel:14416" className="text-sm font-black text-rose-700 flex items-center gap-1 mt-0.5 hover:underline">
                      <Phone className="w-3.5 h-3.5" /> 14416 (Toll-Free)
                    </a>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-rose-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Vandrevala Mental Health</p>
                    <a href="tel:9999666555" className="text-sm font-black text-rose-700 flex items-center gap-1 mt-0.5 hover:underline">
                      <Phone className="w-3.5 h-3.5" /> +91 9999 666 555
                    </a>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-rose-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">NIMHANS Psychological Support</p>
                    <a href="tel:08046110007" className="text-sm font-black text-rose-700 flex items-center gap-1 mt-0.5 hover:underline">
                      <Phone className="w-3.5 h-3.5" /> 080 4611 0007
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Take Another Assessment
                </button>
                {user && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    View My Requests <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* QUESTIONNAIRE FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Identity Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" />
                    Student Contact & Identity
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Strictly confidential between you & counselor
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohan Patel"
                      value={studentInfo.name}
                      onChange={e => setStudentInfo({ ...studentInfo, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Notification Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="your.email@university.edu"
                      value={studentInfo.email}
                      onChange={e => setStudentInfo({ ...studentInfo, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={studentInfo.phone}
                      onChange={e => setStudentInfo({ ...studentInfo, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Roll / Student ID</label>
                    <input
                      type="text"
                      placeholder="21BCSE042"
                      value={studentInfo.roll_number}
                      onChange={e => setStudentInfo({ ...studentInfo, roll_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Hostel Block</label>
                    <input
                      type="text"
                      placeholder="Himalaya Boys Block A"
                      value={studentInfo.block_name}
                      onChange={e => setStudentInfo({ ...studentInfo, block_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Room Number</label>
                    <input
                      type="text"
                      placeholder="Room 204"
                      value={studentInfo.room_number}
                      onChange={e => setStudentInfo({ ...studentInfo, room_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Clinical PHQ-9 Questions</span>
                    <span>{answeredCount} of 9 Answered ({progressPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2.5 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 9 Standard Questions */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900 font-medium">
                  <strong>Instructions:</strong> Over the last 2 weeks, how often have you been bothered by any of the following problems? Select the option that best reflects your feelings.
                </div>

                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all ${
                      answers[idx] !== null
                        ? 'border-teal-200 bg-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-bold text-slate-800 leading-snug">
                        {q.question}
                      </p>
                    </div>

                    {/* 4 Likert Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {options.map(opt => {
                        const isSelected = answers[idx] === opt.score;
                        return (
                          <button
                            key={opt.score}
                            type="button"
                            onClick={() => handleAnswerSelect(idx, opt.score)}
                            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-[1.02]'
                                : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/90 text-slate-700'
                            }`}
                          >
                            <span className="text-xs font-black">{opt.label}</span>
                            <span className={`text-[10px] mt-1 font-medium ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                              {opt.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Counseling Request & Support Preferences */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Counseling & Support Options
                </h3>

                <div className="space-y-4 text-xs">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={studentInfo.counseling_requested}
                      onChange={e => setStudentInfo({ ...studentInfo, counseling_requested: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-slate-800 font-bold">
                      Yes, I would like to request a confidential 1-on-1 counseling session with the campus wellness officer.
                    </span>
                  </label>

                  {studentInfo.counseling_requested && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="block text-slate-600 font-bold">Preferred Session Mode:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: 'In-Person', label: 'In-Person (Wellness Centre)', icon: MapPin },
                          { id: 'Phone Call', label: 'Confidential Phone Call', icon: Phone },
                          { id: 'Video Call', label: 'Private Video Call', icon: Video }
                        ].map(mode => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setStudentInfo({ ...studentInfo, preferred_mode: mode.id })}
                            className={`p-3 rounded-xl border flex items-center gap-2 font-bold cursor-pointer transition ${
                              studentInfo.preferred_mode === mode.id
                                ? 'bg-teal-50 border-teal-500 text-teal-900'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <mode.icon className="w-4 h-4 text-teal-600" />
                            <span>{mode.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Personal Notes / Anything you'd like to share (Optional):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share whatever is on your mind... exam pressure, family worries, feeling disconnected, or sleep problems. We are here to listen."
                      value={studentInfo.notes}
                      onChange={e => setStudentInfo({ ...studentInfo, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-teal-50 border border-teal-200">
                <div className="text-xs text-teal-900">
                  <p className="font-bold">🔒 Private & Secure Submission</p>
                  <p className="text-[11px] text-teal-700">
                    Details will be emailed directly to Counselor at <strong>nikhilsheoran093@gmail.com</strong>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Submitting Assessment...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Free Test & Alert Counselor
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* TAB 2: MY PAST REQUESTS & APPOINTMENT STATUS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              My Wellness Assessments & Counseling Requests
            </h3>
            <button
              onClick={loadHistory}
              className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-400 font-medium text-xs">
              Loading your past submissions...
            </div>
          ) : myHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
              <Smile className="w-10 h-10 text-teal-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Past Requests Found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You haven't submitted a depression screening test yet. You can take the free assessment anytime.
              </p>
              <button
                onClick={() => setActiveTab('test')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
              >
                Take Free Assessment
              </button>
            </div>
          ) : (
            myHistory.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-black text-sm flex items-center justify-center">
                      {item.total_score}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        {item.severity} (Score {item.total_score} / 27)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Submitted: {new Date(item.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      item.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status === 'Approved' ? '✅ Session Approved & Scheduled' : '⏳ Pending Counselor Review'}
                  </span>
                </div>

                {/* Approved session card details */}
                {item.status === 'Approved' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-500/70 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 font-black text-sm text-emerald-950">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Your details are verified by counselor. They will call you soon.</span>
                    </div>
                    <p className="text-emerald-800 text-xs">
                      Counselor <strong>{item.counselor_name || 'Dr. Nikhil Sheoran'}</strong> has verified your assessment details. Please keep your registered phone reachable.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-2 border-t border-emerald-200">
                      <p><strong>Appointment Time:</strong> {item.session_time || 'Within 24 hours'}</p>
                      <p><strong>Counselor:</strong> {item.counselor_name || 'Dr. Nikhil Sheoran'}</p>
                      <p><strong>Venue / Mode:</strong> {item.session_venue || item.preferred_mode || 'Telephonic Call'}</p>
                      <p><strong>Contact Registered:</strong> {item.phone || item.email}</p>
                    </div>
                    {item.admin_notes && (
                      <div className="pt-2 border-t border-emerald-200 text-emerald-800 italic">
                        "Counselor's Note: {item.admin_notes}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Your test details have been emailed to <strong>nikhilsheoran093@gmail.com</strong>. The counselor is reviewing your submission. Once verified, you will be notified here that they will call you.
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CHECK VERIFICATION STATUS */}
      {activeTab === 'track' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="text-lg font-black text-slate-900">Track Assessment Verification</h3>
            <p className="text-xs text-slate-500">
              Enter your Roll Number, Phone Number, or Email to check if the counselor has verified your assessment.
            </p>
          </div>

          <form onSubmit={handleTrackStatus} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 2110990142 or 9876543210..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
            />
            <button
              type="submit"
              disabled={searchingStatus}
              className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {searchingStatus ? 'Checking...' : 'Check Status'}
            </button>
          </form>

          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border-2 ${
                searchResult.status === 'Approved'
                  ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950'
                  : 'bg-amber-50 border-amber-400 text-amber-950'
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  searchResult.status === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {searchResult.status === 'Approved' ? 'Verified by Counselor' : 'Under Review'}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(searchResult.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-black">
                {searchResult.displayMessage}
              </h4>

              <p className="text-xs leading-relaxed text-slate-700">
                {searchResult.status === 'Approved'
                  ? `Counselor ${searchResult.counselor_name} has verified your assessment. They will contact you shortly directly on your registered phone number.`
                  : 'Your assessment details have been securely dispatched to Counselor nikhilsheoran093@gmail.com. You will see an update here once verified.'}
              </p>

              <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex flex-wrap justify-between gap-2">
                <span>Student: <strong>{searchResult.name}</strong> ({searchResult.roll_number || 'Resident'})</span>
                <span>Severity: <strong>{searchResult.severity}</strong> ({searchResult.total_score}/27)</span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
