import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Inbox, Trash2 } from 'lucide-react';
import formService from '../services/form.service.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
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
      await formService.removeSubmission(rid);
      setRows((s) => s.filter((r) => (r._id || r.id) !== rid));
      pushToast({ message: 'Submission deleted', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Form submissions</h1>
        <p className="text-sm text-slate-500">Responses collected from your site forms.</p>
      </div>
      <Card>
        <CardTitle>Inbox ({rows.length})</CardTitle>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={<Inbox size={32} />} title="No submissions yet" description="Share your published site to start collecting responses." />
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-slate-500 dark:border-slate-700">
                  <th className="py-2 pr-4">Form</th>
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id || r.id} className="border-b last:border-0 dark:border-slate-800">
                    <td className="py-2 pr-4"><Badge>{r.formName || r.formId || 'Form'}</Badge></td>
                    <td className="max-w-md truncate py-2 pr-4 text-slate-600 dark:text-slate-300">
                      {typeof r.data === 'object' ? JSON.stringify(r.data) : String(r.data ?? r.message ?? '—')}
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-500">
                      {r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy HH:mm') : '—'}
                    </td>
                    <td className="py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(r)}><Trash2 size={15} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Submissions;
