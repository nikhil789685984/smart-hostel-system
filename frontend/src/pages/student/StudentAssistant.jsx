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
      source: 'grounded-engine'
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900">HostelGenie AI Assistant</h1>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-800 border border-indigo-200/80 flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" /> Grounded In Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time conversational intelligence for mess food, complaints, room transfers, and curfew rules.
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="glass-card rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col h-[70vh]">
        
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
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      isBot
                        ? 'bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-blue-500/20'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-3xl px-5 py-4 text-xs leading-relaxed shadow-sm ${
                      isBot
                        ? 'bg-white/95 border border-slate-200/90 text-slate-800'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25'
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                    
                    <div className={`mt-2.5 flex items-center gap-2 text-[10px] ${isBot ? 'text-slate-400' : 'text-blue-200'}`}>
                      <span>{msg.time}</span>
                      {msg.source && (
                        <span className="font-mono uppercase bg-slate-100/80 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                          {msg.source === 'gemini-ai' ? 'Gemini 1.5' : 'Verified DB'}
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
              <div className="bg-white border border-slate-200/90 rounded-3xl px-5 py-3.5 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                </span>
                <span className="font-semibold text-slate-600">HostelGenie is consulting live database...</span>
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
          className="p-4 bg-white border-t border-slate-200/80 flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about today's meal, complaint status, room transfer, gate curfew..."
            className="flex-1 px-4 py-3 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim() || loading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl shadow-lg shadow-blue-500/25 transition"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>

      </div>
    </div>
  );
}
