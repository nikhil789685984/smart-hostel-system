import React, { useState } from 'react';
import Modal from './Modal';
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Printer,
  Phone,
  Droplet,
  Building,
  BedDouble,
  Sparkles,
  Wifi,
  Lock,
  Share2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DigitalIDCard({ student, isOpen, onClose }) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!student) return null;

  const name = student.name || student.student_name || 'Resident Student';
  const roll = student.roll_number || student.roll || '25CSE0204';
  const course = student.course || 'B.Tech';
  const branch = student.branch || student.branch_name || 'Computer Science & Engg.';
  const room = student.room_number ? `Room ${student.room_number}` : 'Room B-204';
  const block = student.block_name || student.block || 'Block B (Bhaskara)';
  const hostel = student.hostel_name || 'Himalaya Boys Hostel';
  const blood = student.blood_group || 'O+';
  const emergency = student.emergency_contact || student.father_phone || student.parent_phone || '+91 98765 11111';
  const status = student.status || 'active';
  const avatar = student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

  const fatherName = student.father_name || student.parent_name || 'Ramesh Sharma';
  const fatherPhone = student.father_phone || student.parent_phone || '+91 98765 11111';
  const motherName = student.mother_name || 'Sunita Sharma';
  const motherPhone = student.mother_phone || '+91 98765 22222';
  const city = student.city || 'New Delhi';
  const state = student.state || 'Delhi';
  const pincode = student.pincode || '110016';
  const aadhar = student.aadhar_number || '7712-4490-1823';
  const address = student.address_line || 'Green Park Enclave';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Physical Smart ID Pass"
      subtitle="Interactive RFID & QR Resident Identity Card"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        
        {/* Card Flip Container */}
        <div className="perspective-1000 min-h-[490px] flex items-center justify-center">
          <motion.div
            className="w-full relative cursor-pointer select-none"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            
            {/* FRONT OF ID CARD */}
            <div
              className={`w-full rounded-[24px] p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border-2 border-amber-400/50 relative overflow-hidden space-y-4 ${
                isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* Lanyard Slot Punch Cutout */}
              <div className="w-12 h-2.5 bg-slate-950 rounded-full border border-slate-700/60 mx-auto shadow-inner mb-1" />

              {/* Glossy Diagonal Reflection Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

              {/* Holographic Security Stamp */}
              <div className="absolute top-12 right-6 w-14 h-14 bg-gradient-to-r from-teal-400/20 via-purple-400/20 to-amber-300/30 rounded-full blur-md pointer-events-none" />

              {/* Card Header & Official Crest */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-400/20">
                    APEX
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-widest uppercase text-amber-300">Apex University</h4>
                    <p className="text-[9px] text-slate-300 font-extrabold uppercase tracking-widest">Official Resident Smart Card</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-sm ${
                    status.toLowerCase() === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Status: ACTIVE 🟢
                  </span>
                </div>
              </div>

              {/* Gold Chip & Contactless Wireless Symbol */}
              <div className="flex items-center justify-between relative z-10 py-1">
                {/* EMV Gold Smart Chip */}
                <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 border border-yellow-100 shadow-sm p-1 flex flex-col justify-between">
                  <div className="w-full h-1/3 border-b border-amber-700/40 flex justify-between">
                    <span className="w-1/3 border-r border-amber-700/40"></span>
                    <span className="w-1/3 border-r border-amber-700/40"></span>
                  </div>
                  <div className="w-full h-1/3 border-b border-amber-700/40"></div>
                </div>

                {/* Contactless Symbol */}
                <div className="flex items-center gap-1 text-amber-400/80 font-mono text-[10px]">
                  <Wifi className="w-5 h-5 rotate-90 text-amber-400" />
                  <span className="text-[9px] font-bold tracking-widest uppercase">RFID PASS</span>
                </div>
              </div>

              {/* Student Photo & Identity Metadata */}
              <div className="flex items-start gap-4 relative z-10 pt-1">
                {/* Photo Frame */}
                <div className="relative shrink-0">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-20 h-24 rounded-2xl object-cover border-2 border-amber-400/90 shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-1 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow tracking-wider uppercase">
                    VERIFIED
                  </div>
                </div>

                {/* Info Metadata */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                      {roll}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{course}</span>
                  </div>

                  <h3 className="text-base font-black text-white leading-tight uppercase tracking-tight truncate mt-1">
                    {name}
                  </h3>

                  <p className="text-[11px] text-slate-300 font-medium truncate">{branch}</p>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-white/10 text-amber-300 font-mono font-black text-xs border border-white/10 flex items-center gap-1 shadow-sm">
                      <BedDouble className="w-3.5 h-3.5 text-amber-400" />
                      {room}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-white/10 text-indigo-200 font-bold text-xs border border-white/10 flex items-center gap-1 shadow-sm">
                      <Building className="w-3.5 h-3.5 text-indigo-300" />
                      {block}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom QR Code & Hologram Banner */}
              <div className="p-3 rounded-2xl bg-white/95 text-slate-900 flex items-center justify-between shadow-lg relative z-10 border border-amber-400/40">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Universal Service Passcode</span>
                  <p className="text-[11px] font-black text-slate-900">Gate Entry • Mess • Services</p>
                  <span className="text-[9px] font-mono text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">
                    TOKEN #{roll}-2026
                  </span>
                </div>

                {/* SVG QR Code */}
                <div className="w-14 h-14 bg-slate-950 rounded-xl p-1 shrink-0 border border-slate-700 shadow-inner flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                    <rect x="0" y="0" width="30" height="30" fill="white" />
                    <rect x="5" y="5" width="20" height="20" fill="black" />
                    <rect x="10" y="10" width="10" height="10" fill="white" />
                    <rect x="70" y="0" width="30" height="30" fill="white" />
                    <rect x="75" y="5" width="20" height="20" fill="black" />
                    <rect x="80" y="10" width="10" height="10" fill="white" />
                    <rect x="0" y="70" width="30" height="30" fill="white" />
                    <rect x="5" y="75" width="20" height="20" fill="black" />
                    <rect x="10" y="80" width="10" height="10" fill="white" />
                    <rect x="40" y="10" width="15" height="15" fill="white" />
                    <rect x="40" y="40" width="20" height="20" fill="white" />
                    <rect x="70" y="40" width="15" height="25" fill="white" />
                    <rect x="10" y="45" width="20" height="15" fill="white" />
                    <rect x="40" y="70" width="25" height="20" fill="white" />
                    <rect x="75" y="75" width="15" height="15" fill="white" />
                  </svg>
                </div>
              </div>

              {/* Flip Hint Footer */}
              <div className="text-center pt-0.5 text-[9px] text-amber-200/80 font-bold tracking-wider uppercase flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 text-amber-400" /> Tap card to view magnetic strip & emergency details
              </div>

            </div>

            {/* BACK OF ID CARD */}
            <div
              className={`w-full rounded-[24px] p-6 bg-slate-950 text-white shadow-2xl border-2 border-indigo-500/40 absolute top-0 left-0 space-y-4 ${
                !isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
            >
              {/* Magnetic Stripe Tape */}
              <div className="w-full h-10 bg-black rounded-lg border-y border-slate-800 -mx-6 px-6 flex items-center justify-end">
                <span className="text-[8px] font-mono text-slate-500 tracking-widest">MAGNETIC RFID TRACK 1/2</span>
              </div>

              {/* Signature Strip */}
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Student Signature</span>
                <div className="w-full bg-slate-100 h-8 rounded-lg flex items-center justify-between px-3 text-slate-800 font-serif italic text-xs border border-slate-300">
                  <span>{name}</span>
                  <span className="font-mono text-[9px] text-slate-400 not-italic font-sans">SECURITY CODE: 8941</span>
                </div>
              </div>

              {/* Parent & Hometown Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Father's Name & Mobile</span>
                  <p className="font-bold text-white text-[10px] truncate">{fatherName}</p>
                  <p className="font-mono text-[9px] text-emerald-400 font-extrabold">{fatherPhone}</p>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Mother's Name & Mobile</span>
                  <p className="font-bold text-white text-[10px] truncate">{motherName}</p>
                  <p className="font-mono text-[9px] text-cyan-400 font-extrabold">{motherPhone}</p>
                </div>
              </div>

              {/* Hometown City/State & Aadhar */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] space-y-1">
                <div className="flex items-center justify-between text-[8px] uppercase tracking-wider font-bold text-slate-400">
                  <span>Hometown Address</span>
                  <span className="text-amber-300 font-mono">UIDAI: {aadhar}</span>
                </div>
                <p className="font-bold text-slate-200 truncate">{address}</p>
                <p className="text-[9px] text-emerald-300 font-extrabold">{city}, {state} - {pincode}</p>
              </div>

              {/* High Density Barcode */}
              <div className="text-center space-y-1 pt-1">
                <div className="bg-white p-2 rounded-xl text-slate-950 font-mono tracking-[0.3em] font-black text-xs border border-slate-700 shadow-inner">
                  ||| || | ||||| | |||||| | ||| || ||
                </div>
                <span className="text-[8px] font-mono text-slate-400">APEX-SMART-PASS-{roll}</span>
              </div>

              {/* Flip Back Hint */}
              <div className="text-center pt-0.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 text-amber-400" /> Tap card to return to Card Front
              </div>
            </div>

          </motion.div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" /> Flip Card (Front/Back)
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save Smart Pass
          </button>
        </div>

      </div>
    </Modal>
  );
}
