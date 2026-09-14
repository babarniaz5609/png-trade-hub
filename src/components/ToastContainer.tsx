import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
            t.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300'
              : t.type === 'error'
              ? 'bg-slate-900/95 border-rose-500/40 text-rose-300'
              : 'bg-slate-900/95 border-blue-500/40 text-blue-300'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
          
          <div className="flex-1 text-xs leading-relaxed font-medium text-slate-100">
            {t.message}
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-white shrink-0 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
