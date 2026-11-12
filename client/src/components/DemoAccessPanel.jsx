// DemoAccessPanel — public demo credentials with copy + one-click fill.
// Rendered ONLY on the Login page (see pages/Login.jsx).
import { useState } from 'react';
import { Sparkles, Copy, Check, LogIn, ShieldCheck } from 'lucide-react';
import { DEMO_CREDENTIALS } from '../config/demo.js';
import useUiStore from '../store/uiStore.js';

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Non-fatal — the credentials are also visible as text.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-primary-600"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

export function DemoAccessPanel({ onUseDemo }) {
  const pushToast = useUiStore((s) => s.pushToast);

  const useDemo = () => {
    onUseDemo?.();
    pushToast({ message: 'Demo credentials filled — press Log in', type: 'info' });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary-200/70 bg-white/80 p-5 shadow-card backdrop-blur-md dark:border-primary-900/50 dark:bg-slate-900/70">
      {/* soft gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/70 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary-400/15 blur-2xl" />

      <div className="relative flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-xs">
          <Sparkles size={15} />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold leading-tight">Try the demo</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Explore SiteForge with a pre-built site.</p>
        </div>
      </div>

      <dl className="relative mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="min-w-0">
            <dt className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Email</dt>
            <dd className="truncate font-medium text-slate-800 dark:text-slate-100">{DEMO_CREDENTIALS.email}</dd>
          </div>
          <CopyButton value={DEMO_CREDENTIALS.email} label="demo email" />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="min-w-0">
            <dt className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Password</dt>
            <dd className="truncate font-medium text-slate-800 dark:text-slate-100">{DEMO_CREDENTIALS.password}</dd>
          </div>
          <CopyButton value={DEMO_CREDENTIALS.password} label="demo password" />
        </div>
      </dl>

      <button
        type="button"
        onClick={useDemo}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:shadow-glow active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <LogIn size={16} /> Use Demo Account
      </button>

      <p className="relative mt-3 flex items-start gap-1.5 text-2xs leading-relaxed text-slate-400 dark:text-slate-500">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" />
        Shared demo account — no personal data needed. Published demo site included.
      </p>
    </div>
  );
}

export default DemoAccessPanel;
