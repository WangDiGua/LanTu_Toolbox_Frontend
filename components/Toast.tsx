import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X, Sparkles, Zap, AlertOctagon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const TOAST_DURATION = 3;

const toastConfig = {
  success: {
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    icon: CheckCircle,
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  error: {
    gradient: 'from-red-500 to-rose-500',
    bgGradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
    icon: AlertOctagon,
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  info: {
    gradient: 'from-blue-500 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    icon: Zap,
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  warning: {
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    icon: AlertTriangle,
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const toastKey = `${type}_${message}_${Date.now()}`;
    
    setToasts((prev) => {
      return [...prev, { id: toastKey, message, type }];
    });
    
    setTimeout(() => {
      removeToast(toastKey);
    }, TOAST_DURATION * 1000);
  }, [removeToast]);

  const success = (msg: string) => showToast(msg, 'success');
  const error = (msg: string) => showToast(msg, 'error');
  const info = (msg: string) => showToast(msg, 'info');
  const warning = (msg: string) => showToast(msg, 'warning');

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none items-center">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const progressRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(4px)' }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        mass: 0.8
      }}
      className="pointer-events-auto relative group"
      style={{
        minWidth: '320px',
        maxWidth: '420px',
      }}
    >
      <div 
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${config.glowColor}, transparent 70%)`,
        }}
      />
      
      <div className={`
        relative flex items-center gap-3 px-4 py-3.5 rounded-xl
        bg-gradient-to-r ${config.bgGradient}
        backdrop-blur-xl
        border border-white/60 dark:border-white/10
        shadow-lg shadow-black/5 dark:shadow-black/20
        overflow-hidden
      `}>
        <div className={`
          absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-0
        `} />
        
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5">
          <motion.div 
            ref={progressRef}
            className={`h-full bg-gradient-to-r ${config.gradient}`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: TOAST_DURATION, ease: 'linear' }}
            style={{ transformOrigin: 'left' }}
          />
        </div>

        <div className={`
          relative flex-shrink-0 w-9 h-9 rounded-lg
          bg-gradient-to-br ${config.gradient}
          flex items-center justify-center
          shadow-lg
        `}>
          <Icon size={18} className="text-white" strokeWidth={2.5} />
        </div>
        
        <p className="relative flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
          {toast.message}
        </p>
        
        <button 
          onClick={onClose}
          className="relative flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:bg-white/10 dark:hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};
