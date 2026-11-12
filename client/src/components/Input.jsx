import { forwardRef } from 'react';
import { cn } from '../utils/cn.js';

export const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="sf-label">{label}</label>}
      <input ref={ref} className="sf-input" {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className, ...props }, ref) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="sf-label">{label}</label>}
      <textarea ref={ref} className="sf-input min-h-[96px]" {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, className, children, ...props }, ref) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="sf-label">{label}</label>}
      <select ref={ref} className="sf-input" {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Input;
