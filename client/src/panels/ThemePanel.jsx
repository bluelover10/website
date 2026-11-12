// Global theme editor -> websiteStore.updateTheme (with direct-API fallback).
import React, { useState, useEffect } from 'react';
import { useWebsiteStore } from '../store/websiteStore';
import { updateWebsiteTheme } from '../services/page.service';

const DEFAULT_THEME = {
  primary: '#4f46e5', secondary: '#0ea5e9', background: '#ffffff', text: '#111827', accent: '#f59e0b',
  headingFont: 'Inter, system-ui, sans-serif', bodyFont: 'Inter, system-ui, sans-serif',
  baseSize: 16, containerWidth: 1200, radius: 8, buttonStyle: 'solid',
};

const FONTS = ['Inter, system-ui, sans-serif', 'Georgia, serif', 'DM Sans, sans-serif', 'Poppins, sans-serif', 'Space Grotesk, sans-serif', 'monospace'];

function ColorRow({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-2 mb-2">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="flex items-center gap-1.5">
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#4f46e5'} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded border cursor-pointer" />
        <input className="w-20 border rounded px-1.5 py-1 text-[11px] font-mono" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  );
}

export default function ThemePanel({ websiteId, theme: themeProp }) {
  const storeTheme = useWebsiteStore((s) => s.currentWebsite?.theme);
  const updateThemeStore = useWebsiteStore((s) => s.updateTheme);
  const [theme, setTheme] = useState({ ...DEFAULT_THEME, ...(storeTheme || themeProp || {}) });
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    if (storeTheme || themeProp) setTheme({ ...DEFAULT_THEME, ...(storeTheme || themeProp || {}) });
  }, [websiteId]); // eslint-disable-line

  const patch = async (p) => {
    const next = { ...theme, ...p };
    setTheme(next);
    try {
      // websiteStore.updateTheme(id, theme) — shell contract
      if (websiteId && updateThemeStore) await updateThemeStore(websiteId, next);
      else if (websiteId) await updateWebsiteTheme(websiteId, next);
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1200);
    } catch (e) { console.warn('theme save failed', e.message); }
  };

  return (
    <div className="p-3 overflow-auto h-full">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Colors</div>
      <ColorRow label="Primary" value={theme.primary} onChange={(v) => patch({ primary: v })} />
      <ColorRow label="Secondary" value={theme.secondary} onChange={(v) => patch({ secondary: v })} />
      <ColorRow label="Background" value={theme.background} onChange={(v) => patch({ background: v })} />
      <ColorRow label="Text" value={theme.text} onChange={(v) => patch({ text: v })} />
      <ColorRow label="Accent" value={theme.accent} onChange={(v) => patch({ accent: v })} />

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 mb-2">Typography</div>
      <label className="block mb-2"><span className="block text-[11px] text-slate-500 mb-1">Heading font</span>
        <select className="w-full border rounded-md px-2 py-1.5 text-xs" value={theme.headingFont} onChange={(e) => patch({ headingFont: e.target.value })}>
          {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
        </select>
      </label>
      <label className="block mb-2"><span className="block text-[11px] text-slate-500 mb-1">Body font</span>
        <select className="w-full border rounded-md px-2 py-1.5 text-xs" value={theme.bodyFont} onChange={(e) => patch({ bodyFont: e.target.value })}>
          {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
        </select>
      </label>
      <label className="block mb-2"><span className="block text-[11px] text-slate-500 mb-1">Base size: {theme.baseSize}px</span>
        <input type="range" min={12} max={22} value={theme.baseSize} onChange={(e) => patch({ baseSize: Number(e.target.value) })} className="w-full" />
      </label>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 mb-2">Layout</div>
      <label className="block mb-2"><span className="block text-[11px] text-slate-500 mb-1">Container width: {theme.containerWidth}px</span>
        <input type="range" min={720} max={1600} step={10} value={theme.containerWidth} onChange={(e) => patch({ containerWidth: Number(e.target.value) })} className="w-full" />
      </label>
      <label className="block mb-2"><span className="block text-[11px] text-slate-500 mb-1">Corner radius: {theme.radius}px</span>
        <input type="range" min={0} max={32} value={theme.radius} onChange={(e) => patch({ radius: Number(e.target.value) })} className="w-full" />
      </label>
      <label className="block mb-2"><span className="block text-[11px] text-slate-500 mb-1">Button style</span>
        <select className="w-full border rounded-md px-2 py-1.5 text-xs" value={theme.buttonStyle} onChange={(e) => patch({ buttonStyle: e.target.value })}>
          <option value="solid">Solid</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </label>

      {/* live preview */}
      <div className="mt-4 rounded-lg border p-3" style={{ background: theme.background, fontFamily: theme.bodyFont }}>
        <div className="text-sm font-bold" style={{ color: theme.text, fontFamily: theme.headingFont }}>Preview heading</div>
        <p className="text-xs mt-1" style={{ color: theme.text }}>Body text in {String(theme.bodyFont).split(',')[0]}.</p>
        <div className="flex gap-2 mt-2">
          <span className="text-[11px] font-semibold text-white px-2.5 py-1" style={{ background: theme.primary, borderRadius: theme.radius }}>Primary</span>
          <span className="text-[11px] font-semibold px-2.5 py-1 border" style={{ color: theme.secondary, borderColor: theme.secondary, borderRadius: theme.radius }}>Secondary</span>
        </div>
      </div>
      {savedTick && <div className="text-[11px] text-green-600 mt-2">Theme saved ✓</div>}
    </div>
  );
}
