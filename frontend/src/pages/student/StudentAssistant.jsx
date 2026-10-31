import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Clock,
  UtensilsCrossed,
  AlertCircle,
  Building,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function StudentAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello ${user?.name || 'Resident'}! I am HostelGenie, your smart AI resident assistant. I'm connected to the campus database and have real-time information about your room, today's dining schedule, pending maintenance tickets, and campus regulations. How can I assist you today?`,
      time: 'Just now',
      source: 'gemini-ai'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const quickPrompts = [
    { label: "What is today's dinner?", icon: UtensilsCrossed },
    { label: "Check my complaint status", icon: AlertCircle },
    { label: "How do I request a room change?", icon: Building },
    { label: "What are the hostel curfew timings?", icon: Clock },
    { label: "Who is my roommate?", icon: User },
    { label: "What notices were posted recently?", icon: Sparkles },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageToSend) => {
    const text = messageToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.aiChat(text);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.reply || "I'm sorry, I couldn't process that request right now.",
        source: res.source,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I encountered an issue connecting to the campus database. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Premium Header */}
      <div className="flex flex-col items-center text-center space-y-3 mb-6 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-blue-400 via-purple-500 to-rose-400 animate-pulse rounded-full" />
          <div className="w-16 h-16 rounded-full bg-white border border-white/40 shadow-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-purple-50/80" />
            <Bot className="w-7 h-7 text-indigo-600 relative z-10" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 tracking-tight">HostelGenie Intelligence</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Database Connected
          </p>
        </div>
      </div>

      {/* Chat Container */}
      
      {/* Immersive Chat Container */}
      <div className="relative rounded-[2rem] border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col h-[72vh] bg-white/70 backdrop-blur-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-start gap-3.5 ${isBot ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                      isBot
                        ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-purple-500/30'
                        : 'bg-slate-900 text-white shadow-slate-900/20'
                    }`}
                  >
                    {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 text-[13px] leading-relaxed shadow-sm ${
                      isBot
                        ? 'bg-white border border-slate-100 text-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-tl-sm'
                        : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-tr-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                    
                    <div className={`mt-2.5 flex items-center gap-2 text-[10px] ${isBot ? 'text-slate-400' : 'text-blue-200'}`}>
                      <span>{msg.time}</span>
                      {msg.source && (
                        <span className="font-mono uppercase bg-slate-100/80 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                          {msg.source === 'gemini-ai' ? 'Gemini 3.8 Pro' : 'Verified DB'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl rounded-tl-sm px-5 py-3.5 text-xs text-slate-500 flex items-center gap-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <span className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:0.3s]"></span>
                </span>
                <span className="font-semibold text-slate-600">Generating intelligent response...</span>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Prompts:
          </span>
          {quickPrompts.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSend(p.label)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <Icon className="w-3.5 h-3.5 text-blue-600" />
                <span>{p.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-transparent border-t border-slate-200/40"
        >
          <div className="relative flex items-center max-w-3xl mx-auto bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all duration-300">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your hostel..."
              className="flex-1 px-5 py-3 text-sm bg-transparent focus:outline-none text-slate-700 font-medium placeholder-slate-400"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!input.trim() || loading}
              className="p-3.5 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-full shadow-md transition-colors mr-1"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </motion.button>
          </div>
        </form>

      </div>
    </div>
  );
}
