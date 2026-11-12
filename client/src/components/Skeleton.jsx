import { cn } from '../utils/cn.js';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800', className)} />;
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

export default Skeleton;
