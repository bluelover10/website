import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="hidden flex-1 flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
        <Link to="/" className="text-xl font-bold">SiteForge</Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Build stunning websites<br />without writing code.</h2>
          <p className="mt-3 text-slate-400">Drag, drop, publish. Manage everything from one dashboard.</p>
        </div>
        <p className="text-xs text-slate-500">© 2026 SiteForge</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
