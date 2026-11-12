import { useEffect, useState } from 'react';
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

export function Submissions() {
  const { id: websiteId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (!websiteId) {
      setLoading(false);
      return;
    }
    formService.submissionsByWebsite(websiteId)
      .then((res) => setRows(Array.isArray(res) ? res : res?.submissions || res?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [websiteId]);

  const handleDelete = async (row) => {
    const rid = row._id || row.id;
    try {
      await formService.removeSubmission(websiteId, rid);
      setRows((s) => s.filter((r) => (r._id || r.id) !== rid));
      pushToast({ message: 'Submission deleted', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
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

      <Reveal delay={80}>
        <Card>
          <CardTitle>Inbox</CardTitle>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => <SkeletonText key={i} lines={2} />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={<Mail size={28} />}
                title="No submissions yet"
                description="Share your published site to start collecting responses."
              />
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
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
                  {rows.map((r, i) => (
                    <tr key={r._id || r.id} className="border-b transition-colors last:border-0 hover:bg-surface-2/60 dark:border-slate-800 dark:hover:bg-slate-950/30 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="px-4 py-3"><Badge>{r.formName || r.formId || 'Form'}</Badge></td>
                      <td className="max-w-md truncate px-4 py-3 text-slate-600 dark:text-slate-300" title={typeof r.data === 'object' ? JSON.stringify(r.data) : String(r.data ?? '')}>
                        {typeof r.data === 'object' ? JSON.stringify(r.data) : String(r.data ?? r.message ?? '—')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy HH:mm') : '—'}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Button size="xs" variant="ghost" onClick={() => handleDelete(r)} aria-label="Delete submission" className="hover:text-red-600"><Trash2 size={14} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

export default Submissions;
