import { cn } from '../utils/cn.js';

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-surface-2/60 p-10 text-center dark:border-slate-700 dark:bg-slate-900/50',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-500 dark:from-primary-900/40 dark:to-primary-950/40 dark:text-primary-300">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
