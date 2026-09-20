import { apiClient } from '@/lib/api-client'
import type { ChangePasswordRequest, User, UserUpdateMe } from '@/types/api'

/**
 * The self-service routes live under `/users/me` and are available to every
 * authenticated user, unlike the admin `/users/` collection. No trailing slash
 * applies here: `/me` is a single resource, not a collection.
 */
export const updateMe = async (payload: UserUpdateMe): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me', payload)
  return response.data
}

export const changePassword = async (payload: ChangePasswordRequest): Promise<void> => {
  await apiClient.post('/users/me/change-password', payload)
}