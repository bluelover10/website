import { cn } from '../utils/cn.js';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('sf-card p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('mb-3 flex items-center justify-between', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('text-base font-semibold', className)}>{children}</h3>;
}

export default Card;
