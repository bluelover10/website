import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Users, Trash2 } from 'lucide-react';
import memberService from '../services/member.service.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import { Input, Select } from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';

export function Team() {
  const { id: websiteId } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const pushToast = useUiStore((s) => s.pushToast);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { email: '', role: 'editor' } });

  const load = async () => {
    if (!websiteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await memberService.listByWebsite(websiteId);
      setMembers(Array.isArray(res) ? res : res?.members || res?.items || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId]);

  const onInvite = async (values) => {
    try {
      const invited = await memberService.invite(websiteId, values);
      if (invited && (invited._id || invited.id || invited.email)) {
        setMembers((s) => [invited, ...s]);
      } else {
        load();
      }
      reset();
      pushToast({ message: 'Invite sent', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  const changeRole = async (m, role) => {
    try {
      await memberService.updateRole(m._id || m.id, role);
      setMembers((s) => s.map((x) => ((x._id || x.id) === (m._id || m.id) ? { ...x, role } : x)));
      pushToast({ message: 'Role updated', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  const removeMember = async (m) => {
    try {
      await memberService.remove(m._id || m.id);
      setMembers((s) => s.filter((x) => (x._id || x.id) !== (m._id || m.id)));
      pushToast({ message: 'Member removed', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-sm text-slate-500">Invite collaborators and manage roles.</p>
      </div>

      <Card>
        <CardTitle>Invite member</CardTitle>
        <form onSubmit={handleSubmit(onInvite)} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="teammate@studio.com" {...register('email')} />
          <Select {...register('role')} className="sm:w-40">
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </Select>
          <Button type="submit">Invite</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Members ({members.length})</CardTitle>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : members.length === 0 ? (
          <div className="mt-3"><EmptyState icon={<Users size={32} />} title="No members yet" description="Invite your team to collaborate on this site." /></div>
        ) : (
          <ul className="mt-3 divide-y dark:divide-slate-800">
            {members.map((m) => (
              <li key={m._id || m.id || m.email} className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                  {(m.name || m.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.name || m.email}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
                <Badge>{m.role || 'editor'}</Badge>
                <select value={m.role || 'editor'} onChange={(e) => changeRole(m, e.target.value)} className="rounded border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => removeMember(m)} className="rounded p-1.5 hover:bg-red-50 hover:text-red-600" aria-label="Remove">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default Team;
