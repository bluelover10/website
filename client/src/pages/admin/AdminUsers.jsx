// Admin: all platform accounts — search, role filter, promote/demote.
// Self role-change is blocked server-side (CANNOT_CHANGE_SELF) and hidden here.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import adminService from '../../services/admin.service.js';
import useAuthStore from '../../store/authStore.js';
import useUiStore from '../../store/uiStore.js';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Reveal from '../../components/Reveal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { SkeletonText } from '../../components/Skeleton.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export function AdminUsers() {
  const me = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumped to remount the per-row role <select> and snap its DOM value back
  // after a cancelled confirm (a controlled select keeps the user's pick otherwise).
  const [selectKey, setSelectKey] = useState(0);
  const debounceRef = useRef(null);
  // Accounts can arrive as either _id or id shapes — compare normalized.
  const myId = String(me?._id || me?.id || '');

  const fetchUsers = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page: opts.page ?? page, limit: 20 };
        if ((opts.search ?? search).trim()) params.search = (opts.search ?? search).trim();
        if (opts.role ?? role) params.role = opts.role ?? role;
        const res = await adminService.users(params);
        setData(res);
      } catch (e) {
        setError(e);
        pushToast({ message: e.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [page, search, role, pushToast]
  );

  useEffect(() => {
    fetchUsers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const onSearchChange = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers({ search: value, page: 1 }), 300);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const changeRole = async (user, nextRole) => {
    if (nextRole === user.role) return;
    const toAdmin = nextRole === 'admin';
    const ok = await askConfirm({
      title: toAdmin ? `Promote ${user.name || user.email}?` : `Demote ${user.name || user.email}?`,
      message: toAdmin
        ? 'Admins can view and delete ANY site and manage ALL accounts. Only promote people you trust.'
        : 'This account will lose all admin powers.',
      danger: !toAdmin,
      confirmLabel: toAdmin ? 'Promote to admin' : 'Demote',
    });
    if (!ok) {
      // Cancelled: the native select already shows the unconfirmed role —
      // remount it so the UI matches the role the server actually has.
      setSelectKey((k) => k + 1);
      return;
    }
    try {
      await adminService.updateUserRole(user._id, nextRole);
      pushToast({ message: 'Role updated', type: 'success' });
      fetchUsers();
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
      fetchUsers();
    }
  };

  const users = data?.users || [];
  const total = data?.total ?? 0;
  const pageCount = data?.pages ?? 1;

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Accounts
            <Badge variant="primary"><ShieldCheck size={12} /> Admin</Badge>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loading ? 'Loading…' : error ? 'Could not load accounts.' : `${total} account${total === 1 ? '' : 's'} on the platform.`}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <Card>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search name or email…"
                className="sf-input pl-9"
                aria-label="Search accounts"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="sf-input w-32 py-2"
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Rows */}
          {loading && !data ? (
            <SkeletonText lines={5} className="mt-4" />
          ) : error ? (
            <div
              role="alert"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <span>{error.message}</span>
              <Button size="sm" variant="outline" onClick={() => fetchUsers()}>
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Users size={28} />}
              title="No accounts found"
              description="Try a different search term or role filter."
            />
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u, i) => {
                const uid = String(u?._id || u?.id || '');
                const isSelf = Boolean(myId && uid && myId === uid);
                return (
                  <li
                    key={u._id}
                    className="flex flex-wrap items-center gap-3 py-3 animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 font-display text-sm font-bold text-white shadow-xs">
                      {(u.name || u.email || '?')[0].toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {u.name || u.email}
                        {isSelf && <span className="ml-2 text-2xs font-medium text-slate-400">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    </div>
                    <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                      {u.sitesOwned} site{u.sitesOwned === 1 ? '' : 's'}
                    </span>
                    <span className="hidden w-24 text-right text-2xs text-slate-400 md:block">{fmtDate(u.createdAt)}</span>
                    <Badge variant={u.role === 'admin' ? 'primary' : 'default'}>{u.role}</Badge>
                    {isSelf ? (
                      <span className="w-[104px] text-center text-2xs text-slate-400">Protected</span>
                    ) : (
                      <select
                        key={selectKey}
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className="sf-input w-[104px] py-1.5 text-xs"
                        aria-label={`Role for ${u.name || u.email}`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Page {data?.page ?? 1} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(data?.page ?? 1) <= 1 || loading}
                  onClick={() => fetchUsers({ page: (data?.page ?? 1) - 1 })}
                >
                  <ChevronLeft size={14} /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(data?.page ?? 1) >= pageCount || loading}
                  onClick={() => fetchUsers({ page: (data?.page ?? 1) + 1 })}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

export default AdminUsers;