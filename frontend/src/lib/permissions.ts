import { useAuthStore } from '@/features/auth/auth.store'
import type { Role } from '@/types/api'

/**
 * UI-only permission checks. The backend enforces the same rules, so a hidden
 * button is a convenience — a forged request still returns 403 and the calling
 * mutation surfaces that through a toast.
 */
const WRITE_ROLES: readonly Role[] = ['admin', 'manager']

export type ClientAction = 'create' | 'edit' | 'delete'

export const useRole = (): Role | null => useAuthStore((state) => state.user?.role ?? null)

export const canManageClients = (role: Role | null): boolean =>
  role !== null && WRITE_ROLES.includes(role)

export const useCan = (action: ClientAction): boolean => {
  const role = useRole()
  switch (action) {
    case 'create':
    case 'edit':
    case 'delete':
      return canManageClients(role)
    default:
      return false
  }
}