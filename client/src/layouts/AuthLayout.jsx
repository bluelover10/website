import { Link, Outlet } from 'react-router-dom';
import { MousePointerClick, LayoutTemplate, Rocket } from 'lucide-react';

const highlights = [
  { icon: MousePointerClick, text: 'Drag, drop, done — a real visual editor' },
  { icon: LayoutTemplate, text: 'Polished starter templates for any niche' },
  { icon: Rocket, text: 'Publish to a live URL in one click' },
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-surface-2 dark:bg-surface-inv1 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary-950 p-10 text-white lg:flex">
        {/* ambient shapes */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-accent-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-primary-400/20 blur-3xl" />

        <Link to="/" className="relative z-10 flex items-center gap-2.5 animate-fade-down">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-display text-lg font-bold backdrop-blur">S</span>
          <span className="font-display text-xl font-bold tracking-tight">SiteForge</span>
        </Link>

        <div className="relative z-10 max-w-md animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h2 className="font-display text-4xl font-bold leading-[1.1] tracking-tight">
            Build stunning websites
            <span className="block bg-gradient-to-r from-primary-200 via-white to-accent-300 bg-clip-text text-transparent">
              without writing code.
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-100/80">
            Design, publish and manage everything from one dashboard. Version history, analytics and
            team roles included.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm text-primary-100/90 animate-fade-up"
                style={{ animationDelay: `${240 + i * 110}ms` }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                  <Icon size={15} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-200/50">© 2026 SiteForge</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 font-display text-sm font-bold text-white">S</span>
            <span className="font-display text-lg font-bold">SiteForge</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-4 lg:pb-6 lg:pt-6">
          <div className="w-full max-w-md animate-fade-up">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
