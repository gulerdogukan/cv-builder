import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface NotificationState {
  toasts: Toast[];
  confirmConfig: ConfirmConfig | null;
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  confirm: (config: ConfirmConfig) => void;
  closeConfirm: () => void;
}

// Toast timer'larını sakla — erken dismiss'te cleanup için (store dışında)
const _toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  confirmConfig: null,

  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto remove after 4 seconds — timer referansı saklanır
    const timer = setTimeout(() => {
      _toastTimers.delete(id);
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
    _toastTimers.set(id, timer);
  },

  removeToast: (id) => {
    // Bekleyen auto-remove timer'ını iptal et
    const timer = _toastTimers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      _toastTimers.delete(id);
    }
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  confirm: (config) => set({ confirmConfig: config }),
  
  closeConfirm: () => set({ confirmConfig: null }),
}));
