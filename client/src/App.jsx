import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import { Toaster } from './components/Toast.jsx';
import { ConfirmDialog } from './components/ConfirmDialog.jsx';
import useAuthStore from './store/authStore.js';
import useUiStore from './store/uiStore.js';

function AuthBootstrap({ children }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const token = useAuthStore((s) => s.token);
  const initTheme = useUiStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  return children;
}

export function AuthProvider({ children }) {
  return <AuthBootstrap>{children}</AuthBootstrap>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
        <ConfirmDialog />
      </AuthProvider>
    </BrowserRouter>
  );
}
