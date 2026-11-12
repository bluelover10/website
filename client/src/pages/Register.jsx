import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { registerSchema } from '../schemas/auth.schema.js';
import useAuthStore from '../store/authStore.js';
import useUiStore from '../store/uiStore.js';
import { Input, PasswordInput } from '../components/Input.jsx';
import Button from '../components/Button.jsx';

export function Register() {
  const navigate = useNavigate();
  const registerFn = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const pushToast = useUiStore((s) => s.pushToast);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    try {
      const { confirmPassword: _omit, ...payload } = values;
      await registerFn(payload);
      pushToast({ message: 'Account created. Welcome!', type: 'success' });
      navigate('/dashboard');
    } catch (e) {
      pushToast({ message: e?.message || 'Registration failed', type: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Free to start — build and publish your first site in minutes.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        {error && !loading && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full justify-center">
          Create account <ArrowRight size={16} />
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="sf-link">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default Register;
