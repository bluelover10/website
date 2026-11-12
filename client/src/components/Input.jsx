import { forwardRef, useId } from 'react';
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
