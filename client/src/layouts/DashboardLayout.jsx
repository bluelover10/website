import { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Globe, LayoutTemplate, Image, Settings, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import useUiStore from '../store/uiStore.js';
import useAuthStore from '../store/authStore.js';
import { cn } from '../utils/cn.js';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/websites', label: 'Sites', icon: Globe },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/media', label: 'Media', icon: Image },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout() {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode, initTheme } = useUiStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className={cn('flex w-60 shrink-0 flex-col border-r bg-white dark:bg-slate-900 dark:border-slate-800 transition-all', !sidebarOpen && 'hidden md:flex md:w-16')}>
        <Link to="/" className="flex h-16 items-center gap-2 border-b px-4 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 font-bold text-white">S</div>
          {sidebarOpen && <span className="text-lg font-bold">SiteForge</span>}
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800', isActive && 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300')
              }
            >
              <Icon size={18} />
              {sidebarOpen && label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3 dark:border-slate-800">
          <p className={cn('truncate text-sm font-medium', !sidebarOpen && 'hidden')}>{user?.name || user?.email || 'Account'}</p>
          <button onClick={logout} className="mt-1 text-xs text-slate-500 hover:text-red-600">Sign out</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-white px-4 dark:bg-slate-900 dark:border-slate-800">
          <button onClick={toggleSidebar} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle sidebar">
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <button onClick={toggleDarkMode} className="rounded-lg border px-3 py-1.5 text-sm dark:border-slate-700" aria-label="Toggle dark mode">
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <Link to="/websites/new" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            + New site
          </Link>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
