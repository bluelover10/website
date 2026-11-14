import { useEffect } from 'react';

// Scoped theme preview (e.g. SiteSettings primary color). Sets inline custom
// properties on <html> for as long as it is mounted, and — crucially — restores
// the previous inline values on unmount/change so the preview never leaks into
// the rest of the app (buttons, charts, etc. kept the brand color until reload).
export function ThemeProvider({ theme, children }) {
  useEffect(() => {
    if (!theme) return undefined;
    const root = document.documentElement;
    // Capture the previous inline values BEFORE setting, so the cleanup can put
    // them back exactly as they were.
    const prev = {
      primary: root.style.getPropertyValue('--color-primary'),
      font: root.style.getPropertyValue('--sf-font'),
      bg: root.style.getPropertyValue('--sf-bg'),
    };
    if (theme.primary) root.style.setProperty('--color-primary', theme.primary);
    if (theme.font) root.style.setProperty('--sf-font', theme.font);
    if (theme.background) root.style.setProperty('--sf-bg', theme.background);
    return () => {
      try {
        if (prev.primary) root.style.setProperty('--color-primary', prev.primary);
        else root.style.removeProperty('--color-primary');
        if (prev.font) root.style.setProperty('--sf-font', prev.font);
        else root.style.removeProperty('--sf-font');
        if (prev.bg) root.style.setProperty('--sf-bg', prev.bg);
        else root.style.removeProperty('--sf-bg');
      } catch {
        // ignore — document may be tearing down
      }
    };
  }, [theme]);

  return <>{children}</>;
}

export default ThemeProvider;
