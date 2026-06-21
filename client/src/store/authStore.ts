import { create } from 'zustand';
import api from '../services/api';
import { queryClient } from '../services/queryClient';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', credentials);
      const user: User = res.data;
      
      localStorage.setItem('auth_session', JSON.stringify(user));
      queryClient.clear();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Authentication failed. Please verify credentials.',
        isLoading: false
      });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      set({ isLoading: false });
      return res.data;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Registration failed.',
        isLoading: false
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // Only call server logout if we have a token (avoids 401 on stale sessions)
      const authData = localStorage.getItem('auth_session');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed?.token) {
          await api.post('/auth/logout');
        }
      }
    } catch (err) {
      console.warn('Logout request failed, clearing local session anyway.', err);
    } finally {
      localStorage.removeItem('auth_session');
      queryClient.clear();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    const session = localStorage.getItem('auth_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        set({ user, isAuthenticated: true });
      } catch (err) {
        localStorage.removeItem('auth_session');
        queryClient.clear();
      }
    }

    // Bind session expired events triggered by api interceptors
    const handleExpired = () => {
      queryClient.clear();
      set({ user: null, isAuthenticated: false, error: 'Session expired. Please log in again.' });
    };

    window.addEventListener('auth_session_expired', handleExpired);
  }
}));

// Listen for Google OAuth login events to pick up the session
window.addEventListener('auth_session_updated', () => {
  const session = localStorage.getItem('auth_session');
  if (session) {
    try {
      const user = JSON.parse(session);
      useAuthStore.setState({ user, isAuthenticated: true });
      queryClient.clear();
    } catch { /* ignore parse errors */ }
  }
});
