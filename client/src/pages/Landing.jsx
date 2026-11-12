import { Link } from 'react-router-dom';
import {
  Rocket, LayoutTemplate, MousePointerClick, Globe, ArrowRight, Check,
  BarChart3, History, Users, Sparkles,
} from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import { ButtonLink } from '../components/Button.jsx';

const features = [
  { icon: MousePointerClick, title: 'Visual drag & drop', text: 'Compose pages with sections, headings, galleries and forms — no code needed.' },
  { icon: LayoutTemplate, title: 'Starter templates', text: 'Launch faster from polished, responsive templates for any niche.' },
  { icon: Globe, title: 'One-click publish', text: 'Publish to a live URL with SEO meta, slugs and custom navigation.' },
  { icon: BarChart3, title: 'Built-in analytics', text: 'Track views by day and by page — real numbers, no guesswork.' },
  { icon: History, title: 'Version history', text: 'Snapshot anytime and roll back with a single click.' },
  { icon: Users, title: 'Team roles', text: 'Invite editors and viewers with precise, scoped permissions.' },
];

const steps = [
  { n: '01', title: 'Pick a canvas', text: 'Start blank or choose a template — pages and blocks come pre-built.' },
  { n: '02', title: 'Drag & drop', text: 'Arrange sections on the canvas and tune colors, fonts and radius live.' },
  { n: '03', title: 'Publish', text: 'One click takes your site live on its own URL with SEO tags ready.' },
];

const checkmarks = ['Free to start', 'No credit card', 'Publish instantly'];

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-surface-inv1 dark:text-slate-100">
      {/* ------------------------------- nav ------------------------------- */}
      <header className="sticky top-0 z-40 glass border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2.5" aria-label="SiteForge home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 font-display text-base font-bold text-white shadow-xs">S</span>
            <span className="font-display text-xl font-bold tracking-tight">SiteForge</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
            <Link to="/templates" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:block dark:text-slate-300 dark:hover:text-white">Templates</Link>
            <Link to="/login" className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Sign in</Link>
            <Link to="/register" className="inline-flex h-9 items-center rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-primary-500 hover:shadow-glow active:scale-[0.98]">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ------------------------------ hero ------------------------------ */}
        <section className="sf-hero-gradient relative overflow-hidden">
          {/* ambient blobs */}
          <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary-400/20 blur-3xl animate-float" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-accent-400/15 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 text-center md:pt-24">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-primary-700 shadow-xs backdrop-blur dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
                <Rocket size={13} /> No-code website builder
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
                Forge a stunning website
                <span className="block text-gradient">in minutes, not weeks.</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 md:text-lg dark:text-slate-400">
                Design visually, manage pages, media and forms, then publish instantly.
                SiteForge handles the heavy lifting so you can focus on your ideas.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink to="/register" variant="gradient" size="lg">Start building <ArrowRight size={16} /></ButtonLink>
                <ButtonLink to="/templates" variant="outline" size="lg">Browse templates</ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={340}>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                {checkmarks.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-500" /> {t}
                  </span>
                ))}
              </div>
            </Reveal>

            {/* floating product mock */}
            <Reveal delay={420} direction="scale" className="relative mx-auto mt-14 max-w-4xl">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-pop dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-1.5 px-2 pb-2" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-2xs text-slate-500 dark:bg-slate-800">siteforge.app/nova-creative</span>
                </div>
                <div className="overflow-hidden rounded-xl bg-surface-2 p-5 dark:bg-slate-950/60">
                  <div className="flex items-end justify-between gap-4">
                    <div className="space-y-2 text-left">
                      <div className="h-3 w-28 rounded-full bg-gradient-to-r from-primary-400 to-primary-600" />
                      <div className="h-8 w-56 rounded-lg bg-slate-200 font-display dark:bg-slate-800" />
                      <div className="h-2.5 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="flex gap-1.5 pt-1">
                        <div className="h-6 w-20 rounded-md bg-primary-600" />
                        <div className="h-6 w-20 rounded-md border border-slate-300 dark:border-slate-700" />
                      </div>
                    </div>
                    <div className="hidden h-24 w-40 rounded-xl bg-gradient-to-br from-accent-300 to-primary-400 opacity-80 sm:block" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------- features ---------------------------- */}
        <section className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="features-heading">
          <Reveal className="text-center">
            <h2 id="features-heading" className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to <span className="text-gradient">ship</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              A complete toolkit — editor, media, analytics and collaboration — in one dashboard.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 90} direction="up">
                <div className="group sf-card h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-pop">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/15 to-primary-500/5 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:text-primary-300">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------- how it works ------------------------- */}
        <section className="bg-surface-2 py-20 dark:bg-surface-inv2/60" aria-labelledby="how-heading">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center">
              <h2 id="how-heading" className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                Three steps to live
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 110} direction={i === 1 ? 'up' : i === 0 ? 'left' : 'right'}>
                  <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <span className="font-display text-4xl font-bold text-primary-200 dark:text-primary-800">{s.n}</span>
                    <h3 className="mt-2 font-display text-lg font-bold">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{s.text}</p>
                    {i < steps.length - 1 && (
                      <ArrowRight size={18} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-primary-300 md:block" aria-hidden="true" />
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------- CTA ------------------------------ */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal direction="scale">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-10 text-center text-white shadow-pop md:p-14">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" aria-hidden="true" />
              <Sparkles size={26} className="mx-auto text-accent-300" aria-hidden="true" />
              <h2 className="mx-auto mt-4 max-w-lg font-display text-3xl font-bold tracking-tight md:text-4xl">
                Ready to launch your site?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-primary-100/90">
                Create your first project and publish it today — free to start.
              </p>
              <Link to="/register" className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-primary-700 shadow-xs transition-all duration-200 hover:bg-primary-50 active:scale-[0.98]">
                Create a website <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ------------------------------ footer ----------------------------- */}
      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 sm:flex-row dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 font-display text-2xs font-bold text-white">S</span>
            <span>© 2026 SiteForge. All rights reserved.</span>
          </div>
          <nav className="flex gap-5" aria-label="Footer">
            <Link to="/templates" className="transition hover:text-slate-900 dark:hover:text-white">Templates</Link>
            <Link to="/login" className="transition hover:text-slate-900 dark:hover:text-white">Sign in</Link>
            <Link to="/register" className="transition hover:text-slate-900 dark:hover:text-white">Get started</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
