import { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

/**
 * Reusable in-app confirmation modal replacing window.confirm().
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button when opened
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    // Escape key listener
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'rgba(239, 68, 68, 0.15)',
      iconColor: '#f87171',
      btnBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      btnHover: 'hover:brightness-110',
      btnShadow: '0 4px 18px rgba(220, 38, 38, 0.4)',
      btnText: '#ffffff',
    },
    warning: {
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: '#fbbf24',
      btnBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      btnHover: 'hover:brightness-110',
      btnShadow: '0 4px 18px rgba(217, 119, 6, 0.4)',
      btnText: '#ffffff',
    },
    primary: {
      iconBg: 'rgba(212, 136, 15, 0.15)',
      iconColor: '#e8a025',
      btnBg: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
      btnHover: 'hover:brightness-110',
      btnShadow: '0 4px 18px rgba(212, 136, 15, 0.4)',
      btnText: '#0a0c0f',
    },
  };

  const currentVariant = variantStyles[confirmVariant] || variantStyles.danger;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' }}
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          background: '#0f1219',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85)',
        }}
        className="rounded-3xl max-w-md w-full p-6 sm:p-7 relative transition-all shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Close Icon Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close dialog"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: currentVariant.iconBg }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: currentVariant.iconColor }} />
          </div>
          <div className="pt-1 pr-6">
            <h3
              id="confirm-modal-title"
              className="text-lg font-bold text-white leading-tight"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {title}
            </h3>
            <p
              id="confirm-modal-desc"
              className="text-xs text-slate-300 mt-2 leading-relaxed"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: currentVariant.btnBg,
              color: currentVariant.btnText,
              fontWeight: 700,
              boxShadow: currentVariant.btnShadow,
            }}
            className={`px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${currentVariant.btnHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
