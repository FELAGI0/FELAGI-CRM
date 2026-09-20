import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '@/types/api'

import * as authApi from './auth.api'

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isRestoring: boolean
  setSession: (user: User, accessToken: string, refreshToken: string) => void
  /** Replaces the cached user without touching tokens, for profile updates. */
  setUser: (user: User) => void
  clearSession: () => void
  updateAccessToken: (accessToken: string) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  restoreSession: () => Promise<void>
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isRestoring: false,
}

let restorePromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ ...initialState }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      updateTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      login: async (email, password) => {
        const tokens = await authApi.login({ email, password })
        get().updateTokens(tokens.access_token, tokens.refresh_token)
        const user = await authApi.getMe()
        set({ user, isAuthenticated: true })
      },
      register: async (email, password) => {
        await authApi.register({ email, password })
        const tokens = await authApi.login({ email, password })
        get().updateTokens(tokens.access_token, tokens.refresh_token)
        const user = await authApi.getMe()
        set({ user, isAuthenticated: true })
      },
      logout: () => set({ ...initialState }),
      restoreSession: async () => {
        const { accessToken, refreshToken } = get()
        if (!accessToken && !refreshToken) {
          set({ ...initialState })
          return
        }

        if (!restorePromise) {
          restorePromise = (async () => {
            set({ isRestoring: true })
            try {
              if (!get().accessToken) {
                const tokens = await authApi.refresh(get().refreshToken ?? '')
                set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
              }
              const user = await authApi.getMe()
              const { accessToken: currentAccessToken, refreshToken: currentRefreshToken } = get()
              set({
                user,
                accessToken: currentAccessToken,
                refreshToken: currentRefreshToken,
                isAuthenticated: true,
              })
            } catch {
              set({ ...initialState })
            } finally {
              set({ isRestoring: false })
              restorePromise = null
            }
          })()
        }

        await restorePromise
      },
    }),
    {
      name: 'felagi-auth',
      partialize: ({ user, accessToken, refreshToken }) => ({ user, accessToken, refreshToken }),
    },
  ),
)