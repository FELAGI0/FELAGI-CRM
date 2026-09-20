import { useMutation } from '@tanstack/react-query'

import { useAuthStore } from '@/features/auth/auth.store'
import type { ChangePasswordRequest, User, UserUpdateMe } from '@/types/api'

import { changePassword, updateMe } from './profile.api'

/**
 * Writes the updated user into the auth store so the sidebar and any other
 * consumer reflect a new name or email immediately, without a refetch.
 */
export const useUpdateMe = () => {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: (payload: UserUpdateMe) => updateMe(payload),
    onSuccess: (user: User) => setUser(user),
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (payload: ChangePasswordRequest) => changePassword(payload),
  })