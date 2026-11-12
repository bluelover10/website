// Properties editor for the selected node. Calls editorStore.updateNode.
import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { findNode } from '../editor/EditorUtils';

function Row({ label, children }) {
  return (
    <label className="block mb-2.5">
      <span className="block text-[11px] font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
const ti = 'w-full border rounded-md px-2 py-1.5 text-xs';

function TextInput({ value, onChange, placeholder }) {
  return <input className={ti} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}
function TextArea({ value, onChange, rows = 3 }) {
  return <textarea className={ti} rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
}
function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#4f46e5'} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border cursor-pointer p-0.5" />
      <input className={ti} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
    </div>
  );
}
function RangeInput({ value, min = 0, max = 200, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" min={min} max={max} value={Number(value) || 0} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
      <input type="number" className="w-16 border rounded-md px-1.5 py-1 text-xs" value={Number(value) || 0} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
function SelectInput({ value, options, onChange }) {
  return (
    <select className={ti} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

export default function RightPanel() {
  const tree = useEditorStore((s) => s.tree);
  const selectedId = useEditorStore((s) => s.selectedId);
  const updateNode = useEditorStore((s) => s.updateNode);
  const node = selectedId ? findNode(tree, selectedId) : null;

  if (!node) {
    return <div className="p-4 text-xs text-slate-500">Select a block on the canvas to edit its properties. Drag new blocks from the left panel.</div>;
  }
  const p = node.props || {};
  const set = (patch) => updateNode(node.id, patch);
  const setList = (key, idx, patch) => {
    const list = [...(p[key] || [])];
    list[idx] = { ...list[idx], ...patch };
    set({ [key]: list });
  };

  return (
    <div className="p-3 overflow-auto h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{node.type}</span>
        <span className="font-mono text-[10px] text-slate-300">{node.id.slice(-6)}</span>
      </div>

      {(node.type === 'heading' || node.type === 'text' || node.type === 'link' || node.type === 'button') && (
        <>
          <Row label="Content / Text"><TextArea value={p.content ?? p.text} onChange={(v) => set(node.type === 'button' || node.type === 'link' ? { text: v } : { content: v })} /></Row>
          {node.type === 'heading' && (
            <Row label="Level"><SelectInput value={p.level || 'h2'} options={['h1', 'h2', 'h3', 'h4', 'h5', 'h6']} onChange={(v) => set({ level: v })} /></Row>
          )}
          {(node.type === 'link' || node.type === 'button') && (
            <Row label="Link href (URL or ?page=slug)"><TextInput value={p.href} onChange={(v) => set({ href: v })} /></Row>
          )}
          <Row label="Font size"><RangeInput value={p.fontSize ?? 16} min={10} max={96} onChange={(v) => set({ fontSize: v })} /></Row>
          {node.type === 'heading' && (
            <Row label="Font weight"><SelectInput value={String(p.fontWeight ?? 700)} options={['400', '500', '600', '700', '800']} onChange={(v) => set({ fontWeight: Number(v) })} /></Row>
          )}
          <Row label="Align"><SelectInput value={p.align || 'left'} options={['left', 'center', 'right']} onChange={(v) => set({ align: v })} /></Row>
          <Row label="Color"><ColorInput value={p.color} onChange={(v) => set({ color: v })} /></Row>
          {(node.type === 'heading' || node.type === 'text') && (
            <Row label="Line height"><RangeInput value={(p.lineHeight ?? 1.5) * 10} min={10} max={30} onChange={(v) => set({ lineHeight: v / 10 })} /></Row>
          )}
        </>
      )}

      {node.type === 'image' && (
        <>
          <Row label="Image URL"><TextInput value={p.src} onChange={(v) => set({ src: v })} /></Row>
          <div className="mb-2 rounded overflow-hidden border"><img src={p.src} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} /></div>
          <Row label="Alt text"><TextInput value={p.alt} onChange={(v) => set({ alt: v })} /></Row>
          <Row label="Width"><TextInput value={p.width} onChange={(v) => set({ width: v })} /></Row>
          <Row label="Fit"><SelectInput value={p.fit || 'cover'} options={['cover', 'contain', 'fill', 'none']} onChange={(v) => set({ fit: v })} /></Row>
          <Row label="Corner radius"><RangeInput value={p.radius ?? 8} min={0} max={48} onChange={(v) => set({ radius: v })} /></Row>
        </>
      )}

      {node.type === 'video' && (
        <>
          <Row label="Video URL (YouTube)"><TextInput value={p.src} onChange={(v) => set({ src: v })} /></Row>
          <Row label="Aspect"><SelectInput value={p.aspect || '16/9'} options={['16/9', '4/3', '1/1', '21/9']} onChange={(v) => set({ aspect: v })} /></Row>
          <Row label="Corner radius"><RangeInput value={p.radius ?? 12} min={0} max={48} onChange={(v) => set({ radius: v })} /></Row>
        </>
      )}

      {node.type === 'gallery' && (
        <>
          <Row label="Images (one URL per line)"><TextArea rows={4} value={(p.images || []).join('\n')} onChange={(v) => set({ images: v.split('\n').map((s) => s.trim()).filter(Boolean) })} /></Row>
          <Row label="Columns"><RangeInput value={p.columns ?? 3} min={1} max={6} onChange={(v) => set({ columns: v })} /></Row>
          <Row label="Gap"><RangeInput value={p.gap ?? 12} min={0} max={48} onChange={(v) => set({ gap: v })} /></Row>
          <Row label="Corner radius"><RangeInput value={p.radius ?? 8} min={0} max={48} onChange={(v) => set({ radius: v })} /></Row>
        </>
      )}

      {node.type === 'button' && (
        <>
          <Row label="Background"><ColorInput value={p.background} onChange={(v) => set({ background: v })} /></Row>
          <Row label="Text color"><ColorInput value={p.color} onChange={(v) => set({ color: v })} /></Row>
          <Row label="Corner radius"><RangeInput value={p.radius ?? 8} min={0} max={48} onChange={(v) => set({ radius: v })} /></Row>
          <Row label="Padding X"><RangeInput value={p.paddingX ?? 24} min={0} max={96} onChange={(v) => set({ paddingX: v })} /></Row>
          <Row label="Padding Y"><RangeInput value={p.paddingY ?? 12} min={0} max={48} onChange={(v) => set({ paddingY: v })} /></Row>
        </>
      )}

      {(node.type === 'section' || node.type === 'container' || node.type === 'card') && (
        <>
          <Row label="Background"><ColorInput value={p.background} onChange={(v) => set({ background: v })} /></Row>
          <Row label="Padding"><RangeInput value={p.padding ?? 24} min={0} max={160} onChange={(v) => set({ padding: v })} /></Row>
          <Row label="Max width"><RangeInput value={p.maxWidth ?? 1200} min={320} max={1600} onChange={(v) => set({ maxWidth: v })} /></Row>
          <Row label="Corner radius"><RangeInput value={p.radius ?? 0} min={0} max={48} onChange={(v) => set({ radius: v })} /></Row>
          {node.type === 'container' && (
            <>
              <Row label="Direction"><SelectInput value={p.direction || 'column'} options={['column', 'row']} onChange={(v) => set({ direction: v })} /></Row>
              <Row label="Gap"><RangeInput value={p.gap ?? 16} min={0} max={64} onChange={(v) => set({ gap: v })} /></Row>
            </>
          )}
          {node.type === 'card' && (
            <>
              <Row label="Title"><TextInput value={p.title} onChange={(v) => set({ title: v })} /></Row>
              <Row label="Description"><TextArea value={p.description} onChange={(v) => set({ description: v })} /></Row>
              <Row label="Card image URL"><TextInput value={p.image} onChange={(v) => set({ image: v })} /></Row>
            </>
          )}
        </>
      )}

      {(node.type === 'navbar' || node.type === 'hero' || node.type === 'footer') && (
        <>
          <Row label="Background"><ColorInput value={p.background} onChange={(v) => set({ background: v })} /></Row>
          <Row label="Text color"><ColorInput value={p.textColor} onChange={(v) => set({ textColor: v })} /></Row>
          {node.type === 'navbar' && (
            <>
              <Row label="Logo text"><TextInput value={p.logo} onChange={(v) => set({ logo: v })} /></Row>
              <Row label="Links (label|href per line)"><TextArea rows={4} value={(p.links || []).map((l) => `${l.label}|${l.href}`).join('\n')} onChange={(v) => set({ links: v.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => { const [label, href] = s.split('|'); return { label: (label || '').trim(), href: (href || '#').trim() }; }) })} /></Row>
              <Row label="CTA text"><TextInput value={p.ctaText} onChange={(v) => set({ ctaText: v })} /></Row>
              <Row label="CTA href"><TextInput value={p.ctaHref} onChange={(v) => set({ ctaHref: v })} /></Row>
            </>
          )}
          {node.type === 'hero' && (
            <>
              <Row label="Title"><TextInput value={p.title} onChange={(v) => set({ title: v })} /></Row>
              <Row label="Subtitle"><TextArea value={p.subtitle} onChange={(v) => set({ subtitle: v })} /></Row>
              <Row label="CTA text"><TextInput value={p.ctaText} onChange={(v) => set({ ctaText: v })} /></Row>
              <Row label="CTA href"><TextInput value={p.ctaHref} onChange={(v) => set({ ctaHref: v })} /></Row>
              <Row label="Secondary text"><TextInput value={p.secondaryText} onChange={(v) => set({ secondaryText: v })} /></Row>
              <Row label="Image URL"><TextInput value={p.image} onChange={(v) => set({ image: v })} /></Row>
              <Row label="Align"><SelectInput value={p.align || 'center'} options={['left', 'center']} onChange={(v) => set({ align: v })} /></Row>
              <Row label="Padding"><RangeInput value={p.padding ?? 80} min={16} max={200} onChange={(v) => set({ padding: v })} /></Row>
            </>
          )}
          {node.type === 'footer' && (
            <>
              <Row label="Logo"><TextInput value={p.logo} onChange={(v) => set({ logo: v })} /></Row>
              <Row label="Description"><TextArea value={p.description} onChange={(v) => set({ description: v })} /></Row>
              <Row label="Copyright"><TextInput value={p.copyright} onChange={(v) => set({ copyright: v })} /></Row>
            </>
          )}
        </>
      )}

      {(node.type === 'featureGrid' || node.type === 'testimonials' || node.type === 'pricing' || node.type === 'faq' || node.type === 'contactForm' || node.type === 'socialLinks' || node.type === 'divider' || node.type === 'spacer') && (
        <>
          {node.type === 'spacer' && <Row label="Height"><RangeInput value={p.height ?? 32} min={4} max={240} onChange={(v) => set({ height: v })} /></Row>}
          {node.type === 'divider' && (
            <>
              <Row label="Color"><ColorInput value={p.color} onChange={(v) => set({ color: v })} /></Row>
              <Row label="Thickness"><RangeInput value={p.thickness ?? 1} min={1} max={12} onChange={(v) => set({ thickness: v })} /></Row>
              <Row label="Margin"><RangeInput value={p.margin ?? 16} min={0} max={80} onChange={(v) => set({ margin: v })} /></Row>
            </>
          )}
          {(node.type === 'featureGrid' || node.type === 'testimonials' || node.type === 'pricing' || node.type === 'faq' || node.type === 'contactForm') && (
            <Row label="Section title"><TextInput value={p.title} onChange={(v) => set({ title: v })} /></Row>
          )}
          {node.type === 'featureGrid' && (
            <>
              <Row label="Columns"><RangeInput value={p.columns ?? 3} min={1} max={4} onChange={(v) => set({ columns: v })} /></Row>
              <Row label="Features JSON"><TextArea rows={5} value={JSON.stringify(p.features || [], null, 1)} onChange={(v) => { try { set({ features: JSON.parse(v) }); } catch {} }} /></Row>
            </>
          )}
          {node.type === 'testimonials' && <Row label="Items JSON"><TextArea rows={5} value={JSON.stringify(p.items || [], null, 1)} onChange={(v) => { try { set({ items: JSON.parse(v) }); } catch {} }} /></Row>}
          {node.type === 'pricing' && <Row label="Plans JSON"><TextArea rows={6} value={JSON.stringify(p.plans || [], null, 1)} onChange={(v) => { try { set({ plans: JSON.parse(v) }); } catch {} }} /></Row>}
          {node.type === 'faq' && <Row label="Q/A JSON"><TextArea rows={6} value={JSON.stringify(p.items || [], null, 1)} onChange={(v) => { try { set({ items: JSON.parse(v) }); } catch {} }} /></Row>}
          {node.type === 'contactForm' && (
            <>
              <Row label="Subtitle"><TextInput value={p.subtitle} onChange={(v) => set({ subtitle: v })} /></Row>
              <Row label="Submit label"><TextInput value={p.submitText} onChange={(v) => set({ submitText: v })} /></Row>
            </>
          )}
          {node.type === 'socialLinks' && (
            <>
              <Row label="Links JSON"><TextArea rows={4} value={JSON.stringify(p.links || [], null, 1)} onChange={(v) => { try { set({ links: JSON.parse(v) }); } catch {} }} /></Row>
              <Row label="Icon size"><RangeInput value={p.iconSize ?? 20} min={12} max={48} onChange={(v) => set({ iconSize: v })} /></Row>
              <Row label="Color"><ColorInput value={p.color} onChange={(v) => set({ color: v })} /></Row>
            </>
          )}
        </>
      )}
    </div>
  );
}
