import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { websiteSchema } from '../schemas/website.schema.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import templateService from '../services/template.service.js';
import { Input, Textarea, Select } from '../components/Input.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { slugify } from '../utils/slug.js';
import { cn } from '../utils/cn.js';

const categories = ['Business', 'Portfolio', 'Blog', 'Ecommerce', 'Landing page', 'Other'];

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

  useEffect(() => {
    setValue('slug', slugify(name || ''));
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
      <div>
        <h1 className="text-2xl font-bold">Create website</h1>
        <p className="text-sm text-slate-500">Start blank or from a template.</p>
      </div>

      <div className="flex gap-2">
        {['blank', 'template'].map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn('rounded-lg border px-4 py-2 text-sm font-medium capitalize dark:border-slate-700', mode === m ? 'border-primary-600 bg-primary-50 text-primary-700' : '')}>
            {m === 'blank' ? 'Blank site' : 'From template'}
          </button>
        ))}
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Site name" placeholder="Acme Studio" error={errors.name?.message} {...register('name')} />
          <Input label="Slug" placeholder="acme-studio" error={errors.slug?.message} {...register('slug')} />
          <Textarea label="Description" placeholder="What is this site about?" {...register('description')} />
          <Select label="Category" {...register('category')}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>

          {mode === 'template' && (
            <div>
              <label className="sf-label">Choose template</label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {templates.length === 0 && <p className="col-span-full text-sm text-slate-500">No templates found. You can still create a blank site.</p>}
                {templates.map((t) => {
                  const tid = t._id || t.id;
                  return (
                    <button type="button" key={tid} onClick={() => setSelectedTemplate(tid)} className={cn('overflow-hidden rounded-xl border text-left dark:border-slate-700', selectedTemplate === tid && 'ring-2 ring-primary-600')}>
                      {t.thumbnail && <img src={t.thumbnail} alt={t.name} className="h-24 w-full object-cover" />}
                      <p className="p-2 text-xs font-medium">{t.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/websites')}>Cancel</Button>
            <Button type="submit" loading={saving}>Create & open editor</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CreateWebsite;
