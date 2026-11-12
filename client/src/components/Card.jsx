import { cn } from '../utils/cn.js';

export function Card({ className, hoverable, children, ...props }) {
  return (
    <div
      className={cn(
        'sf-card p-5',
        hoverable && 'hover:-translate-y-0.5 hover:shadow-pop',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('mb-3 flex items-center justify-between', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('font-display text-base font-bold', className)}>{children}</h3>;
}

export default Card;
