"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast mora biti unutar <ToastProvider>");
  return ctx;
}

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback((message, options = {}) => {
    const id = ++idCounter;
    const { type = "info", duration = 4000, action = null } = options;

    setToasts((prev) => [...prev, { id, message, type, action }]);

    if (duration > 0) {
      const timer = setTimeout(() => remove(id), duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [remove]);

  const toast = {
    success: (msg, opts) => show(msg, { ...opts, type: "success" }),
    error: (msg, opts) => show(msg, { ...opts, type: "error", duration: opts?.duration ?? 6000 }),
    info: (msg, opts) => show(msg, { ...opts, type: "info" }),
    custom: show,
    dismiss: remove,
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" role="region" aria-label="Notifikacije">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { type, message, action } = toast;

  const ikona = {
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
  }[type];

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">{ikona}</span>
      <div className="toast-body">
        <div className="toast-message">{message}</div>
        {action && (
          <button
            className="toast-action"
            onClick={() => {
              action.onClick?.();
              onDismiss();
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button className="toast-close" onClick={onDismiss} aria-label="Zatvori">
        <X size={14} />
      </button>
    </div>
  );
}