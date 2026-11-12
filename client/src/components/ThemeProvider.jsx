import { useEffect } from 'react';

function applyTheme(theme = {}) {
  const root = document.documentElement;
  if (theme.primary) {
    root.style.setProperty('--color-primary', theme.primary);
  }
  if (theme.font) {
    root.style.setProperty('--sf-font', theme.font);
  }
  if (theme.background) {
    root.style.setProperty('--sf-bg', theme.background);
  }
}

export function ThemeProvider({ theme, children }) {
  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  return <>{children}</>;
}

export default ThemeProvider;
