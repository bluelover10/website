import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Globe, LayoutTemplate, Image, Settings, Menu, X,
  Sun, Moon, Plus, LogOut, ShieldCheck, UserRound,
} from 'lucide-react';
import useUiStore from '../store/uiStore.js';
import useAuthStore from '../store/authStore.js';
import { cn } from '../utils/cn.js';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/websites', label: 'Sites', icon: Globe },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/media', label: 'Media', icon: Image },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/account', label: 'Account', icon: UserRound },
];

// Avatar bubble: shows the user's image when they set one, else the initial.
function AvatarBubble({ user, className = 'h-8 w-8 text-xs' }) {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt=""
        className={cn('shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700', className)}
      />
    );
  }
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 font-bold text-white', className)}>
      {(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

// Platform admin section — only rendered for accounts with role 'admin'.
// Access is still enforced server-side on every /api/admin endpoint.
const adminLinks = [
  { to: '/admin', label: 'Admin', icon: ShieldCheck, admin: true },
];

function NavItem({ to, label, icon: Icon, onNavigate, showLabel }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={label}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-all duration-200',
          'hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          isActive &&
            'bg-primary-50 text-primary-700 shadow-xs dark:bg-primary-950/50 dark:text-primary-200',
          !showLabel && 'justify-center px-0'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-600 dark:bg-primary-400"
            />
          )}
          <Icon size={18} className={cn('shrink-0 transition-transform duration-200 group-hover:scale-110', isActive && 'text-primary-600 dark:text-primary-300')} />
          {showLabel && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function DashboardLayout() {
  // Narrow selectors only — subscribing to the whole stores re-renders the
  // layout on every toast or unrelated state change.
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const darkMode = useUiStore((s) => s.darkMode);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleMobileNav = useUiStore((s) => s.toggleMobileNav);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const toggleDarkMode = useUiStore((s) => s.toggleDarkMode);
  const initTheme = useUiStore((s) => s.initTheme);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? [...links, ...adminLinks] : links;

  const drawerRef = useRef(null);
  const drawerCloseRef = useRef(null);
  const mainColumnRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Scroll lock while the mobile drawer is open.
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileNav(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileNavOpen, setMobileNav]);

  // Mobile drawer focus management: on open, remember the opener and focus
  // the close button; trap Tab inside the drawer; on close, restore focus.
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    openerRef.current = document.activeElement;
    drawerCloseRef.current?.focus();

    const drawer = drawerRef.current;
    if (!drawer) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        drawer.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    drawer.addEventListener('keydown', onKeyDown);
    return () => {
      drawer.removeEventListener('keydown', onKeyDown);
      const opener = openerRef.current;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [mobileNavOpen]);

  // Keep the page content inert while the drawer is open (React 18 has no
  // reliable `inert` prop — set the attribute directly).
  useEffect(() => {
    const column = mainColumnRef.current;
    if (!column) return undefined;
    if (mobileNavOpen) column.setAttribute('inert', '');
    else column.removeAttribute('inert');
    return undefined;
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen bg-surface-2 dark:bg-surface-inv1">
      {/* ---------- desktop sidebar ---------- */}
      <aside
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-swift dark:border-slate-800 dark:bg-surface-inv2 lg:flex',
          sidebarOpen ? 'w-64' : 'w-[68px]'
        )}
      >
        <Link to="/" className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-4 dark:border-slate-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 font-display text-base font-bold text-white shadow-xs">S</span>
          {sidebarOpen && <span className="font-display text-lg font-bold tracking-tight animate-fade-in">SiteForge</span>}
        </Link>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon, admin }) => (
            <span key={to} className={cn('block', admin && 'mt-2 border-t border-slate-100 pt-2 dark:border-slate-800')}>
              <NavItem to={to} label={label} icon={icon} showLabel={sidebarOpen} />
            </span>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className={cn('flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900', !sidebarOpen && 'justify-center bg-transparent p-0 dark:bg-transparent')}>
            <Link
              to="/account"
              title="Account settings"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <AvatarBubble user={user} />
              {sidebarOpen && (
                <span className="min-w-0 flex-1 animate-fade-in">
                  <span className="block truncate text-xs font-semibold">{user?.name || 'Account'}</span>
                  <span className="block truncate text-2xs text-slate-400">{user?.email || ''}</span>
                </span>
              )}
            </Link>
            {sidebarOpen && (
              <button
                onClick={logout}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-red-500 dark:hover:bg-slate-800"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ---------- mobile drawer ---------- */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileNav(false)} aria-hidden="true" />
          <aside ref={drawerRef} className="relative flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-pop animate-slide-in-left dark:border-slate-800 dark:bg-surface-inv2">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
              <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileNav(false)}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 font-display text-base font-bold text-white">S</span>
                <span className="font-display text-lg font-bold tracking-tight">SiteForge</span>
              </Link>
              <button ref={drawerCloseRef} onClick={() => setMobileNav(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map(({ to, label, icon, admin }) => (
                <span key={to} className={cn('block', admin && 'mt-2 border-t border-slate-100 pt-2 dark:border-slate-800')}>
                  <NavItem to={to} label={label} icon={icon} showLabel onNavigate={() => setMobileNav(false)} />
                </span>
              ))}
            </nav>
            <div className="border-t border-slate-100 p-3 dark:border-slate-800">
              <div className="mb-2.5 flex items-center gap-2.5">
                <AvatarBubble user={user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{user?.name || 'Account'}</p>
                  <p className="truncate text-2xs text-slate-400">{user?.email || ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/account"
                  onClick={() => setMobileNav(false)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 transition hover:border-primary-400 hover:bg-primary-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-500 dark:hover:bg-primary-950/30"
                >
                  <UserRound size={14} /> Edit profile
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ---------- main column ---------- */}
      <div ref={mainColumnRef} className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-surface-inv2/80">
          <button
            onClick={toggleMobileNav}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:block dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <button
            onClick={toggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            to="/websites/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-3.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:shadow-glow active:scale-[0.98]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New site</span>
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
