import useUiStore from '../store/uiStore.js';

// Suspense fallback for lazy-loaded routes: minimal, brand-tinted, centered.
export function PageSpinner() {
  const darkMode = useUiStore((s) => s.darkMode);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" role="status" aria-label="Loading page">
      <span className="flex h-10 w-10 animate-pulse-soft items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 font-display text-base font-bold text-white shadow-glow">
        S
      </span>
      <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading…</span>
    </div>
  );
}

export default PageSpinner;
