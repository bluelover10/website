import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Trash2, Plus, Palette, Search as SeoIcon, Globe, AlertTriangle } from 'lucide-react';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import { Input, Textarea } from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Reveal from '../components/Reveal.jsx';
import ThemeProvider from '../components/ThemeProvider.jsx';

function SectionCard({ icon: Icon, title, children, action }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle>
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
              <Icon size={14} />
            </span>
            {title}
          </span>
        </CardTitle>
        {action}
      </div>
      {children}
    </Card>
  );
}

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
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: '', slug: '', description: '', seoTitle: '', seoDescription: '' },
  });
  const [primary, setPrimary] = useState('#5b4fd6');
  const [navLinks, setNavLinks] = useState([]);
  const [navSaving, setNavSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);

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
      setPrimary(currentWebsite.theme?.primary || '#5b4fd6');
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
    setThemeSaving(true);
    try {
      await updateTheme(siteId, { ...(currentWebsite?.theme || {}), primary });
      pushToast({ message: 'Theme updated', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    } finally {
      setThemeSaving(false);
    }
  };

  const onSaveNav = async () => {
    if (!siteId) return;
    setNavSaving(true);
    try {
      await updateNavigation(siteId, navLinks);
      pushToast({ message: 'Navigation saved', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    } finally {
      setNavSaving(false);
    }
  };

  const handleDelete = () => {
    if (!siteId) return;
    askConfirm({
      title: 'Delete this site?',
      message: 'This action is irreversible. All pages, versions and content will be lost.',
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
        <Reveal>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Site settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentWebsite?.name || 'Configure name, SEO, theme and navigation.'}</p>
        </Reveal>

        <Reveal delay={70}>
          <SectionCard icon={Globe} title="General">
            <form onSubmit={handleSubmit(onSaveGeneral)} className="space-y-3" noValidate>
              <Input label="Site name" {...register('name')} />
              <Input label="Slug" className="[&_input]:font-mono" {...register('slug')} />
              <Textarea label="Description" rows={3} {...register('description')} />
              <div className="flex justify-end">
                <Button type="submit" variant="gradient" loading={isSubmitting}>Save general</Button>
              </div>
            </form>
          </SectionCard>
        </Reveal>

        <Reveal delay={110}>
          <SectionCard icon={SeoIcon} title="SEO">
            <div className="space-y-3">
              <Input label="SEO title" {...register('seoTitle')} />
              <Textarea label="SEO description" rows={2} {...register('seoDescription')} />
              <div className="flex justify-end">
                <Button onClick={handleSubmit(onSaveGeneral)}>Save SEO</Button>
              </div>
            </div>
          </SectionCard>
        </Reveal>

        <Reveal delay={150}>
          <SectionCard icon={Palette} title="Theme">
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative h-10 w-16 cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700" aria-label="Primary color">
                <span className="absolute inset-1 rounded-md" style={{ background: primary }} />
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
              <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="max-w-[160px] font-mono" aria-label="Primary color hex value" />
              <div className="flex-1" />
              <Button onClick={onSaveTheme} loading={themeSaving}>Save theme</Button>
            </div>
          </SectionCard>
        </Reveal>

        <Reveal delay={190}>
          <SectionCard
            icon={Globe}
            title="Navigation"
            action={
              <Button size="sm" variant="outline" onClick={() => setNavLinks((s) => [...s, { label: 'New link', href: '#' }])}>
                <Plus size={14} /> Add link
              </Button>
            }
          >
            <div className="space-y-2">
              {navLinks.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700">No links yet — add one above.</p>
              )}
              {navLinks.map((l, i) => (
                <div key={i} className="flex gap-2 animate-fade-up">
                  <input
                    value={l.label}
                    onChange={(e) => setNavLinks((s) => s.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Label"
                    className="sf-input max-w-[180px]"
                    aria-label={`Link ${i + 1} label`}
                  />
                  <input
                    value={l.href}
                    onChange={(e) => setNavLinks((s) => s.map((x, xi) => (xi === i ? { ...x, href: e.target.value } : x)))}
                    placeholder="/about"
                    className="sf-input flex-1 font-mono"
                    aria-label={`Link ${i + 1} URL`}
                  />
                  <button onClick={() => setNavLinks((s) => s.filter((_, xi) => xi !== i))} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label="Remove link">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={onSaveNav} loading={navSaving}>Save navigation</Button>
            </div>
          </SectionCard>
        </Reveal>

        <Reveal delay={230}>
          <Card className="border-red-200 dark:border-red-900/50">
            <CardTitle>
              <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle size={15} /> Danger zone
              </span>
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Deleting a site removes its pages, versions and analytics permanently.</p>
            <Button variant="danger" className="mt-3" onClick={handleDelete}>Delete site</Button>
          </Card>
        </Reveal>
      </div>
    </ThemeProvider>
  );
}

export default SiteSettings;
