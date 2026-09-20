import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { LoadingScreen } from '@/components/loading-screen'
import { t } from '@/lib/i18n'
import type { Role } from '@/types/api'

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
  if (hasStoredTokens || isRestoring) return <LoadingScreen label={t.auth.restoringSession} />
  return <Navigate to="/login" replace />
}

export const GuestGuard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/**
 * Restricts a route to a single role.
 *
 * This is a convenience, not a security boundary: the API protects the same
 * resources with `require_role`. A non-matching user is sent to the dashboard
 * rather than shown a 403 page, since the route simply is not theirs.
 */
export const RoleGuard = ({ role }: { role: Role }) => {
  const currentRole = useAuthStore((state) => state.user?.role ?? null)

  if (currentRole !== role) return <Navigate to="/dashboard" replace />
  return <Outlet />
}