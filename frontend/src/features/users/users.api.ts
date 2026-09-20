import { apiClient } from '@/lib/api-client'
import type { Page, Role, User, UserAdminCreate, UserAdminUpdate } from '@/types/api'

export type UserListParams = {
  limit?: number
  offset?: number
}

/** Drops undefined values so the query string only carries real parameters. */
const toQueryParams = (params: UserListParams): Record<string, string | number> => {
  const query: Record<string, string | number> = {}
  if (params.limit !== undefined) query.limit = params.limit
  if (params.offset !== undefined) query.offset = params.offset
  return query
}

/**
 * Collection routes are registered with a trailing slash on the backend, so
 * "/users/" is required — the bare path 307-redirects and the redirect drops
 * the Authorization header. Every route here is admin-only.
 */
export const listUsers = async (params: UserListParams = {}): Promise<Page<User>> => {
  const response = await apiClient.get<Page<User>>('/users/', { params: toQueryParams(params) })
  return response.data
}

export const createUser = async (payload: UserAdminCreate): Promise<User> => {
  const response = await apiClient.post<User>('/users/', payload)
  return response.data
}

export const updateUser = async (id: string, payload: UserAdminUpdate): Promise<User> => {
  const response = await apiClient.patch<User>(`/users/${id}`, payload)
  return response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`)
}

export const ROLES: readonly Role[] = ['admin', 'manager', 'user']