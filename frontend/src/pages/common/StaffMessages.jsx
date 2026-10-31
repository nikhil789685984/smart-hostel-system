import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, API_BASE } from '../../services/api';
import { FileVideo, FileCode, Play, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, RefreshCw, MessageSquare, Sparkles,
  CheckCircle2, CheckCheck, Info, Bell, ShieldAlert,
  Zap, ArrowRight, UserCheck, Check, MoreVertical
, FolderSync, Video, PhoneCall, Maximize2, Music
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




const forceDownload = async (e, url, filename) => {
  e.stopPropagation();
  e.preventDefault();
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed', error);
    window.open(url, '_blank');
  }
};

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};


const renderMessageWithMedia = (text, onImageClick) => {
  if (!text) return null;

  const renderText = (rawText) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = rawText.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors break-all">{part}</a>;
      }
      return part;
    });
  };

  
  // Format markdown bold
  const boldRegex = /\*\*(.*?)\*\*/g;
  let formattedText = text;
  // Actually, mixing react elements and string replace for markdown is complex if done manually.
  // We'll stick to our file regex for now, just making media blocks look insane.

  const fileRegex = /\[(.*?)\]\((.*?)\)/g;
  let elements = [];
  let lastIndex = 0;
  let match;
  
  const baseHost = API_BASE.replace('/api', '');

  while ((match = fileRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textPart = text.substring(lastIndex, match.index).trim();
      if (textPart) elements.push(<span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{renderText(textPart)}</span>);
    }
    
    let filename = match[1];
    let rawUrl = match[2];
    const finalUrl = rawUrl.startsWith('/uploads') ? `${baseHost}${rawUrl}` : rawUrl;
    const ext = finalUrl.split('.').pop().toLowerCase();
    
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      elements.push(
        <div key={`media-${match.index}`} className="mt-3 relative group rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl max-w-md transition-all duration-300 hover:shadow-indigo-500/20">
          <video controls preload="metadata" className="w-full max-h-[350px] object-contain bg-black/40 rounded-2xl">
            <source src={finalUrl} />
          </video>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={(e) => forceDownload(e, finalUrl, filename)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-indigo-500 hover:scale-110 transition-all shadow-xl">
                <Download className="w-5 h-5" />
             </button>
          </div>
        </div>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      elements.push(
        <div key={`media-${match.index}`} className="mt-3 relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-sm cursor-zoom-in" onClick={() => onImageClick && onImageClick(finalUrl)}>
          <img src={finalUrl} alt={filename} className="w-full max-h-[300px] object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
             <button onClick={(e) => forceDownload(e, finalUrl, filename)} className="w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-indigo-500 transition shadow-lg">
                <Download className="w-4 h-4" />
             </button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
             <div className="flex justify-between items-end">
                <span className="text-white font-bold text-sm truncate pr-4">{filename}</span>
                <Maximize2 className="w-5 h-5 text-white/80" />
             </div>
          </div>
        </div>
      );
    } else if (['mp3', 'wav', 'm4a'].includes(ext)) {
      elements.push(
        <div key={`media-${match.index}`} className="mt-3 relative flex items-center gap-4 bg-slate-900 rounded-full p-2 pr-6 max-w-sm border border-slate-700 shadow-xl">
           <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
             <Music className="w-5 h-5" />
           </div>
           <audio controls className="h-8 max-w-[200px] sepia hue-rotate-180 invert brightness-150 contrast-125" src={finalUrl}></audio>
        </div>
      );
    } else {
      elements.push(
        <a key={`media-${match.index}`} href={finalUrl} onClick={(e) => forceDownload(e, finalUrl, filename)} className="mt-3 flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer no-underline group block w-full max-w-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100 transition-colors"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner relative z-10">
             {['pdf'].includes(ext) ? <FileCode className="w-7 h-7" /> : <FileVideo className="w-7 h-7" />}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
            <p className="font-bold text-slate-800 truncate w-full m-0 text-base">{filename}</p>
            <p className="text-[11px] text-slate-400 font-bold m-0 mt-1 uppercase tracking-widest flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {ext.toUpperCase()} DOCUMENT
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all relative z-10 shadow-sm">
            <Download className="w-4 h-4" />
          </div>
        </a>
      );
    }
    
    lastIndex = fileRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    const textPart = text.substring(lastIndex).trim();
    if (textPart) elements.push(<span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{renderText(textPart)}</span>);
  }
  
  return elements.length > 0 ? <div className="flex flex-col gap-1.5">{elements}</div> : <span className="whitespace-pre-wrap">{renderText(text)}</span>;
};

export default function StaffMessages() {
  const [lightboxImage, setLightboxImage] = useState(null);

  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);
  
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setUploadProgress(10);
      setFeedbackMsg(`Uploading ${file.name}...`);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(p => p < 90 ? p + 15 : 90);
      }, 300);

      const res = await api.uploadFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (res.fileUrl) {
        setText(prev => (prev ? prev + '\n\n' : '') + `[${file.name}](${res.fileUrl})`);
        setFeedbackMsg('Media attached successfully! ✅');
      } else {
        setFeedbackMsg('Upload failed: No URL returned');
      }
      setTimeout(() => {
        setFeedbackMsg('');
        setIsUploading(false);
        setUploadProgress(0);
      }, 2000);
    } catch (err) {
      setFeedbackMsg('Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
      setTimeout(() => setFeedbackMsg(''), 2000);
    }
  };

    const [showVCModal, setShowVCModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [category, setCategory] = useState('General');
  const [showSubject, setShowSubject] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

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
    if (activeContact) {
      prevMessagesLength.current = 0; // Reset so new contact scrolls to bottom
      loadConversation(activeContact.id);
    }
  }, [activeContact?.id]);

  

    useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

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
                  <button
                    
                    
                    key={contact.id}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full group relative flex items-center p-2 sm:p-3 rounded-2xl transition-all ${
                      isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-transparent hover:bg-white text-slate-700'
                    }`}
                  >
                    {/* Active Line Indicator */}
                    {isSelected && (
                      <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
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
                  </button>
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
                      <div 
                        
                        
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
                            {renderMessageWithMedia(msg.message, setLightboxImage)}
                          </p>

                          {/* Footer / Time */}
                          <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                            <span className="text-[9px] font-bold">{msg.created_at?.slice(11, 16)}</span>
                            {isMe && (
                              <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-cyan-300' : 'opacity-70'}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Chat Input Area */}
              <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/50 p-3 sm:p-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                {feedbackMsg && (
                  <div   className="mb-2 flex items-center justify-center">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> {feedbackMsg}
                    </span>
                  </div>
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
                      <button
                        disabled={!text.trim() || sending}
                        type="submit"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white flex items-center justify-center shadow-md disabled:shadow-none transition-all cursor-pointer"
                      >
                        {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Controls Bottom Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 pt-2 mt-2 border-t border-slate-200/50 gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="*/*" className="hidden" />
                      
                      <button 
                        type="button" 
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()} 
                        className={`p-1.5 sm:p-2 ${isUploading ? 'bg-indigo-100 text-indigo-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'} rounded-lg flex items-center gap-1 text-[10px] sm:text-xs font-bold transition-all relative overflow-hidden`}
                      >
                        {isUploading ? (
                          <>
                            <div className="absolute inset-0 bg-indigo-200/50 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin relative z-10"/> 
                            <span className="relative z-10">Uploading...</span>
                          </>
                        ) : (
                          <><FolderSync className="w-3 h-3 sm:w-4 sm:h-4"/> Attach File</>
                        )}
                      </button>

                      
                      

                      <div className="w-px h-4 bg-slate-300 mx-1 hidden sm:block"></div>
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
      
      {/* Lightbox Modal */}
      
        {lightboxImage && (
          <div 
             
             
             
            onClick={() => setLightboxImage(null)} 
            className="fixed inset-0 z-[999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
              <button onClick={(e) => forceDownload(e, lightboxImage, lightboxImage.split("/").pop())} className="text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all">
                <Download className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }} className="text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <img 
              
              
              
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={lightboxImage} 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10" 
            />
          </div>
        )}
      
    </div>
  );
}