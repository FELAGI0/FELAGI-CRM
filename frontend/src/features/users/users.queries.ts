import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Page, User, UserAdminCreate, UserAdminUpdate } from '@/types/api'

import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type UserListParams,
} from './users.api'

export const usersKeys = {
  all: ['users'] as const,
  list: (params: UserListParams) => ['users', 'list', params] as const,
}

export const useUsers = (params: UserListParams) =>
  useQuery<Page<User>>({
    queryKey: usersKeys.list(params),
    queryFn: () => listUsers(params),
    placeholderData: (previous) => previous,
  })

/**
 * Every mutation invalidates the whole `users` namespace: the list, and any
 * other cached page of it, since a role or active change is visible everywhere.
 */
const useInvalidateUsers = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: usersKeys.all })
}

export const useCreateUser = () => {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (payload: UserAdminCreate) => createUser(payload),
    onSuccess: () => void invalidate(),
  })
}

export const useUpdateUser = (id: string) => {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (payload: UserAdminUpdate) => updateUser(id, payload),
    onSuccess: () => void invalidate(),
  })
}

export const useDeleteUser = () => {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => void invalidate(),
  })
}