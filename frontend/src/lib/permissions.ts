import { useAuthStore } from '@/features/auth/auth.store'
import type { Role, Task } from '@/types/api'

/**
 * UI-only permission checks. The backend enforces the same rules, so a hidden
 * button is a convenience — a forged request still returns 403 and the calling
 * mutation surfaces that through a toast.
 */
const WRITE_ROLES: readonly Role[] = ['admin', 'manager']

export type ClientAction = 'create' | 'edit' | 'delete'

export const useRole = (): Role | null => useAuthStore((state) => state.user?.role ?? null)

export const useCurrentUserId = (): string | null =>
  useAuthStore((state) => state.user?.id ?? null)

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

/** True for roles that may act on any record, not just their own. */
export const isManagerialRole = (role: Role | null): boolean =>
  role !== null && WRITE_ROLES.includes(role)

/**
 * The API lets a plain user create tasks but restricts update and delete to
 * tasks assigned to them. Managers and admins may act on any task.
 */
export const canEditTask = (role: Role | null, userId: string | null, task: Task): boolean => {
  if (isManagerialRole(role)) return true
  return userId !== null && task.assigned_to === userId
}

/**
 * Deletion follows the same ownership rule as editing on the API side, so this
 * mirrors `canEditTask`. It is a separate export because the two could diverge.
 */
export const canDeleteTask = canEditTask

export const canCreateTask = (): boolean => true

/**
 * User management is admin-only on the API as well: every route under
 * `/users/` is mounted behind `require_role("admin")`, so there is no
 * manager-level view to expose here.
 */
export const canReadUsers = (role: Role | null): boolean => role === 'admin'

export const canManageUsers = (role: Role | null): boolean => role === 'admin'

export type UserAction = 'read' | 'manage'

/** Single entry point for user-management checks, mirroring the API's rules. */
export const useCanManageUsers = (action: UserAction = 'manage'): boolean => {
  const role = useRole()
  return action === 'read' ? canReadUsers(role) : canManageUsers(role)
}