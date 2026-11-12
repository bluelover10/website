// Interactive: Button, ContactForm, FAQ
import React, { useState } from 'react';
import formService from '../services/form.service.js';

function px(v) { return typeof v === 'number' ? `${v}px` : v; }

export function Button({ node }) {
  const p = node.props || {};
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  return (
    <div style={{ display: 'flex', justifyContent: alignMap[p.align] || 'flex-start' }}>
      <a
        href={p.href || '#'}
        style={{
          display: 'inline-block', background: p.background || 'var(--sf-primary, #4f46e5)',
          color: p.color || '#fff', borderRadius: px(p.radius ?? 8),
          padding: `${px(p.paddingY ?? 12)} ${px(p.paddingX ?? 24)}`,
          fontWeight: 600, textDecoration: 'none', fontSize: 15,
        }}
      >
        {p.text || 'Click me'}
      </a>
    </div>
  );
}

export function ContactForm({ node, website }) {
  const p = node.props || {};
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const websiteId = website?._id || website?.id;

  const submit = async (e) => {
    e.preventDefault();
    if (!websiteId) { setStatus('error'); return; }
    setStatus('sending');
    try {
      // POST /api/forms/:websiteId/submit (formService.submit targets /forms/:id/submit)
      await formService.submit(websiteId, { pageId: undefined, data: form });
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ background: p.background || '#fff', borderRadius: 12, padding: 32, maxWidth: 560, margin: '0 auto', border: '1px solid #e5e7eb' }}>
      {p.title && <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--sf-text, #111827)' }}>{p.title}</h3>}
      {p.subtitle && <p className="text-sm text-slate-500 mb-4">{p.subtitle}</p>}
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="border rounded-md px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="border rounded-md px-3 py-2 text-sm" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <textarea className="border rounded-md px-3 py-2 text-sm" placeholder="Message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        <button type="submit" disabled={status === 'sending'} className="rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--sf-primary, #4f46e5)' }}>
          {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✓' : (p.submitText || 'Send message')}
        </button>
        {status === 'error' && <p className="text-xs text-red-600">Could not submit. Try again later.</p>}
        {status === 'sent' && <p className="text-xs text-green-600">Thanks — we got your message.</p>}
      </form>
    </div>
  );
}

export function FAQ({ node }) {
  const p = node.props || {};
  const [open, setOpen] = useState(0);
  const items = Array.isArray(p.items) ? p.items : [];
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {p.title && <h3 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--sf-text, #111827)' }}>{p.title}</h3>}
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: '#e5e7eb', background: '#fff' }}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full text-left px-4 py-3 text-sm font-semibold flex justify-between items-center">
              <span>{it.q}</span><span className="text-slate-400">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <div className="px-4 pb-3 text-sm text-slate-600">{it.a}</div>}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400 text-center">No questions yet</p>}
      </div>
    </div>
  );
}
