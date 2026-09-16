import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  MessageSquare,
  FileText,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Volume2
} from 'lucide-react';

// Web Audio API chime sound generator
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) {
    // Autoplay or permissions policy
  }
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'fines'
  const [toastNotif, setToastNotif] = useState(null);
  const dropdownRef = useRef(null);
  const knownIdsRef = useRef(new Set());
  const toastTimerRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getMyNotifications();
      if (res.success) {
        const notifList = res.notifications || [];
        setNotifications(notifList);
        setUnreadCount(res.unreadCount || 0);

        // Detect newly arrived notifications for live toast alert
        if (knownIdsRef.current.size > 0) {
          const newUnread = notifList.find(n => n.is_read === 0 && !knownIdsRef.current.has(n.id));
          if (newUnread) {
            setToastNotif(newUnread);
            playNotificationChime();

            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(() => {
              setToastNotif(null);
            }, 6000);
          }
        }

        // Register all current IDs
        notifList.forEach(n => knownIdsRef.current.add(n.id));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Immediate fetch on user switch + 3.5s periodic polling
  useEffect(() => {
    knownIdsRef.current.clear();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 3500);

    return () => {
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [user?.id, user?.role]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // recalculate unread
      const removed = notifications.find(n => n.id === id);
      if (removed && !removed.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Helper icon & color
  const getIcon = (type) => {
    switch (type) {
      case 'fine':
        return {
          icon: AlertTriangle,
          bg: 'bg-rose-100 text-rose-700 border-rose-200'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bg: 'bg-amber-100 text-amber-700 border-amber-200'
        };
      case 'gate_pass':
        return {
          icon: QrCode,
          bg: 'bg-purple-100 text-purple-700 border-purple-200'
        };
      case 'complaint':
        return {
          icon: AlertCircle,
          bg: 'bg-blue-100 text-blue-700 border-blue-200'
        };
      case 'message':
        return {
          icon: MessageSquare,
          bg: 'bg-indigo-100 text-indigo-700 border-indigo-200'
        };
      case 'fee':
      case 'success':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
      case 'notice':
      default:
        return {
          icon: FileText,
          bg: 'bg-slate-100 text-slate-700 border-slate-200'
        };
    }
  };

  // Format relative time
  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr.replace(' ', 'T'));
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  // Filtered list
  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return n.is_read === 0;
    if (activeTab === 'fines') return n.type === 'fine' || n.type === 'warning';
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition active:scale-95"
        title="Live Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-black">Campus Notifications</h3>
                <p className="text-[10px] text-blue-200">
                  {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts up to date'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-blue-300 hover:text-white flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-white/10"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2.5 pb-1 border-b border-slate-100 bg-slate-50 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                activeTab === 'unread'
                  ? 'bg-white text-rose-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('fines')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                activeTab === 'fines'
                  ? 'bg-white text-amber-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fines & Alerts
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                Checking live notifications...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                <p className="font-bold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No notifications in this filter.</p>
              </div>
            ) : (
              filtered.map((notif) => {
                const conf = getIcon(notif.type);
                const IconComp = conf.icon;
                const isUnread = notif.is_read === 0;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 hover:bg-slate-50 transition-all cursor-pointer flex items-start gap-3 relative group ${
                      isUnread ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${conf.bg}`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                          {formatTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                        {notif.message}
                      </p>

                      {notif.link && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-1 hover:underline">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5 ring-2 ring-blue-100"></span>
                    )}

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Test Alert Button */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400 font-medium">
              Live Push Engine Active (3.5s Sync)
            </span>
            <button
              type="button"
              onClick={() => {
                const sample = {
                  id: Date.now(),
                  title: '🔔 Live System Ping',
                  message: `Notification switch verified for ${user?.name || 'User'} (${user?.role || 'Guest'}).`,
                  type: 'info',
                  link: null,
                  is_read: 0
                };
                setToastNotif(sample);
                playNotificationChime();
              }}
              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-md border border-indigo-200 transition flex items-center gap-1"
              title="Test audio chime and floating banner"
            >
              <Volume2 className="w-3 h-3 text-indigo-600" /> Test Alert
            </button>
          </div>

        </div>
      )}

      {/* REAL-TIME FLOATING TOAST BANNER (Screen Pop-up) */}
      <AnimatePresence>
        {toastNotif && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border-2 border-indigo-500/50 p-4 flex items-start gap-3 pointer-events-auto"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-300">
                  New Campus Alert
                </span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <h4 className="text-xs font-black text-white truncate mt-0.5">
                {toastNotif.title}
              </h4>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mt-1">
                {toastNotif.message}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                {toastNotif.link && (
                  <button
                    onClick={() => {
                      handleItemClick(toastNotif);
                      setToastNotif(null);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
                <button
                  onClick={() => setToastNotif(null)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button
              onClick={() => setToastNotif(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
