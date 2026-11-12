import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Search, ArrowRight } from 'lucide-react';
import templateService from '../services/template.service.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';
import { cn } from '../utils/cn.js';

const categoryTints = {
  business: 'from-primary-500 to-primary-800',
  portfolio: 'from-accent-400 to-accent-700',
  blog: 'from-sky-500 to-sky-800',
  ecommerce: 'from-emerald-500 to-emerald-800',
  'landing page': 'from-violet-500 to-violet-800',
  general: 'from-slate-500 to-slate-800',
};

export function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const createWebsite = useWebsiteStore((s) => s.createWebsite);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    templateService.list()
      .then((res) => setTemplates(Array.isArray(res) ? res : res?.templates || res?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => templates.filter((t) => !q || t.name?.toLowerCase().includes(q.toLowerCase())),
    [templates, q]
  );

  const useTemplate = async (t) => {
    try {
      const site = await createWebsite({ name: `${t.name} site`, templateId: t._id || t.id });
      pushToast({ message: 'Site created from template', type: 'success' });
      navigate(`/websites/${site._id || site.id}/edit`);
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Templates</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start from a polished design — pages and blocks included.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" aria-label="Search templates" className="sf-input pl-9" />
        </div>
      </Reveal>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<LayoutTemplate size={30} />} title="No templates" description="Templates will appear here once added." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t, i) => {
            const tid = t._id || t.id;
            const category = (t.category || 'general').toLowerCase();
            return (
              <Reveal key={tid} delay={i * 60} direction="scale">
                <article className="group sf-card flex h-full flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-pop">
                  <div className={cn('relative h-40 overflow-hidden bg-gradient-to-br', categoryTints[category] || categoryTints.general)}>
                    <div className="pointer-events-none absolute inset-0 opacity-20 sf-canvas-grid" />
                    {t.thumbnail ? (
                      <img
                        src={t.thumbnail}
                        alt={t.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-swift group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <LayoutTemplate size={34} className="text-white/80 transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3">
                      <Badge variant="default" className="bg-white/90 capitalize text-slate-800 backdrop-blur">{t.category || 'General'}</Badge>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-display text-base font-bold tracking-tight">{t.name}</h2>
                    {t.description && <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500 dark:text-slate-400">{t.description}</p>}
                    <Button size="sm" variant="gradient" className="mt-4 w-full justify-center" onClick={() => useTemplate(t)}>
                      Use template <ArrowRight size={14} />
                    </Button>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Templates;
