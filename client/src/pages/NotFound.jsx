import { Compass, Home, LayoutDashboard } from 'lucide-react';
import { ButtonLink } from '../components/Button.jsx';

export function NotFound() {
  return (
    <div className="sf-hero-gradient flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="animate-fade-up">
        <p className="relative font-display text-[7rem] font-bold leading-none tracking-tight text-gradient sm:text-[9rem]" aria-hidden="true">
          404
        </p>
        <h1 className="sr-only">Page not found</h1>
        <div className="-mt-6 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <Compass size={16} className="text-primary-500" />
          <p className="text-sm font-medium">This page drifted off the canvas.</p>
        </div>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <ButtonLink to="/" variant="outline"><Home size={15} /> Home</ButtonLink>
          <ButtonLink to="/dashboard" variant="gradient"><LayoutDashboard size={15} /> Dashboard</ButtonLink>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
