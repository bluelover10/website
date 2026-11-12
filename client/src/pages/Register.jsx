import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/auth.schema.js';
import useAuthStore from '../store/authStore.js';
import useUiStore from '../store/uiStore.js';
import { Input } from '../components/Input.jsx';
import Button from '../components/Button.jsx';

export function Register() {
  const navigate = useNavigate();
  const registerFn = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
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
      navigate('/dashboard', { replace: true });
    } catch (e) {
      pushToast({ message: e.message || 'Registration failed', type: 'error' });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Start building with SiteForge today.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Name" placeholder="Ada Lovelace" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" placeholder="you@studio.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="Min. 6 characters" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Have an account? <Link to="/login" className="font-medium text-primary-600">Sign in</Link>
      </p>
    </div>
  );
}

export default Register;
