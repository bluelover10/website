import { CheckCircle2, AlertCircle, Info, X, XCircle } from 'lucide-react';
import useUiStore from '../store/uiStore.js';
import { cn } from '../utils/cn.js';

const icons = {
  success: <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />,
  error: <XCircle size={18} className="shrink-0 text-red-500" />,
  warning: <AlertCircle size={18} className="shrink-0 text-amber-500" />,
  info: <Info size={18} className="shrink-0 text-primary-500" />,
};

const accents = {
  success: 'border-emerald-200 dark:border-emerald-900/60',
  error: 'border-red-200 dark:border-red-900/60',
  warning: 'border-amber-200 dark:border-amber-900/60',
  info: 'border-primary-200 dark:border-primary-900/60',
};

export function Toast({ toast }) {
  const dismissToast = useUiStore((s) => s.dismissToast);
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-pop animate-slide-in-right dark:bg-slate-900',
        accents[toast.type] || accents.info
      )}
    >
      {icons[toast.type] || icons.info}
      <p className="flex-1 pt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{toast.message}</p>
      <button
        onClick={() => dismissToast(toast.id)}
        className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex flex-col gap-2" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}

export default Toaster;
