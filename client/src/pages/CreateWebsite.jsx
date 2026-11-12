import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LayoutTemplate, FilePlus2, Check } from 'lucide-react';
import { websiteSchema } from '../schemas/website.schema.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import templateService from '../services/template.service.js';
import { Input, Textarea, Select } from '../components/Input.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Reveal from '../components/Reveal.jsx';
import { slugify } from '../utils/slug.js';
import { cn } from '../utils/cn.js';

const categories = ['Business', 'Portfolio', 'Blog', 'Ecommerce', 'Landing page', 'Other'];

const modes = [
  { value: 'blank', label: 'Blank site', icon: FilePlus2 },
  { value: 'template', label: 'From template', icon: LayoutTemplate },
];

export function CreateWebsite() {
  const navigate = useNavigate();
  const createWebsite = useWebsiteStore((s) => s.createWebsite);
  const saving = useWebsiteStore((s) => s.saving);
  const pushToast = useUiStore((s) => s.pushToast);
  const [templates, setTemplates] = useState([]);
  const [mode, setMode] = useState('blank');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(websiteSchema),
    defaultValues: { name: '', slug: '', description: '', category: 'Business', templateId: '' },
  });

  const name = watch('name');
  // Auto-generate the slug from the site name, but never clobber manual edits.
  const slugTouched = useRef(false);

  useEffect(() => {
    if (!slugTouched.current) setValue('slug', slugify(name || ''));
  }, [name, setValue]);

  useEffect(() => {
    templateService.list().then((res) => {
      const list = Array.isArray(res) ? res : res?.templates || res?.items || [];
      setTemplates(list);
    }).catch(() => {});
  }, []);

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, templateId: mode === 'template' ? selectedTemplate || values.templateId : undefined };
      if (mode === 'template' && !payload.templateId) {
        pushToast({ message: 'Pick a template or choose blank', type: 'error' });
        return;
      }
      const site = await createWebsite(payload);
      const siteId = site._id || site.id;
      pushToast({ message: 'Website created', type: 'success' });
      navigate(`/websites/${siteId}/edit`);
    } catch (e) {
      pushToast({ message: e.message || 'Failed to create site', type: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Create website</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start from a blank canvas or a polished template.</p>
      </Reveal>

      {/* Segmented mode control */}
      <Reveal delay={70} className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {modes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
              mode === value
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </Reveal>

      <Reveal delay={140}>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Site name" placeholder="Acme Studio" error={errors.name?.message} {...register('name')} />
              <Input
                label="Slug"
                placeholder="acme-studio"
                className="[&_input]:font-mono"
                error={errors.slug?.message}
                {...register('slug', { onChange: () => { slugTouched.current = true; } })}
              />
            </div>
            <Textarea label="Description" placeholder="What is this site about?" rows={3} {...register('description')} />
            <Select label="Category" {...register('category')}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>

            {mode === 'template' && (
              <div className="animate-fade-up">
                <span className="sf-label">Choose template</span>
                <div role="radiogroup" aria-label="Template" className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {templates.length === 0 && (
                    <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                      No templates found. You can still create a blank site.
                    </p>
                  )}
                  {templates.map((t) => {
                    const tid = t._id || t.id;
                    const selected = selectedTemplate === tid;
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        key={tid}
                        onClick={() => setSelectedTemplate(tid)}
                        className={cn(
                          'group relative overflow-hidden rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card',
                          selected
                            ? 'border-primary-500 ring-2 ring-primary-500/40'
                            : 'border-slate-200 dark:border-slate-700'
                        )}
                      >
                        {t.thumbnail ? (
                          <img src={t.thumbnail} alt={t.name} className="h-24 w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-24 items-center justify-center bg-surface-3 dark:bg-slate-800">
                            <LayoutTemplate size={22} className="text-slate-400" />
                          </div>
                        )}
                        <p className="p-2 text-xs font-semibold">{t.name}</p>
                        {selected && (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white shadow-xs animate-scale-in">
                            <Check size={13} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => navigate('/websites')}>Cancel</Button>
              <Button type="submit" variant="gradient" loading={saving}>
                Create & open editor
              </Button>
            </div>
          </form>
        </Card>
      </Reveal>
    </div>
  );
}

export default CreateWebsite;
