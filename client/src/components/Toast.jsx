import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import useUiStore from '../store/uiStore.js';
import { cn } from '../utils/cn.js';

const icons = {
  success: <CheckCircle2 size={18} className="text-green-600" />,
  error: <AlertCircle size={18} className="text-red-600" />,
  info: <Info size={18} className="text-blue-600" />,
};

export function Toast({ toast }) {
  const dismissToast = useUiStore((s) => s.dismissToast);
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border bg-white px-4 py-3 shadow-pop dark:bg-slate-900 dark:border-slate-700',
        toast.type === 'error' && 'border-red-200',
        toast.type === 'success' && 'border-green-200'
      )}
    >
      {icons[toast.type] || icons.info}
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
        <X size={16} className="text-slate-400" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}

export default Toaster;
