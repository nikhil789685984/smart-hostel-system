import React, { useState, useEffect, useRef } from 'react';
import { X, Move, RotateCcw } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  // Reset position to center whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

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

  const handlePointerDown = (e) => {
    // Only left mouse click or touch
    if (e.button !== undefined && e.button !== 0) return;

    // Do NOT drag if clicking an interactive control
    if (e.target.closest('button, input, select, textarea, a, [role="button"], label')) {
      return;
    }

    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      const nextX = moveEvent.clientX - startX;
      const nextY = moveEvent.clientY - startY;
      setPosition({ x: nextX, y: nextY });
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          ref={dragRef}
          onPointerDown={handlePointerDown}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0px)`,
            touchAction: 'none'
          }}
          className={`pointer-events-auto relative rounded-3xl bg-white text-left border border-slate-200 z-10 w-full ${maxWidth} sm:my-8 select-none transition-shadow ${
            isDragging
              ? 'shadow-[0_35px_70px_rgba(0,0,0,0.45)] cursor-grabbing scale-[1.01]'
              : 'shadow-2xl cursor-grab'
          }`}
        >
          {/* Draggable Top Grip Bar */}
          <div
            className={`py-2 px-5 flex items-center justify-between text-xs border-b border-slate-200 transition ${
              isDragging ? 'bg-amber-100 text-amber-950 font-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200/90 font-bold'
            }`}
          >
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>✋ Click & Drag anywhere to move window (Utha kar jahan marzi rakhein)</span>
            </div>

            {position.x !== 0 || position.y !== 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPosition({ x: 0, y: 0 });
                }}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-[11px] font-black text-slate-800 transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                title="Reset window back to center"
              >
                <RotateCcw className="w-3 h-3 text-slate-600" /> Center Window
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">↔️ Drag to move freely</span>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-black text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
