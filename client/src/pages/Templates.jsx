import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Search } from 'lucide-react';
import templateService from '../services/template.service.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';

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

  const filtered = templates.filter((t) => !q || t.name?.toLowerCase().includes(q.toLowerCase()));

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-slate-500">Start from a polished design.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" className="sf-input pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<LayoutTemplate size={32} />} title="No templates" description="Templates will appear here once added." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {filtered.map((t) => {
            const tid = t._id || t.id;
            return (
              <Card key={tid} className="overflow-hidden p-0">
                {t.thumbnail ? <img src={t.thumbnail} alt={t.name} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-slate-100 dark:bg-slate-800"><LayoutTemplate className="text-slate-400" /></div>}
                <div className="p-4">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.category || 'General'}</p>
                  <Button size="sm" className="mt-3 w-full" onClick={() => useTemplate(t)}>Use template</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Templates;
