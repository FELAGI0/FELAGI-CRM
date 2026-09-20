import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  usersKeys,
  useUsers,
} from '@/features/users/users.queries'
import { apiClient } from '@/lib/api-client'
import { makePage, makeUser } from './factories'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPatch = vi.mocked(apiClient.patch)
const mockedDelete = vi.mocked(apiClient.delete)

// gcTime is left at the default: 0 GCs a query whose fetch is still in flight,
// which surfaces as a stray rejection attributed to the test.
const makeWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUsers', () => {
  test('requests the users collection with limit and offset', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([makeUser()], { total: 1 }) } as never)

    const { result } = renderHook(() => useUsers({ limit: 20, offset: 0 }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Trailing slash matters: the bare path 307-redirects and drops auth.
    expect(mockedGet).toHaveBeenCalledWith('/users/', { params: { limit: 20, offset: 0 } })
  })

  test('omits undefined parameters', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([]) } as never)

    const { result } = renderHook(() => useUsers({}), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledWith('/users/', { params: {} })
  })
})

describe('useCreateUser', () => {
  test('posts to the collection endpoint', async () => {
    mockedPost.mockReset()
    mockedPost.mockResolvedValue({ data: makeUser({ email: 'new@example.com' }) } as never)

    const { result } = renderHook(() => useCreateUser(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({
      email: 'new@example.com',
      password: 'AnotherPassword123',
      role: 'manager',
    })

    expect(mockedPost).toHaveBeenCalledWith('/users/', {
      email: 'new@example.com',
      password: 'AnotherPassword123',
      role: 'manager',
    })
  })

  test('surfaces a duplicate-email conflict', async () => {
    mockedPost.mockReset()
    mockedPost.mockRejectedValue(new Error('Email already registered'))

    const { result } = renderHook(() => useCreateUser(), { wrapper: makeWrapper() })

    await expect(
      result.current.mutateAsync({
        email: 'admin@example.com',
        password: 'AnotherPassword123',
        role: 'user',
      }),
    ).rejects.toThrow('Email already registered')
  })
})

describe('useUpdateUser', () => {
  test('patches the single-user endpoint', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: makeUser({ role: 'manager' }) } as never)

    const { result } = renderHook(() => useUpdateUser('user-1'), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ role: 'manager' })

    expect(mockedPatch).toHaveBeenCalledWith('/users/user-1', { role: 'manager' })
  })

  test('sends an is_active change on its own', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: makeUser({ is_active: false }) } as never)

    const { result } = renderHook(() => useUpdateUser('user-1'), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ is_active: false })

    expect(mockedPatch).toHaveBeenCalledWith('/users/user-1', { is_active: false })
  })
})

describe('useDeleteUser', () => {
  test('issues a delete for the given id', async () => {
    mockedDelete.mockReset()
    mockedDelete.mockResolvedValue({} as never)

    const { result } = renderHook(() => useDeleteUser(), { wrapper: makeWrapper() })
    await result.current.mutateAsync('user-1')

    expect(mockedDelete).toHaveBeenCalledWith('/users/user-1')
  })

  test('propagates a related-records conflict', async () => {
    mockedDelete.mockReset()
    mockedDelete.mockRejectedValue(new Error('User has related records'))

    const { result } = renderHook(() => useDeleteUser(), { wrapper: makeWrapper() })

    await expect(result.current.mutateAsync('user-1')).rejects.toThrow('User has related records')
  })
})

describe('usersKeys', () => {
  test('namespaces list keys by params', () => {
    expect(usersKeys.all).toEqual(['users'])
    expect(usersKeys.list({ limit: 20, offset: 0 })).toEqual(['users', 'list', { limit: 20, offset: 0 }])
  })
})