import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken, setOnAuthFailure } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // On mount there's no in-memory token (hard reload wipes it) — the only
  // trace of a session is the httpOnly refresh cookie, so we exchange it for
  // a fresh access token before asking who the user is.
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data } = await api.post('/api/auth/refresh');
        setAccessToken(data.accessToken);
        const meRes = await api.get('/api/auth/me');
        setUser(meRes.data.user);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }
    setOnAuthFailure(clearSession);
    restoreSession();
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
