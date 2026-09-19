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

export const canCreateTask = (): boolean => true