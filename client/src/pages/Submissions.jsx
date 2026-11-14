import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Inbox, Trash2, Mail } from 'lucide-react';
import formService from '../services/form.service.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';
import { SkeletonText } from '../components/Skeleton.jsx';
import { format } from 'date-fns';

// Render `key: value` chips for a submission payload (readable instead of raw JSON).
function DataChips({ data }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return <span className="text-slate-400">—</span>;
  const shown = entries.slice(0, 4);
  const extra = entries.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map(([key, value]) => {
        const str =
          value === null || value === undefined
            ? ''
            : typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
        return (
          <span
            key={key}
            title={`${key}: ${str}`}
            className="inline-flex max-w-[240px] items-center gap-1 rounded-md bg-surface-3/80 px-2 py-0.5 text-xs dark:bg-slate-800"
          >
            <span className="font-semibold text-slate-500 dark:text-slate-400">{key}:</span>
            <span className="truncate text-slate-700 dark:text-slate-200">
              {str.length > 40 ? `${str.slice(0, 40)}…` : str || '—'}
            </span>
          </span>
        );
      })}
      {extra > 0 && <span className="text-2xs text-slate-400">+{extra} more</span>}
    </div>
  );
}

export function Submissions() {
  const { id: websiteId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  const load = useCallback(async () => {
    if (!websiteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await formService.submissionsByWebsite(websiteId);
      setRows(Array.isArray(res) ? res : res?.submissions || res?.items || []);
    } catch (e) {
      setError(e?.message || 'Could not load submissions.');
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    const rid = row._id || row.id;
    const ok = await askConfirm({
      title: 'Delete submission?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(rid);
    try {
      await formService.removeSubmission(websiteId, rid);
      setRows((s) => s.filter((r) => (r._id || r.id) !== rid));
      pushToast({ message: 'Submission deleted', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <Reveal className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-xs">
          <Inbox size={22} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Form submissions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Responses collected from your site forms.</p>
        </div>
        <span className="ml-auto">
          <Badge variant="primary">{rows.length} total</Badge>
        </span>
      </Reveal>

      {error && !loading && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40"
        >
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Could not load submissions.</p>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <Reveal delay={80}>
        <Card>
          <CardTitle>Inbox</CardTitle>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => <SkeletonText key={i} lines={2} />)}
            </div>
          ) : rows.length === 0 && !error ? (
            <div className="mt-3">
              <EmptyState
                icon={<Mail size={28} />}
                title="No submissions yet"
                description="Share your published site to start collecting responses."
              />
            </div>
          ) : (
            <>
              {/* Mobile: stacked cards (the table would be one long overflow strip) */}
              <div className="mt-3 space-y-3 md:hidden">
                {rows.map((r, i) => {
                  const rid = r._id || r.id;
                  return (
                    <div
                      key={rid}
                      className="rounded-xl border border-slate-200 p-3 animate-fade-in dark:border-slate-800"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge>{r.formName || r.formId || 'Form'}</Badge>
                        <Button
                          size="xs"
                          variant="ghost"
                          loading={deletingId === rid}
                          onClick={() => handleDelete(r)}
                          aria-label="Delete submission"
                          className="hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <div className="mt-2.5">
                        {r.data && typeof r.data === 'object' ? (
                          <DataChips data={r.data} />
                        ) : (
                          <p className="break-all text-xs text-slate-600 dark:text-slate-300" title={String(r.data ?? '')}>
                            {String(r.data ?? r.message ?? '—')}
                          </p>
                        )}
                      </div>
                      <p className="mt-2.5 text-xs text-slate-500">
                        {r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy HH:mm') : '—'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="mt-3 hidden overflow-x-auto rounded-xl border border-slate-200 md:block dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-surface-2 text-2xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                      <th scope="col" className="px-4 py-2.5 font-semibold">Form</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Data</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Date</th>
                      <th scope="col" className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const rid = r._id || r.id;
                      const fullData = r.data && typeof r.data === 'object' ? JSON.stringify(r.data) : String(r.data ?? '');
                      return (
                        <tr key={rid} className="border-b transition-colors last:border-0 hover:bg-surface-2/60 dark:border-slate-800 dark:hover:bg-slate-950/30 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                          <td className="px-4 py-3"><Badge>{r.formName || r.formId || 'Form'}</Badge></td>
                          <td className="max-w-md px-4 py-3 text-slate-600 dark:text-slate-300" title={fullData}>
                            {r.data && typeof r.data === 'object' ? (
                              <DataChips data={r.data} />
                            ) : (
                              String(r.data ?? r.message ?? '—')
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                            {r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy HH:mm') : '—'}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <Button
                              size="xs"
                              variant="ghost"
                              loading={deletingId === rid}
                              onClick={() => handleDelete(r)}
                              aria-label="Delete submission"
                              className="hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* No pagination — the API returns the full list; add server-side paging before this list grows. */}
            </>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

export default Submissions;
