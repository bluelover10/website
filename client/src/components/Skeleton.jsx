import { cn } from '../utils/cn.js';

export function Skeleton({ className }) {
  return <div className={cn('sf-skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="sf-card p-5">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-3 h-24 w-full" />
      <Skeleton className="mt-3 h-8 w-24" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export default Skeleton;
