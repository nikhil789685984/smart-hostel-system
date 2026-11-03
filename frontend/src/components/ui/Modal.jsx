import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) {
  const dragRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Reset modal position when it opens
  useEffect(() => {
    if (isOpen) {
      posRef.current = { x: 0, y: 0 };
      if (dragRef.current) {
        dragRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
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
    // Only primary mouse button or touch
    if (e.button !== undefined && e.button !== 0) return;

    // Do NOT drag if clicking interactive elements
    if (e.target.closest('button, input, select, textarea, a, [role="button"], label')) {
      return;
    }

    isDraggingRef.current = true;
    const startX = e.clientX - posRef.current.x;
    const startY = e.clientY - posRef.current.y;

    if (dragRef.current) {
      dragRef.current.style.willChange = 'transform';
      dragRef.current.style.cursor = 'grabbing';
      dragRef.current.style.userSelect = 'none';
    }

    let rafId = null;

    const onPointerMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const nextX = moveEvent.clientX - startX;
      const nextY = moveEvent.clientY - startY;
      posRef.current = { x: nextX, y: nextY };

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (dragRef.current) {
            dragRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0px)`;
          }
          rafId = null;
        });
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (dragRef.current) {
        dragRef.current.style.willChange = 'auto';
        dragRef.current.style.cursor = '';
        dragRef.current.style.removeProperty('user-select');
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          ref={dragRef}
          style={{
            transform: 'translate3d(0px, 0px, 0px)',
            touchAction: 'none'
          }}
          className={`pointer-events-auto relative rounded-3xl bg-white text-left border border-slate-200 z-10 w-full ${maxWidth} sm:my-8 shadow-2xl overflow-hidden`}
        >
          {/* Header (Clean draggable title bar) */}
          <div
            onPointerDown={handlePointerDown}
            className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 cursor-grab active:cursor-grabbing select-none"
            title="Click & drag header to move window"
          >
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
