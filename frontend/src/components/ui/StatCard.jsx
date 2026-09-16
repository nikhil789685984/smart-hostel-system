import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10 text-blue-600',
      border: 'hover:border-blue-300',
      badge: 'bg-blue-50 text-blue-700',
      accent: 'from-blue-600 to-indigo-600',
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-600',
      border: 'hover:border-emerald-300',
      badge: 'bg-emerald-50 text-emerald-700',
      accent: 'from-emerald-600 to-teal-600',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-600',
      border: 'hover:border-amber-300',
      badge: 'bg-amber-50 text-amber-700',
      accent: 'from-amber-500 to-orange-500',
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-600',
      border: 'hover:border-purple-300',
      badge: 'bg-purple-50 text-purple-700',
      accent: 'from-purple-600 to-pink-600',
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-600',
      border: 'hover:border-rose-300',
      badge: 'bg-rose-50 text-rose-700',
      accent: 'from-rose-600 to-red-600',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group ${c.border}`}
    >
      {/* Subtle top color glow line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`w-13 h-13 rounded-2xl ${c.bg} flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3.5 border-t border-slate-100/90 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium truncate max-w-[65%]">{subtitle}</span>
          {trend && (
            <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${c.badge}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
