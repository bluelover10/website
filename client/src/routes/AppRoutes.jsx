import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import EditorLayout from '../layouts/EditorLayout.jsx';
import PageSpinner from '../components/PageSpinner.jsx';

// Route-level code splitting: each page is a separate chunk so the initial
// bundle only carries the shell. Layouts stay eager (shared chrome).
const Landing = lazy(() => import('../pages/Landing.jsx'));
const Login = lazy(() => import('../pages/Login.jsx'));
const Register = lazy(() => import('../pages/Register.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Websites = lazy(() => import('../pages/Websites.jsx'));
const CreateWebsite = lazy(() => import('../pages/CreateWebsite.jsx'));
const Templates = lazy(() => import('../pages/Templates.jsx'));
const MediaLibrary = lazy(() => import('../pages/MediaLibrary.jsx'));
const SiteSettings = lazy(() => import('../pages/SiteSettings.jsx'));
const Submissions = lazy(() => import('../pages/Submissions.jsx'));
const Team = lazy(() => import('../pages/Team.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));
const Editor = lazy(() => import('../pages/Editor.jsx'));
const Preview = lazy(() => import('../pages/Preview.jsx'));
const PublicSite = lazy(() => import('../pages/PublicSite.jsx'));
const Analytics = lazy(() => import('../pages/Analytics.jsx'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers.jsx'));
const AdminWebsites = lazy(() => import('../pages/admin/AdminWebsites.jsx'));

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

// Client-side role guard for /admin pages. Defense in depth: the server
// independently enforces requireAdmin on every /api/admin endpoint, so a
// stale client can never read admin data — it just gets redirected.
export function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/site/:slug" element={<PublicSite />} />
        <Route path="/site/:slug/:pageSlug" element={<PublicSite />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/websites" element={<Websites />} />
            <Route path="/websites/new" element={<CreateWebsite />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/media" element={<MediaLibrary />} />
            <Route path="/websites/:id/settings" element={<SiteSettings />} />
            <Route path="/websites/:id/submissions" element={<Submissions />} />
            <Route path="/websites/:id/analytics" element={<Analytics />} />
            <Route path="/websites/:id/team" element={<Team />} />
            <Route path="/settings" element={<SiteSettings />} />
            {/* Platform admin — account role, double-enforced server-side */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/websites" element={<AdminWebsites />} />
            </Route>
          </Route>
          <Route element={<EditorLayout />}>
            <Route path="/websites/:id/edit" element={<Editor />} />
          </Route>
          <Route path="/websites/:id/preview" element={<Preview />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
