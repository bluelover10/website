import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/auth.schema.js';
import useAuthStore from '../store/authStore.js';
import useUiStore from '../store/uiStore.js';
import { Input } from '../components/Input.jsx';
import Button from '../components/Button.jsx';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const pushToast = useUiStore((s) => s.pushToast);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    try {
      await login(values);
      pushToast({ message: 'Welcome back!', type: 'success' });
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (e) {
      pushToast({ message: e.message || 'Login failed', type: 'error' });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to continue to SiteForge.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Email" type="email" placeholder="you@studio.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        No account? <Link to="/register" className="font-medium text-primary-600">Create one</Link>
      </p>
    </div>
  );
}

export default Login;
