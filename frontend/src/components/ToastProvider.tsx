"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
    toasts: [],
    addToast: () => { },
    removeToast: () => { },
});

export function useToast() {
    return useContext(ToastContext);
}

let _nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, type: ToastType = "info") => {
            const id = _nextId++;
            setToasts((prev) => [...prev, { id, message, type }]);
            setTimeout(() => removeToast(id), 3500);
        },
        [removeToast]
    );

    const iconMap: Record<ToastType, string> = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
        warning: "⚠️",
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span className="toast-icon">{iconMap[t.type]}</span>
                        <span className="toast-message">{t.message}</span>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(t.id)}
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
