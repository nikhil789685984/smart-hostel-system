import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, User, Phone, CheckCircle2, AlertTriangle, Shield, Sparkles, Wifi, Wind } from 'lucide-react';

export default function BedVisualizer({ rooms = [], onSelectBed, isWarden = false }) {
  const [hoveredBed, setHoveredBed] = useState(null);

  return (
    <div className="space-y-6">
      {/* Legend & Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Live Bed Inventory:
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Vacant (Ready)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/60">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Occupied (Resident)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Under Maintenance
          </span>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          💡 Click any bed to {isWarden ? 'allocate or vacate' : 'inspect details'}
        </span>
      </motion.div>

      {/* Rooms Architectural Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {rooms.map((room, rIdx) => {
            const isFull = room.occupiedCount === room.capacity;
            const isMaintenance = room.room_status === 'maintenance';

            return (
              <motion.div
                key={room.room_id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: rIdx * 0.04 }}
                whileHover={{ y: -4 }}
                className={`glass-card rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-xl ${
                  isMaintenance
                    ? 'border-amber-200/80 bg-amber-50/20'
                    : isFull
                    ? 'border-slate-200/80 bg-white/90'
                    : 'border-blue-200/80 bg-gradient-to-b from-white to-blue-50/20'
                }`}
              >
                {/* Top Badge Strip */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                        {room.room_number}
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Floor {room.floor}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{room.block_name}</p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs ${
                        room.room_type === 'AC'
                          ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                          : room.room_type === 'Deluxe'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {room.room_type}
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-1 font-mono">
                      ₹{Number(room.fee_per_semester).toLocaleString()}<span className="text-[10px] text-slate-400 font-normal">/sem</span>
                    </p>
                  </div>
                </div>

                {/* Beds Visual Plan */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Bed className="w-3.5 h-3.5 text-blue-600" />
                      Beds ({room.occupiedCount}/{room.capacity})
                    </span>
                    <span className={`text-[11px] font-extrabold ${room.vacantCount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {room.vacantCount} Vacant
                    </span>
                  </div>

                  {/* Bed Blocks */}
                  <div className="grid grid-cols-2 gap-3">
                    {room.beds.map((bed) => {
                      const isVacant = bed.bed_status === 'vacant';
                      const isOccupied = bed.bed_status === 'occupied';
                      const isMaint = bed.bed_status === 'maintenance';

                      return (
                        <motion.div
                          key={bed.bed_id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectBed && onSelectBed(bed, room)}
                          onMouseEnter={() => setHoveredBed(bed)}
                          onMouseLeave={() => setHoveredBed(null)}
                          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                            isVacant
                              ? 'bg-emerald-500/10 border-emerald-300 hover:bg-emerald-500/20 shadow-xs'
                              : isOccupied
                              ? 'bg-blue-500/10 border-blue-200 hover:bg-blue-500/20 shadow-xs'
                              : 'bg-amber-500/10 border-amber-300'
                          }`}
                        >
                          {/* Top Pill */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              <Bed className={`w-3.5 h-3.5 ${isVacant ? 'text-emerald-600' : isOccupied ? 'text-blue-600' : 'text-amber-600'}`} />
                              {bed.bed_number}
                            </span>
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isVacant
                                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                                  : isOccupied
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                              }`}
                            />
                          </div>

                          {/* Resident Details or Action */}
                          <div className="mt-2.5 text-xs">
                            {isOccupied ? (
                              <div>
                                <p className="font-extrabold text-slate-900 truncate leading-tight text-[11px]">
                                  {bed.student_name || 'Resident'}
                                </p>
                                <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                                  {bed.roll_number || 'Registered'}
                                </p>
                              </div>
                            ) : isVacant ? (
                              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                {isWarden ? 'Allocate' : 'Available'}
                              </div>
                            ) : (
                              <span className="text-[11px] font-extrabold text-amber-700">Maintenance</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtle Room Amenities footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-blue-500" /> Gigabit Wi-Fi
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-cyan-500" /> {room.room_type}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
