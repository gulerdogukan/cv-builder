import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/stores/notificationStore';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog() {
  const { confirmConfig, closeConfirm } = useNotificationStore();

  // NOTE: return null is intentionally removed.
  // AnimatePresence must always be mounted to animate exit transitions.
  // Conditional rendering is moved inside AnimatePresence via {confirmConfig && ...}.

  const handleConfirm = () => {
    if (!confirmConfig) return;
    confirmConfig.onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (!confirmConfig) return;
    if (confirmConfig.onCancel) confirmConfig.onCancel();
    closeConfirm();
  };

  return (
    <AnimatePresence>
      {confirmConfig && (
        <div key="confirm-dialog" className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmConfig.variant === 'danger' ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    {confirmConfig.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {confirmConfig.message}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  {confirmConfig.cancelLabel || 'İptal'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-lg transition-all active:scale-95 ${
                    confirmConfig.variant === 'danger'
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                      : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                  }`}
                >
                  {confirmConfig.confirmLabel || 'Onayla'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
