import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  Truck, 
  X 
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'sparkle' | 'truck';

export interface ToastProps {
  message: string | null;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 4000,
  onClose
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  // Auto-detect type from message prefix if not explicitly provided
  let detectedType: ToastType = type || 'success';

  const lower = message.toLowerCase();
  if (lower.includes('error') || lower.includes('failed') || lower.includes('delete') || lower.includes('purged')) {
    if (lower.includes('error') || lower.includes('failed')) {
      detectedType = 'error';
    }
  } else if (lower.includes('warning') || lower.includes('please select') || lower.includes('specify')) {
    detectedType = 'warning';
  } else if (message.startsWith('⚡') || lower.includes('refill')) {
    detectedType = 'sparkle';
  } else if (message.startsWith('🚚') || lower.includes('truck') || lower.includes('gate pass') || lower.includes('trip')) {
    detectedType = 'truck';
  } else {
    detectedType = 'success';
  }

  const renderIcon = () => {
    switch (detectedType) {
      case 'error':
        return (
          <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'sparkle':
        return (
          <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'truck':
        return (
          <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        );
      case 'info':
        return (
          <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
      case 'success':
      default:
        return (
          <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      style={{ zIndex: 9999999 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto max-w-[90vw] sm:max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="bg-[#18181B]/95 dark:bg-[#18181B]/95 text-white border border-slate-700/80 shadow-2xl shadow-black/60 rounded-2xl px-4.5 py-3 flex items-center gap-3 text-xs font-semibold backdrop-blur-xl">
        {renderIcon()}
        <span className="text-slate-100 leading-snug break-words flex-1">
          {message}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>,
    document.body
  );
};
