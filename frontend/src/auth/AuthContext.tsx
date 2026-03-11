import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe, login as apiLogin } from '../api';

type Role = 'admin' | 'radiologist' | 'clerical';

interface User {
  id: number;
  name: string;
  email?: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'radiology_token';
const USER_KEY = 'radiology_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem(TOKEN_KEY),
    user: null,
    loading: true,
  });

  const loadUser = useCallback(async (token: string) => {
    try {
      const { user } = await getMe(token);
      const u: User = { id: user.id, name: user.name, role: user.role as Role };
      setState({ token, user: u, loading: false });
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setState({ token: null, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    const token = state.token;
    if (!token) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setState((s) => ({ ...s, user, loading: false }));
      } catch {
        loadUser(token);
      }
    } else {
      loadUser(token);
    }
  }, [state.token, loadUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const { token, user } = await apiLogin(email, password);
      const u: User = { id: user.id, name: user.name, email: user.email, role: user.role as Role };
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setState({ token, user: u, loading: false });
      return u;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ token: null, user: null, loading: false });
  }, []);

  const setAuth = useCallback((token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ token, user, loading: false });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    setAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
