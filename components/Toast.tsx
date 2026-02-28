import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

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

const TOAST_DURATION = 4;

const toastConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    label: '操作成功',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    label: '发生错误',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    label: '提示信息',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    label: '警告提醒',
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
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-4 pointer-events-none items-center w-full max-w-md px-4">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9, x: '-50%' }}
      animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
      exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      }}
      className="pointer-events-auto relative w-full"
    >
      {/* 明亮模式 - 拟物化风格 */}
      <div className="
        relative flex items-center gap-4 px-5 py-4 rounded-2xl
        bg-slate-100 
        border border-white/80
        transition-all duration-300
        dark:hidden
      " style={{
        boxShadow: `
          8px 8px 16px rgba(0, 0, 0, 0.08),
          -8px -8px 16px rgba(255, 255, 255, 0.9),
          inset 1px 1px 2px rgba(255, 255, 255, 0.5),
          inset -1px -1px 2px rgba(0, 0, 0, 0.03)
        `
      }}>
        <div 
          className={`
            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
            ${config.color}
          `}
          style={{
            boxShadow: `
              inset 2px 2px 4px rgba(0, 0, 0, 0.08),
              inset -2px -2px 4px rgba(255, 255, 255, 0.6)
            `,
            backgroundColor: 'rgba(0, 0, 0, 0.03)'
          }}
        >
          <Icon size={22} strokeWidth={2.5} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-700 text-sm">
            {config.label}
          </h4>
          <p className="text-sm text-slate-500 leading-snug mt-0.5 truncate">
            {toast.message}
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="flex-shrink-0 p-2 rounded-lg text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* 暗色模式 - 现代风格 */}
      <div className="
        hidden dark:flex items-center gap-4 px-5 py-4 rounded-2xl
        bg-slate-800/90 backdrop-blur-xl
        border border-white/5
        transition-all duration-300
      " style={{
        boxShadow: `
          0 4px 24px rgba(0, 0, 0, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `
      }}>
        <div className={`
          w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
          bg-slate-700/50
          ${config.color}
        `}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-200 text-sm">
            {config.label}
          </h4>
          <p className="text-sm text-slate-400 leading-snug mt-0.5 truncate">
            {toast.message}
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="flex-shrink-0 p-2 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  );
};
