import { Link } from 'react-router-dom';
import { Rocket, LayoutTemplate, MousePointerClick, Globe, ArrowRight, Check } from 'lucide-react';

const features = [
  { icon: MousePointerClick, title: 'Visual drag & drop', text: 'Compose pages with sections, headings, galleries and forms — no code needed.' },
  { icon: LayoutTemplate, title: 'Starter templates', text: 'Launch faster from polished, responsive templates for any niche.' },
  { icon: Globe, title: 'One-click publish', text: 'Publish to a live URL with SEO meta, slugs and version history built in.' },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 font-bold text-white">S</div>
          <span className="text-xl font-bold">SiteForge</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/templates" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300">Templates</Link>
          <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300">Sign in</Link>
          <Link to="/register" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Get started</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 text-center md:py-24">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-slate-500 dark:border-slate-700">
            <Rocket size={14} /> No-code website builder
          </div>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
            Forge a stunning website in minutes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Design visually, manage pages, media and forms, then publish instantly. SiteForge handles the heavy lifting.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700">
              Start building <ArrowRight size={16} />
            </Link>
            <Link to="/templates" className="rounded-xl border px-6 py-3 font-medium dark:border-slate-700">
              Browse templates
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-500">
            {['Free to start', 'No credit card', 'Publish instantly'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1"><Check size={14} className="text-green-600" />{t}</span>
            ))}
          </div>
        </section>

        <section className="grid gap-4 pb-16 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="sf-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </section>

        <section className="sf-card mb-16 flex flex-col items-center justify-between gap-4 p-8 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold">Ready to launch your site?</h2>
            <p className="text-slate-500">Create your first project and publish it today.</p>
          </div>
          <Link to="/websites/new" className="rounded-xl bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700">
            Create a website
          </Link>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-slate-500 dark:border-slate-800">
        © 2026 SiteForge. All rights reserved.
      </footer>
    </div>
  );
}

export default Landing;
