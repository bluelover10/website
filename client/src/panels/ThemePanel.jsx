// Global theme editor -> websiteStore.updateTheme (with direct-API fallback).
import React, { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { useWebsiteStore } from '../store/websiteStore';
import { updateWebsiteTheme } from '../services/page.service';
import useUiStore from '../store/uiStore';

const DEFAULT_THEME = {
  primary: '#5b4fd6', secondary: '#0ea5e9', background: '#ffffff', text: '#111827', accent: '#f59e0b',
  headingFont: 'Inter, system-ui, sans-serif', bodyFont: 'Inter, system-ui, sans-serif',
  baseSize: 16, containerWidth: 1200, radius: 8, buttonStyle: 'solid',
};

const FONTS = ['Inter, system-ui, sans-serif', 'Georgia, serif', 'DM Sans, sans-serif', 'Poppins, sans-serif', 'Space Grotesk, sans-serif', 'monospace'];

// Serialized save chain: network saves run one after another, so a slow or
// out-of-order response can never clobber a newer theme.
let saveChain = Promise.resolve();

function SectionLabel({ children }) {
  return <div className="mb-2 mt-4 text-2xs font-bold uppercase tracking-wider text-slate-400 first:mt-0">{children}</div>;
}

function ColorRow({ label, value, onChange }) {
  return (
    <label className="mb-2 flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="flex items-center gap-1.5">
        {/* span (not label) so it can sit inside the row label without nesting */}
        <span className="relative h-7 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
          <span className="absolute inset-1 rounded" style={{ background: value || '#5b4fd6' }} />
          <input
            type="color"
            aria-label={`Pick ${label.toLowerCase()} color`}
            value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#5b4fd6'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </span>
        <input className="w-20 rounded-md border border-slate-200 bg-white px-1.5 py-1 font-mono text-2xs dark:border-slate-700 dark:bg-slate-900" value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label={`${label} hex value`} />
      </span>
    </label>
  );
}

const selectCls = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-xs transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900';

export default function ThemePanel({ websiteId, theme: themeProp }) {
  const storeTheme = useWebsiteStore((s) => s.currentWebsite?.theme);
  const updateThemeStore = useWebsiteStore((s) => s.updateTheme);
  const [theme, setTheme] = useState({ ...DEFAULT_THEME, ...(storeTheme || themeProp || {}) });
  const [savedTick, setSavedTick] = useState(false);
  const saveTimerRef = useRef(null);
  const savedTimerRef = useRef(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    if (storeTheme || themeProp) setTheme({ ...DEFAULT_THEME, ...(storeTheme || themeProp || {}) });
  }, [websiteId]); // eslint-disable-line

  // Reset/cleanup: drop pending debounce + saved-tick timers on unmount.
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const persist = (next) => {
    saveChain = saveChain
      .then(async () => {
        if (!websiteId) return;
        // websiteStore.updateTheme(id, theme) — shell contract, direct-API fallback
        if (updateThemeStore) await updateThemeStore(websiteId, next);
        else await updateWebsiteTheme(websiteId, next);
        if (!aliveRef.current) return;
        setSavedTick(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          if (aliveRef.current) setSavedTick(false);
        }, 1200);
      })
      .catch(() => {
        useUiStore.getState().pushToast({ message: 'Theme save failed', type: 'error' });
      });
  };

  const patch = (p) => {
    // Edits apply instantly; the network save is debounced (500ms) + serialized.
    const next = { ...theme, ...p };
    setTheme(next);
    if (!websiteId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persist(next), 500);
  };

  return (
    <div className="h-full overflow-auto p-3">
      <SectionLabel>Colors</SectionLabel>
      <ColorRow label="Primary" value={theme.primary} onChange={(v) => patch({ primary: v })} />
      <ColorRow label="Secondary" value={theme.secondary} onChange={(v) => patch({ secondary: v })} />
      <ColorRow label="Background" value={theme.background} onChange={(v) => patch({ background: v })} />
      <ColorRow label="Text" value={theme.text} onChange={(v) => patch({ text: v })} />
      <ColorRow label="Accent" value={theme.accent} onChange={(v) => patch({ accent: v })} />

      <SectionLabel>Typography</SectionLabel>
      <label className="mb-2 block">
        <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Heading font</span>
        <select className={selectCls} value={theme.headingFont} onChange={(e) => patch({ headingFont: e.target.value })}>
          {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
        </select>
      </label>
      <label className="mb-2 block">
        <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Body font</span>
        <select className={selectCls} value={theme.bodyFont} onChange={(e) => patch({ bodyFont: e.target.value })}>
          {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
        </select>
      </label>
      <label className="mb-2 block">
        <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Base size: {theme.baseSize}px</span>
        <input type="range" min={12} max={22} value={theme.baseSize} onChange={(e) => patch({ baseSize: Number(e.target.value) })} className="w-full accent-[#5b4fd6]" />
      </label>

      <SectionLabel>Layout</SectionLabel>
      <label className="mb-2 block">
        <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Container width: {theme.containerWidth}px</span>
        <input type="range" min={720} max={1600} step={10} value={theme.containerWidth} onChange={(e) => patch({ containerWidth: Number(e.target.value) })} className="w-full accent-[#5b4fd6]" />
      </label>
      <label className="mb-2 block">
        <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Corner radius: {theme.radius}px</span>
        <input type="range" min={0} max={32} value={theme.radius} onChange={(e) => patch({ radius: Number(e.target.value) })} className="w-full accent-[#5b4fd6]" />
      </label>
      <label className="mb-2 block">
        <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Button style</span>
        <select className={selectCls} value={theme.buttonStyle} onChange={(e) => patch({ buttonStyle: e.target.value })}>
          <option value="solid">Solid</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </label>

      {/* Live preview */}
      <SectionLabel>
        <span className="flex items-center gap-1.5"><Palette size={11} /> Live preview</span>
      </SectionLabel>
      <div className="rounded-xl border border-slate-200 p-3 shadow-xs transition-all duration-300 dark:border-slate-800" style={{ background: theme.background, fontFamily: theme.bodyFont }}>
        <div className="text-sm font-bold" style={{ color: theme.text, fontFamily: theme.headingFont }}>Preview heading</div>
        <p className="mt-1 text-xs" style={{ color: theme.text }}>Body text in {String(theme.bodyFont).split(',')[0]}.</p>
        <div className="mt-2 flex gap-2">
          <span className="px-2.5 py-1 text-2xs font-semibold text-white" style={{ background: theme.primary, borderRadius: theme.radius }}>Primary</span>
          <span className="border px-2.5 py-1 text-2xs font-semibold" style={{ color: theme.secondary, borderColor: theme.secondary, borderRadius: theme.radius }}>Secondary</span>
        </div>
      </div>
      {savedTick && (
        <div className="mt-2 flex items-center gap-1 text-2xs font-medium text-emerald-600 animate-fade-in" role="status">
          <Check size={12} /> Theme saved
        </div>
      )}
    </div>
  );
}
