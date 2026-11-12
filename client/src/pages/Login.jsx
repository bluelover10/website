import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { loginSchema } from '../schemas/auth.schema.js';
import useAuthStore from '../store/authStore.js';
import useUiStore from '../store/uiStore.js';
import { Input, PasswordInput } from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import DemoAccessPanel from '../components/DemoAccessPanel.jsx';
import { DEMO_CREDENTIALS } from '../config/demo.js';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const pushToast = useUiStore((s) => s.pushToast);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    try {
      await login(values);
      pushToast({ message: 'Welcome back!', type: 'success' });
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (e) {
      pushToast({ message: e?.message || 'Login failed', type: 'error' });
    }
  };

  // Fills the form with the intentionally public demo credentials.
  const useDemo = () => {
    setValue('email', DEMO_CREDENTIALS.email, { shouldValidate: true });
    setValue('password', DEMO_CREDENTIALS.password, { shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">Log in to SiteForge</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back — enter your details to continue.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        {error && !loading && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full justify-center">
          Log in <ArrowRight size={16} />
        </Button>
      </form>

      <DemoAccessPanel onUseDemo={useDemo} />

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        New to SiteForge?{' '}
        <Link to="/register" className="sf-link">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default Login;
