import React, { useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Move } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) {
  const dragControls = useDragControls();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0.05}
          whileDrag={{ scale: 1.01, boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.45)', zIndex: 100 }}
          className={`relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-200`}
        >
          {/* Draggable Top Grip Bar */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="bg-slate-100 hover:bg-slate-200/90 py-1.5 px-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 cursor-grab active:cursor-grabbing border-b border-slate-200 select-none transition"
            title="Click and drag here to lift and move this window anywhere"
          >
            <span className="w-8 h-1 rounded-full bg-slate-300 inline-block"></span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black">
              <Move className="w-3 h-3 text-slate-500" /> Click & Drag to Move Window (Utha ke jahan marzi rakhein)
            </span>
            <span className="w-8 h-1 rounded-full bg-slate-300 inline-block"></span>
          </div>

          {/* Header - also draggable */}
          <div
            onPointerDown={(e) => {
              if (e.target.closest('button')) return;
              dragControls.start(e);
            }}
            className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 cursor-grab active:cursor-grabbing select-none"
          >
            <div>
              <h3 className="text-lg font-black text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
