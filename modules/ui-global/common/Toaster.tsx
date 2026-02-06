'use client';

import React from 'react';
import { useNotificationStore, Toast } from '@/modules/stores/notificationStore';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export const Toaster: React.FC = () => {
    const toasts = useNotificationStore((state) => state.toasts);
    const removeToast = useNotificationStore((state) => state.removeToast);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[30000] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getStyles = () => {
        switch (toast.type) {
            case 'error': return 'bg-red-500/10 border-red-500/20 text-red-100';
            case 'success': return 'bg-green-500/10 border-green-500/20 text-green-100';
            default: return 'bg-blue-500/10 border-blue-500/20 text-blue-100';
        }
    };

    return (
        <div
            className={`
        pointer-events-auto
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md
        shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300
        ${getStyles()}
      `}
            style={{ minWidth: '300px', maxWidth: '450px' }}
        >
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-grow text-sm font-medium">{toast.message}</div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
                <X className="w-4 h-4 opacity-70" />
            </button>
        </div>
    );
};
