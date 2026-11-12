import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import EditorLayout from '../layouts/EditorLayout.jsx';
import Landing from '../pages/Landing.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Websites from '../pages/Websites.jsx';
import CreateWebsite from '../pages/CreateWebsite.jsx';
import Templates from '../pages/Templates.jsx';
import MediaLibrary from '../pages/MediaLibrary.jsx';
import SiteSettings from '../pages/SiteSettings.jsx';
import Submissions from '../pages/Submissions.jsx';
import Team from '../pages/Team.jsx';
import NotFound from '../pages/NotFound.jsx';
import Editor from '../pages/Editor.jsx';
import Preview from '../pages/Preview.jsx';
import PublicSite from '../pages/PublicSite.jsx';
import Analytics from '../pages/Analytics.jsx';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function AppRoutes() {
  return (
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
        </Route>
        <Route element={<EditorLayout />}>
          <Route path="/websites/:id/edit" element={<Editor />} />
        </Route>
        <Route path="/websites/:id/preview" element={<Preview />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
