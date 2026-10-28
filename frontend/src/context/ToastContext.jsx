import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration = 4500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    warning: (msg, duration) => addToast('warning', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

function ToastContainer({ toasts, onClose }) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const configs = {
    success: {
      icon: CheckCircle2,
      borderColor: 'rgba(16, 185, 129, 0.35)',
      bgColor: 'linear-gradient(145deg, #0b1512 0%, #080d0c 100%)',
      iconColor: '#34d399',
      title: 'Success',
    },
    error: {
      icon: AlertCircle,
      borderColor: 'rgba(239, 68, 68, 0.35)',
      bgColor: 'linear-gradient(145deg, #170d0e 0%, #0e0809 100%)',
      iconColor: '#f87171',
      title: 'Error',
    },
    warning: {
      icon: AlertTriangle,
      borderColor: 'rgba(245, 158, 11, 0.35)',
      bgColor: 'linear-gradient(145deg, #17130b 0%, #0e0c08 100%)',
      iconColor: '#fbbf24',
      title: 'Attention',
    },
    info: {
      icon: Info,
      borderColor: 'rgba(56, 189, 248, 0.35)',
      bgColor: 'linear-gradient(145deg, #09131a 0%, #070c10 100%)',
      iconColor: '#38bdf8',
      title: 'Notice',
    },
  };

  const config = configs[toast.type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className="pointer-events-auto p-4 rounded-2xl shadow-2xl flex items-start gap-3 transition-all transform animate-in fade-in slide-in-from-top-3 duration-200"
      style={{
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
      }}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className="w-5 h-5" style={{ color: config.iconColor }} />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: config.iconColor }}>
          {config.title}
        </p>
        <p className="text-xs text-slate-200 leading-relaxed break-words font-medium">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
