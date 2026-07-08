import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const TOAST_DURATION_MS = 4000;
const ANIMATION_DURATION_MS = 300;

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <CheckCircle size={20} />,
};

export default function Toast({ toast, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), ANIMATION_DURATION_MS);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  return (
    <div className={`toast toast-${toast.type} ${exiting ? 'toast-exit' : 'toast-enter'}`} role="alert">
      <span className="toast-icon">{iconMap[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-dismiss" onClick={handleDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const warning = useCallback((message: string) => addToast('warning', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);

  return { toasts, addToast, removeToast, success, error, warning, info };
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
