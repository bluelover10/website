import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { buttonClasses } from './Button.jsx';

// Last-resort render guard. Without it, any component crash unmounts the whole
// React tree and the user is left staring at a blank page. This turns a crash
// into a recoverable, themed fallback with a way out.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface it for debugging; production error tracking can hook in here.
    console.error('[SiteForge] Unhandled render error:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const goHome = () => {
      window.location.assign('/dashboard');
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle size={26} />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The page hit an unexpected error. Try again — if it keeps happening, go back to the dashboard.
          </p>
          <p className="mt-3 truncate rounded-lg bg-slate-100 px-3 py-2 font-mono text-2xs text-slate-500 dark:bg-slate-800 dark:text-slate-400" title={String(error?.message || error)}>
            {String(error?.message || error)}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button onClick={() => this.setState({ error: null })} className={buttonClasses({ variant: 'primary' })}>
              <RotateCcw size={15} /> Try again
            </button>
            <button onClick={goHome} className={buttonClasses({ variant: 'outline' })}>
              <Home size={15} /> Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
