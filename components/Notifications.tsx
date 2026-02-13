
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const styles = {
    success: 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20',
    error: 'bg-red-600 text-white border-red-700 shadow-red-900/20',
    info: 'bg-blue-600 text-white border-blue-700 shadow-blue-900/20',
    warning: 'bg-orange-500 text-white border-orange-600 shadow-orange-900/20'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <ShieldAlert className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border-l-4 min-w-[320px] max-w-md animate-in slide-in-from-top-4 fade-in duration-300 relative overflow-hidden ${styles[notification.type]}`}>
      <div className="shrink-0 p-1 bg-white/20 rounded-full">{icons[notification.type]}</div>
      <p className="flex-1 text-sm font-bold tracking-tight leading-tight">{notification.message}</p>
      <button 
        onClick={() => onDismiss(notification.id)} 
        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
        {notifications.map(n => (
          <Toast key={n.id} notification={n} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};
