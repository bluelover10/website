import { useEffect } from 'react';
import useAuthStore from '../store/authStore.js';

export function useAuth() {
  const { user, token, isAuthenticated, loading, login, register, logout, fetchMe } =
    useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  return { user, token, isAuthenticated, loading, login, register, logout, fetchMe };
}

export default useAuth;
