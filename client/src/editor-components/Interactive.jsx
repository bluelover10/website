// Interactive: Button, ContactForm, FAQ
import React, { useState } from 'react';
import formService from '../services/form.service.js';

function px(v) { return typeof v === 'number' ? `${v}px` : v; }

// Theme-aware muted/border values (hardcoded slate grays break dark-themed
// published sites). --sf-* vars are always set by the Renderer wrapper.
const MUTED = 'color-mix(in srgb, var(--sf-text) 60%, transparent)';
const CARD_BORDER = '1px solid color-mix(in srgb, var(--sf-text) 12%, transparent)';
const CARD_BG = 'var(--sf-background, #ffffff)';
const TEXT = 'var(--sf-text, #111827)';

export function Button({ node, mode }) {
  const p = node.props || {};
  const edit = mode === 'edit';
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const href = p.href || '#';
  const external = /^https?:/i.test(href) || href.startsWith('//');
  return (
    <div style={{ display: 'flex', justifyContent: alignMap[p.align] || 'flex-start' }}>
      <a
        href={href}
        /* Edit mode: anchor default (# href) would scroll the page — block it. */
        onClick={edit ? (e) => e.preventDefault() : undefined}
        {...(external && !edit ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        style={{
          display: 'inline-block', background: p.background || 'var(--sf-primary, #5b4fd6)',
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

export function ContactForm({ node, website, mode }) {
  const p = node.props || {};
  const edit = mode === 'edit';
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const websiteId = website?._id || website?.id;

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    // A fresh typing session after success/error clears the stale status.
    setStatus((s) => (s === 'sent' || s === 'error' ? 'idle' : s));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (edit) return;
    if (!websiteId) { setStatus('error'); return; }
    setStatus('sending');
    try {
      // POST /api/websites/:websiteId/forms/submit — formId is required by the
      // server validator; the default matches DEFAULT_PROPS.contactForm.formId.
      await formService.submit(websiteId, { formId: p.formId || 'contact', data: form });
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ background: p.background || CARD_BG, borderRadius: 12, padding: 32, maxWidth: 560, margin: '0 auto', border: CARD_BORDER }}>
      {p.title && <h3 className="mb-1 text-xl font-bold" style={{ color: TEXT }}>{p.title}</h3>}
      {p.subtitle && <p className="mb-4 text-sm" style={{ color: MUTED }}>{p.subtitle}</p>}
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate={false}>
        <input
          className="sf-rendered-input"
          placeholder="Name"
          aria-label="Name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          required
        />
        <input
          className="sf-rendered-input"
          placeholder="Email"
          aria-label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => update({ email: e.target.value })}
          required
        />
        <textarea
          className="sf-rendered-input resize-y"
          placeholder="Message"
          aria-label="Message"
          rows={4}
          value={form.message}
          onChange={(e) => update({ message: e.target.value })}
          required
        />
        <button
          type="submit"
          disabled={status === 'sending' || edit}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          style={{ background: 'var(--sf-primary, #5b4fd6)' }}
        >
          {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✓' : (p.submitText || 'Send message')}
        </button>
        {/* Announced to screen readers; role switches error/alert vs polite status */}
        {status === 'error' && <p className="text-xs text-red-600 dark:text-red-400" role="alert">Could not submit. Try again later.</p>}
        {status === 'sent' && <p className="text-xs text-green-600 dark:text-green-400" role="status">Thanks — we got your message.</p>}
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
      {p.title && <h3 className="mb-6 text-center text-2xl font-bold" style={{ color: TEXT }}>{p.title}</h3>}
      <div className="flex flex-col gap-2">
        {items.map((it, i) => {
          const isOpen = open === i;
          const btnId = `faq-btn-${i}`;
          const bodyId = `faq-body-${i}`;
          return (
            <div key={i} className="overflow-hidden rounded-lg" style={{ border: CARD_BORDER, background: CARD_BG }}>
              <button
                type="button"
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
                style={{ color: TEXT }}
              >
                <span>{it.q}</span>
                <span aria-hidden="true" style={{ color: MUTED }}>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div
                  id={bodyId}
                  role="region"
                  aria-labelledby={btnId}
                  className="px-4 pb-3 text-sm"
                  style={{ color: MUTED }}
                >
                  {it.a}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-center text-sm text-slate-400">No questions yet</p>}
      </div>
    </div>
  );
}
