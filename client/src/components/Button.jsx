import { Link } from 'react-router-dom';
import { cn } from '../utils/cn.js';

const variants = {
  primary:
    'bg-primary-600 text-white shadow-xs hover:bg-primary-500 hover:shadow-glow active:bg-primary-700',
  gradient:
    'bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-[length:150%_100%] text-white shadow-xs hover:bg-right hover:shadow-glow',
  secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  outline:
    'border border-slate-300 bg-transparent hover:border-primary-400 hover:bg-primary-50/50 dark:border-slate-700 dark:hover:border-primary-500 dark:hover:bg-primary-950/30',
  ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white shadow-xs hover:bg-red-500 active:bg-red-700',
};

const sizes = {
  xs: 'h-7 px-2.5 text-2xs gap-1',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  icon: 'h-9 w-9',
  'icon-sm': 'h-7 w-7',
};

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex select-none items-center justify-center rounded-lg font-semibold tracking-tight',
    'transition-all duration-200 ease-swift',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
    'active:scale-[0.98]',
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  loading,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

// Anchor styled as a button (use this instead of nesting <Button> inside <Link>).
export function ButtonLink({ to, variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <Link to={to} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}

export default Button;
