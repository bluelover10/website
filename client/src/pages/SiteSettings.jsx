import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Trash2, Plus } from 'lucide-react';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import { Input, Textarea } from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import ThemeProvider from '../components/ThemeProvider.jsx';

export function SiteSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentWebsite = useWebsiteStore((s) => s.currentWebsite);
  const fetchWebsite = useWebsiteStore((s) => s.fetchWebsite);
  const updateWebsite = useWebsiteStore((s) => s.updateWebsite);
  const updateTheme = useWebsiteStore((s) => s.updateTheme);
  const updateNavigation = useWebsiteStore((s) => s.updateNavigation);
  const deleteWebsite = useWebsiteStore((s) => s.deleteWebsite);
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  const [siteId, setSiteId] = useState(id);
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { name: '', slug: '', description: '', seoTitle: '', seoDescription: '' },
  });
  const [primary, setPrimary] = useState('#6366f1');
  const [navLinks, setNavLinks] = useState([]);

  useEffect(() => {
    if (id) {
      setSiteId(id);
      fetchWebsite(id).catch(() => {});
    }
  }, [id, fetchWebsite]);

  useEffect(() => {
    if (currentWebsite) {
      reset({
        name: currentWebsite.name || '',
        slug: currentWebsite.slug || '',
        description: currentWebsite.description || '',
        seoTitle: currentWebsite.seo?.title || '',
        seoDescription: currentWebsite.seo?.description || '',
      });
      setPrimary(currentWebsite.theme?.primary || '#6366f1');
      setNavLinks(currentWebsite.navigation || currentWebsite.nav || []);
    }
  }, [currentWebsite, reset]);

  const onSaveGeneral = async (values) => {
    if (!siteId) {
      pushToast({ message: 'Open settings from a specific site', type: 'error' });
      return;
    }
    try {
      await updateWebsite(siteId, {
        name: values.name,
        slug: values.slug,
        description: values.description,
        seo: { title: values.seoTitle, description: values.seoDescription },
      });
      pushToast({ message: 'Settings saved', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  const onSaveTheme = async () => {
    if (!siteId) return;
    try {
      await updateTheme(siteId, { ...(currentWebsite?.theme || {}), primary });
      pushToast({ message: 'Theme updated', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  const onSaveNav = async () => {
    if (!siteId) return;
    try {
      await updateNavigation(siteId, navLinks);
      pushToast({ message: 'Navigation saved', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  const handleDelete = () => {
    if (!siteId) return;
    askConfirm({
      title: 'Delete this site?',
      message: 'This action is irreversible. All pages and content will be lost.',
      danger: true,
      confirmLabel: 'Delete forever',
      onConfirm: async () => {
        try {
          await deleteWebsite(siteId);
          pushToast({ message: 'Site deleted', type: 'success' });
          navigate('/websites');
        } catch (e) {
          pushToast({ message: e.message, type: 'error' });
        }
      },
    });
  };

  return (
    <ThemeProvider theme={{ primary }}>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Site settings</h1>
          <p className="text-sm text-slate-500">{currentWebsite?.name || 'Configure name, SEO, theme and navigation.'}</p>
        </div>

        <Card>
          <CardTitle>General</CardTitle>
          <form onSubmit={handleSubmit(onSaveGeneral)} className="mt-3 space-y-3">
            <Input label="Site name" {...register('name')} />
            <Input label="Slug" {...register('slug')} />
            <Textarea label="Description" {...register('description')} />
            <div className="flex justify-end">
              <Button type="submit">Save general</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle>SEO</CardTitle>
          <div className="mt-3 space-y-3">
            <Input label="SEO title" {...register('seoTitle')} />
            <Textarea label="SEO description" {...register('seoDescription')} />
            <div className="flex justify-end">
              <Button onClick={handleSubmit(onSaveGeneral)}>Save SEO</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Theme</CardTitle>
          <div className="mt-3 flex items-center gap-3">
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-16 cursor-pointer rounded border" />
            <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="max-w-[160px]" />
            <div className="flex-1" />
            <Button onClick={onSaveTheme}>Save theme</Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Navigation</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => setNavLinks((s) => [...s, { label: 'New link', href: '#' }])}>
              <Plus size={14} /> Add link
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {navLinks.length === 0 && <p className="text-sm text-slate-500">No links yet.</p>}
            {navLinks.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input value={l.label} onChange={(e) => setNavLinks((s) => s.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))} placeholder="Label" className="sf-input" />
                <input value={l.href} onChange={(e) => setNavLinks((s) => s.map((x, xi) => (xi === i ? { ...x, href: e.target.value } : x)))} placeholder="/about" className="sf-input" />
                <button onClick={() => setNavLinks((s) => s.filter((_, xi) => xi !== i))} className="rounded p-2 hover:bg-red-50 hover:text-red-600" aria-label="Remove link">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={onSaveNav}>Save navigation</Button>
          </div>
        </Card>

        <Card className="border-red-200">
          <CardTitle>Danger zone</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Deleting a site cannot be undone.</p>
          <Button variant="danger" className="mt-3" onClick={handleDelete}>Delete site</Button>
        </Card>
      </div>
    </ThemeProvider>
  );
}

export default SiteSettings;
