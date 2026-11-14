import { useState } from 'react';
import { Camera, KeyRound, Trash2, UserRound } from 'lucide-react';
import authService from '../services/auth.service.js';
import useAuthStore from '../store/authStore.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import { Input, PasswordInput } from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Reveal from '../components/Reveal.jsx';

function CardHead({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-3">
      <CardTitle>
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
            <Icon size={14} />
          </span>
          {title}
        </span>
      </CardTitle>
      {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}

// Account surface: avatar, display name and password change. The hamburger
// menu's "Edit profile" row and the sidebar account block both land here.
export function Account() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const pushToast = useUiStore((s) => s.pushToast);

  // --- avatar ---
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarSaving, setAvatarSaving] = useState(false);

  // --- profile ---
  const [name, setName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // --- password ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const saveAvatar = async () => {
    const trimmed = avatarUrl.trim();
    if (trimmed && !/^(https?:\/\/|\/)/i.test(trimmed)) {
      pushToast({ message: 'Avatar must be an image URL (http… or /…)', type: 'error' });
      return;
    }
    setAvatarSaving(true);
    try {
      const res = await authService.updateProfile({ avatar: trimmed });
      setUser(res?.user || res);
      pushToast({ message: trimmed ? 'Avatar updated' : 'Avatar removed', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    } finally {
      setAvatarSaving(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      pushToast({ message: 'Name must be at least 2 characters.', type: 'error' });
      return;
    }
    setProfileSaving(true);
    try {
      const res = await authService.updateProfile({ name: name.trim() });
      setUser(res?.user || res);
      pushToast({ message: 'Profile updated', type: 'success' });
    } catch (err) {
      pushToast({ message: err.message, type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!currentPassword) errors.current = 'Current password is required.';
    if (newPassword.length < 8) errors.next = 'New password must be at least 8 characters.';
    if (confirmPassword !== newPassword) errors.confirm = 'Passwords do not match.';
    if (newPassword && newPassword === currentPassword) errors.next = 'New password must be different from the current one.';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;
    setPwSaving(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      pushToast({ message: 'Password updated', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwErrors({});
    } catch (err) {
      pushToast({ message: err.message, type: 'error' });
    } finally {
      setPwSaving(false);
    }
  };

  const initial = (user?.name || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Account</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your profile, avatar and password.</p>
      </Reveal>

      <Reveal delay={70}>
        <Card>
          <CardHead icon={Camera} title="Avatar" subtitle="Paste a link to any image — shown next to your name across the app." />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Your avatar"
                className="h-16 w-16 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xl font-bold text-white">
                {initial}
              </span>
            )}
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <Input
                label="Avatar URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…/me.png"
                className="flex-1"
              />
              <div className="flex items-end gap-2">
                <Button onClick={saveAvatar} loading={avatarSaving}>Save</Button>
                {user?.avatar && (
                  <Button
                    variant="outline"
                    onClick={() => { setAvatarUrl(''); }}
                    disabled={avatarSaving}
                    title="Clear the URL field, then Save to remove"
                  >
                    <Trash2 size={15} /> Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={110}>
        <Card>
          <CardHead icon={UserRound} title="Profile" />
          <form onSubmit={saveProfile} className="space-y-3" noValidate>
            <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <Input label="Email" value={user?.email || ''} disabled readOnly className="opacity-70" autoComplete="email" />
            <p className="text-2xs text-slate-400">Email can't be changed here — it is your login identity.</p>
            <div className="flex justify-end">
              <Button type="submit" variant="gradient" loading={profileSaving}>Save profile</Button>
            </div>
          </form>
        </Card>
      </Reveal>

      <Reveal delay={150}>
        <Card>
          <CardHead icon={KeyRound} title="Password" subtitle="Use at least 8 characters. You'll stay logged in after changing it." />
          <form onSubmit={savePassword} className="space-y-3" noValidate>
            <PasswordInput
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              error={pwErrors.current}
            />
            <PasswordInput
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              error={pwErrors.next}
            />
            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              error={pwErrors.confirm}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={pwSaving}>Change password</Button>
            </div>
          </form>
        </Card>
      </Reveal>
    </div>
  );
}

export default Account;
