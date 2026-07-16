import { createContext, useCallback, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { accent, body, closeButton, description, title, toast, viewport } from "./Toast.css";

export type ToastVariant = keyof typeof accent;

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children?: ReactNode }): ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (options: ToastOptions) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, ...options }]);
      const duration = options.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(() => ({ toast: pushToast, dismiss }), [pushToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={viewport} role="region" aria-label="Notifications">
          {toasts.map((item) => (
            <div key={item.id} className={`${toast} ${accent[item.variant ?? "default"]}`} role="status">
              <div className={body}>
                <p className={title}>{item.title}</p>
                {item.description ? <p className={description}>{item.description}</p> : null}
              </div>
              <button
                type="button"
                className={closeButton}
                aria-label="Dismiss"
                onClick={() => dismiss(item.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
