import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

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

const toastStyles = {
  success: {
    iconColor: '#22c55e',
    accentBorder: '#22c55e',
  },
  error: {
    iconColor: '#ef4444',
    accentBorder: '#ef4444',
  },
  info: {
    iconColor: '#3b82f6',
    accentBorder: '#3b82f6',
  },
  warning: {
    iconColor: '#f59e0b',
    accentBorder: '#f59e0b',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const toastKey = `${type}_${message}`;
    
    setToasts((prev) => {
      const existing = prev.find(t => t.id === toastKey);
      if (existing) {
        return prev;
      }
      
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
      <div style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
        alignItems: 'center',
      }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const styles = toastStyles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      }}
      style={{
        pointerEvents: 'auto',
        minWidth: '300px',
        maxWidth: '400px',
        padding: '12px 16px',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ 
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        backgroundColor: styles.accentBorder,
      }} />
      
      <div style={{ 
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        backgroundColor: `${styles.iconColor}12`,
      }}>
        {toast.type === 'success' && <CheckCircle size={18} color={styles.iconColor} strokeWidth={2.5} />}
        {toast.type === 'error' && <AlertCircle size={18} color={styles.iconColor} strokeWidth={2.5} />}
        {toast.type === 'info' && <Info size={18} color={styles.iconColor} strokeWidth={2.5} />}
        {toast.type === 'warning' && <AlertTriangle size={18} color={styles.iconColor} strokeWidth={2.5} />}
      </div>
      
      <div style={{ 
        flex: 1, 
        fontSize: '14px', 
        fontWeight: 500, 
        color: '#1f2937',
        lineHeight: '1.5',
      }}>
        {toast.message}
      </div>
    </motion.div>
  );
};
