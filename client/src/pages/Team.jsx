import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Users, Trash2, UserPlus, ShieldCheck } from 'lucide-react';
import memberService from '../services/member.service.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import { Input, Select } from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';
import { SkeletonText } from '../components/Skeleton.jsx';

const roleTints = {
  owner: 'accent',
  editor: 'primary',
  viewer: 'default',
};

export function Team() {
  const { id: websiteId } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const pushToast = useUiStore((s) => s.pushToast);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { email: '', role: 'editor' } });

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
      await memberService.updateRole(websiteId, m._id || m.id, role);
      setMembers((s) => s.map((x) => ((x._id || x.id) === (m._id || m.id) ? { ...x, role } : x)));
      pushToast({ message: 'Role updated', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  const removeMember = async (m) => {
    try {
      await memberService.remove(websiteId, m._id || m.id);
      setMembers((s) => s.filter((x) => (x._id || x.id) !== (m._id || m.id)));
      pushToast({ message: 'Member removed', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-xs">
          <Users size={22} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Team</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invite collaborators and manage roles.</p>
        </div>
      </Reveal>

      <Reveal delay={70}>
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <UserPlus size={16} className="text-primary-500" /> Invite member
            </span>
          </CardTitle>
          <form onSubmit={handleSubmit(onInvite)} className="mt-3 flex flex-col gap-2 sm:flex-row" noValidate>
            <Input type="email" placeholder="teammate@studio.com" autoComplete="email" {...register('email')} />
            <Select {...register('role')} className="sm:w-36" aria-label="Member role">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </Select>
            <Button type="submit" variant="gradient" loading={isSubmitting} className="sm:w-28">Invite</Button>
          </form>
        </Card>
      </Reveal>

      <Reveal delay={130}>
        <Card>
          <CardTitle>Members ({members.length})</CardTitle>
          {loading ? (
            <div className="mt-4 space-y-3">{[0, 1].map((i) => <SkeletonText key={i} lines={2} />)}</div>
          ) : members.length === 0 ? (
            <div className="mt-3">
              <EmptyState icon={<Users size={28} />} title="No members yet" description="Invite your team to collaborate on this site." />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m, i) => {
                const isOwner = m.role === 'owner';
                return (
                  <li key={m._id || m.id || m.email} className="flex flex-wrap items-center gap-3 py-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 font-display text-sm font-bold text-white shadow-xs">
                      {(m.name || m.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{m.name || m.email}</p>
                      <p className="truncate text-xs text-slate-500">{m.email}</p>
                    </div>
                    <Badge variant={roleTints[m.role] || 'default'}>
                      {isOwner && <ShieldCheck size={11} />} {m.role || 'editor'}
                    </Badge>
                    {isOwner ? (
                      <span className="w-[104px] text-center text-2xs text-slate-400">Site owner</span>
                    ) : (
                      <select
                        value={m.role || 'editor'}
                        onChange={(e) => changeRole(m, e.target.value)}
                        className="sf-input w-[104px] py-1.5 text-xs"
                        aria-label={`Role for ${m.name || m.email}`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    )}
                    {!isOwner && (
                      <button onClick={() => removeMember(m)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label={`Remove ${m.name || m.email}`}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

export default Team;
