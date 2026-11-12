import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils/cn.js';

export const Input = forwardRef(function Input({ label, error, className, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  const errorId = `${id}-error`;
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="sf-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={label ? id : idProp}
        className={cn('sf-input', error && 'border-red-400 focus:border-red-500 focus:ring-red-500/25')}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

// Password field with a show/hide visibility toggle. Same contract as Input
// (label, error, forwarded ref for react-hook-form register) — the toggle is a
// real button with aria-pressed + aria-label so it is keyboard accessible.
export const PasswordInput = forwardRef(function PasswordInput(
  { label, error, className, id: idProp, ...props },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="sf-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        {/* `type` is declared after the spread so the toggle always wins. */}
        <input
          ref={ref}
          id={label ? id : idProp}
          className={cn('sf-input pr-10', error && 'border-red-400 focus:border-red-500 focus:ring-red-500/25')}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
          type={visible ? 'text' : 'password'}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:text-slate-200"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  const errorId = `${id}-error`;
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="sf-label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={label ? id : idProp}
        className={cn('sf-input min-h-[96px] resize-y', error && 'border-red-400 focus:border-red-500 focus:ring-red-500/25')}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, className, children, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  const errorId = `${id}-error`;
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="sf-label" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={label ? id : idProp}
        className={cn('sf-input pr-8', error && 'border-red-400 focus:border-red-500 focus:ring-red-500/25')}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

export default Input;
