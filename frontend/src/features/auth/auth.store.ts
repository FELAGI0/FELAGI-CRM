import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '@/types/api'

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setSession: (user: User, accessToken: string, refreshToken: string) => void
  clearSession: () => void
  updateAccessToken: (accessToken: string) => void
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
      clearSession: () => set(initialState),
      updateAccessToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'felagi-auth',
      partialize: ({ user, accessToken, refreshToken }) => ({ user, accessToken, refreshToken }),
    },
  ),
)
