import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, RefreshCw, MessageSquare, Sparkles,
  CheckCircle2, CheckCheck, Info, Bell, ShieldAlert,
  Zap, ArrowRight, UserCheck, Check, MoreVertical
} from 'lucide-react';

const PRIORITY_BADGES = {
  Normal: { bg: 'bg-slate-100 text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  High: { bg: 'bg-amber-100 text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Urgent: { bg: 'bg-rose-100 text-rose-700 animate-pulse', border: 'border-rose-200', dot: 'bg-rose-500' },
  Directive: { bg: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-600' }
};

const CATEGORY_COLORS = {
  General: 'bg-slate-100 text-slate-600 border-slate-200',
  Inspection: 'bg-blue-100 text-blue-700 border-blue-200',
  Curfew: 'bg-amber-100 text-amber-700 border-amber-200',
  Maintenance: 'bg-orange-100 text-orange-700 border-orange-200',
  Security: 'bg-red-100 text-red-700 border-red-200',
  Mess: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Disciplinary: 'bg-purple-100 text-purple-700 border-purple-200'
};

export default function StaffMessages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [category, setCategory] = useState('General');
  const [showSubject, setShowSubject] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = async (silent = false) => {
    if (!silent) setLoadingContacts(true);
    try {
      const res = await api.getStaffContacts();
      if (res.success && res.contacts) {
        setContacts(res.contacts);
        if (!activeContact && res.contacts.length > 0) {
          const adminContact = res.contacts.find(c => c.role === 'admin');
          setActiveContact(adminContact || res.contacts[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      if (!silent) setLoadingContacts(false);
    }
  };

  const loadConversation = async (contactId, silent = false) => {
    if (!contactId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await api.getStaffConversation(contactId);
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => { loadContacts(); }, []);

  useEffect(() => {
    if (activeContact) loadConversation(activeContact.id);
  }, [activeContact?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadContacts(true);
      if (activeContact) loadConversation(activeContact.id, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeContact?.id]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || !activeContact || sending) return;

    setSending(true);
    try {
      const payload = {
        receiver_id: activeContact.id === 'broadcast' ? null : activeContact.id,
        subject: subject.trim() || undefined,
        message: text.trim(),
        priority,
        category
      };

      const res = await api.sendStaffMessage(payload);
      if (res.success) {
        setText('');
        setSubject('');
        setShowSubject(false);
        setFeedbackMsg('Message dispatched successfully');
        setTimeout(() => setFeedbackMsg(''), 3000);
        await loadConversation(activeContact.id, true);
        loadContacts(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to dispatch message');
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q)
    );
  });

  const isBroadcast = activeContact?.id === 'broadcast';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="h-[calc(100vh-6rem)] max-h-[900px] flex flex-col bg-slate-50/50 -m-4 sm:m-0 rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 overflow-hidden shadow-2xl relative z-0">
      {/* Absolute Header Overlay (Glassmorphism) */}
      <div className="absolute top-0 inset-x-0 h-16 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm z-20 px-4 sm:px-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-tight">
              Apex Campus Comms
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              256-Bit Encrypted Secure Channel
            </p>
          </div>
        </div>
        <button
          onClick={() => { loadContacts(); if (activeContact) loadConversation(activeContact.id); }}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-row h-full pt-16">
        
        {/* Left Panel: Contacts Sidebar */}
        <div className="w-[85px] sm:w-[320px] lg:w-[380px] bg-white/60 backdrop-blur-md border-r border-slate-200/80 flex flex-col shrink-0 z-10 transition-all overflow-hidden">
          {/* Search Box */}
          <div className="p-3 sm:p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 hidden sm:block" />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 sm:pl-10 pr-3 py-2.5 bg-slate-100/50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center sm:text-left"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 space-y-1 sm:space-y-2 pb-20 scrollbar-hide">
            {loadingContacts ? (
              <div className="flex justify-center p-8"><RefreshCw className="w-5 h-5 animate-spin text-indigo-500" /></div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = activeContact?.id === contact.id;
                const isBroad = contact.id === 'broadcast';
                return (
                  <motion.button
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    key={contact.id}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full group relative flex items-center p-2 sm:p-3 rounded-2xl transition-all ${
                      isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-transparent hover:bg-white text-slate-700'
                    }`}
                  >
                    {/* Active Line Indicator */}
                    {isSelected && (
                      <motion.div layoutId="activeContactIndicator" className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                    )}
                    
                    <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                      {isBroad ? (
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-xl shadow-inner ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                        }`}>
                          📢
                        </div>
                      ) : (
                        <img
                          src={contact.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          className="w-12 h-12 rounded-[18px] object-cover shadow-sm border-2 border-white/50"
                        />
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                      
                      {contact.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-sm">
                          {contact.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:block ml-3 flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={`text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {contact.name}
                        </h4>
                        {contact.latest_message && (
                          <span className={`text-[10px] font-bold shrink-0 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {contact.latest_message.created_at?.slice(11,16) || ''}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {contact.latest_message?.message || (isBroad ? 'Campus-wide alerts' : 'Tap to chat')}
                      </p>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/30 relative">
          
          {/* Ambient Background Blur */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40 overflow-hidden">
             <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {activeContact ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-slate-200/50 bg-white/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-10 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {isBroadcast ? (
                      <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-lg shadow-sm">📢</div>
                    ) : (
                      <img src={activeContact.avatar_url} className="w-10 h-10 rounded-[14px] object-cover shadow-sm" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-none">{activeContact.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                         activeContact.role === 'admin' ? 'bg-purple-100 text-purple-700' : isBroadcast ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {activeContact.role}
                      </span>
                      {!isBroadcast && (
                        <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">
                          {activeContact.department || activeContact.hostel_name || 'Staff'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"><Search className="w-4 h-4" /></button>
                  <button className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 z-10">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-indigo-500" /></div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
                      <MessageSquare className="w-10 h-10 text-indigo-300" />
                    </div>
                    <div className="text-center max-w-xs">
                      <h4 className="text-base font-black text-slate-700">Say Hello!</h4>
                      <p className="text-xs font-medium text-slate-500 mt-1">Start the conversation with {activeContact.name}. Messages are end-to-end encrypted for campus staff.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === user.id;
                    const prevMsg = messages[i-1];
                    const showHeader = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    const pBadg = PRIORITY_BADGES[msg.priority] || PRIORITY_BADGES.Normal;
                    const cBadg = CATEGORY_COLORS[msg.category] || CATEGORY_COLORS.General;

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[75%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
                      >
                        {/* Sender Header for Incoming Broadcasts or group-like view */}
                        {!isMe && showHeader && (
                          <div className="flex items-center gap-2 mb-1.5 ml-2">
                            <img src={msg.sender_avatar} className="w-5 h-5 rounded-full object-cover shadow-sm" />
                            <span className="text-[11px] font-black text-slate-700">{msg.sender_name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{msg.sender_role}</span>
                          </div>
                        )}

                        <div className={`relative px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm border backdrop-blur-sm group transition-all ${
                          isMe 
                            ? 'bg-indigo-600 border-indigo-500 text-white rounded-[24px] rounded-br-[4px]' 
                            : 'bg-white/90 border-slate-200/60 text-slate-800 rounded-[24px] rounded-bl-[4px]'
                        }`}>
                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {msg.priority !== 'Normal' && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                isMe ? 'bg-white/20 border-white/20 text-white' : `${pBadg.bg} ${pBadg.border}`
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isMe ? 'bg-white' : pBadg.dot}`} />
                                {msg.priority}
                              </span>
                            )}
                            {msg.category !== 'General' && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                isMe ? 'bg-white/10 border-white/10 text-indigo-100' : cBadg
                              }`}>
                                {msg.category}
                              </span>
                            )}
                            {msg.subject && (
                              <span className={`text-[11px] font-extrabold ${isMe ? 'text-white' : 'text-slate-900'} leading-none ml-1 block w-full mt-1 mb-1`}>
                                {msg.subject}
                              </span>
                            )}
                          </div>

                          {/* Message Body */}
                          <p className={`text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap ${isMe ? 'text-white' : 'text-slate-700'}`}>
                            {msg.message}
                          </p>

                          {/* Footer / Time */}
                          <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                            <span className="text-[9px] font-bold">{msg.created_at?.slice(11, 16)}</span>
                            {isMe && (
                              <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-cyan-300' : 'opacity-70'}`} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Chat Input Area */}
              <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/50 p-3 sm:p-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                {feedbackMsg && (
                  <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mb-2 flex items-center justify-center">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> {feedbackMsg}
                    </span>
                  </motion.div>
                )}
                
                <form onSubmit={handleSend} className="bg-slate-100/70 border border-slate-200 rounded-[24px] p-2 sm:p-3 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:bg-white transition-all shadow-sm">
                  
                  {showSubject && (
                    <input 
                      type="text" 
                      placeholder="Subject Line (Optional)..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none mb-1 border-b border-slate-200/50"
                    />
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex flex-col justify-end gap-1 pb-1">
                      <button type="button" onClick={() => setShowSubject(!showSubject)} className={`w-8 h-8 rounded-full flex items-center justify-center transition ${showSubject ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 text-slate-500'}`} title="Toggle Subject">
                        <span className="font-bold text-sm">Aa</span>
                      </button>
                    </div>

                    <textarea
                      rows={1}
                      placeholder={isBroadcast ? "Draft official campus broadcast..." : "Type your message..."}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                      }}
                      className="flex-1 bg-transparent py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none resize-none max-h-32 min-h-[44px]"
                    />

                    <div className="flex flex-col justify-end gap-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        disabled={!text.trim() || sending}
                        type="submit"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white flex items-center justify-center shadow-md disabled:shadow-none transition-all cursor-pointer"
                      >
                        {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Quick Controls Bottom Row */}
                  <div className="flex items-center justify-between px-2 pt-2 mt-2 border-t border-slate-200/50">
                    <div className="flex items-center gap-2">
                      <select value={priority} onChange={e=>setPriority(e.target.value)} className="bg-white border border-slate-200 text-[10px] font-bold text-slate-600 py-1 px-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="Normal">🟢 Normal</option>
                        <option value="High">🟠 High</option>
                        <option value="Urgent">🔴 Urgent</option>
                        {isAdmin && <option value="Directive">🛡️ Directive</option>}
                      </select>
                      <select value={category} onChange={e=>setCategory(e.target.value)} className="hidden sm:block bg-white border border-slate-200 text-[10px] font-bold text-slate-600 py-1 px-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="General">General</option>
                        <option value="Curfew">Curfew</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Mess">Mess</option>
                        <option value="Security">Security</option>
                      </select>
                    </div>
                    {isBroadcast && (
                      <span className="text-[9px] font-black uppercase text-amber-500 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shadow-sm">
                        <Bell className="w-3 h-3" /> Mass Push Alert
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              {/* Empty State Handled Above */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
