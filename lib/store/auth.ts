'use client';
// Вход: { user, accessToken }. В проде refresh — httpOnly cookie; в моке храним в localStorage '8mart.auth'.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser { phone: string; name: string }

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  login: (user: AuthUser, token?: string | null) => void;
  setName: (name: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(persist(
  (set, get) => ({
    user: null, accessToken: null,
    login: (user, token = null) => set({ user, accessToken: token }),
    setName: name => { const u = get().user; if (u) set({ user: { ...u, name } }); },
    logout: () => set({ user: null, accessToken: null }),
  }),
  { name: '8mart.auth', storage: createJSONStorage(() => localStorage), skipHydration: true, version: 1,
    partialize: s => ({ user: s.user, accessToken: s.accessToken }) },
));
