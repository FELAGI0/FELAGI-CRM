import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { LoadingScreen } from '@/components/loading-screen'

import { useAuthStore } from './auth.store'

export const AuthGuard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isRestoring = useAuthStore((state) => state.isRestoring)
  const hasStoredTokens = useAuthStore((state) => Boolean(state.accessToken || state.refreshToken))
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    if (!isAuthenticated && hasStoredTokens) void restoreSession()
  }, [isAuthenticated, hasStoredTokens, restoreSession])

  if (isAuthenticated) return <Outlet />
  if (hasStoredTokens || isRestoring) return <LoadingScreen label="Restoring session…" />
  return <Navigate to="/login" replace />
}

export const GuestGuard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}