import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { useAuthStore } from '@/features/auth/auth.store'
import { useChangePassword, useUpdateMe } from '@/features/profile/profile.queries'
import { apiClient } from '@/lib/api-client'
import { makeUser } from './factories'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedPost = vi.mocked(apiClient.post)
const mockedPatch = vi.mocked(apiClient.patch)

const makeWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
})

describe('useUpdateMe', () => {
  test('patches /users/me with the payload', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: makeUser({ name: 'Иван' }) } as never)

    const { result } = renderHook(() => useUpdateMe(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ name: 'Иван' })

    // No trailing slash: /me is a single resource, not a collection.
    expect(mockedPatch).toHaveBeenCalledWith('/users/me', { name: 'Иван' })
  })

  test('writes the returned user into the auth store', async () => {
    const updated = makeUser({ name: 'Иван Петров', email: 'ivan@example.com' })
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: updated } as never)

    const { result } = renderHook(() => useUpdateMe(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ name: 'Иван Петров' })

    await waitFor(() => expect(useAuthStore.getState().user).toEqual(updated))
  })

  test('propagates a duplicate-email conflict', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockRejectedValue(new Error('Email already registered'))

    const { result } = renderHook(() => useUpdateMe(), { wrapper: makeWrapper() })

    await expect(result.current.mutateAsync({ email: 'taken@example.com' })).rejects.toThrow(
      'Email already registered',
    )
  })

  test('leaves the stored user untouched when the request fails', async () => {
    const original = makeUser({ name: 'Прежнее' })
    useAuthStore.setState({ user: original })
    mockedPatch.mockReset()
    mockedPatch.mockRejectedValue(new Error('Email already registered'))

    const { result } = renderHook(() => useUpdateMe(), { wrapper: makeWrapper() })
    await expect(result.current.mutateAsync({ email: 'taken@example.com' })).rejects.toThrow()

    expect(useAuthStore.getState().user).toEqual(original)
  })
})

describe('useChangePassword', () => {
  test('posts to /users/me/change-password', async () => {
    mockedPost.mockReset()
    mockedPost.mockResolvedValue({ status: 204 } as never)

    const { result } = renderHook(() => useChangePassword(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({
      current_password: 'StrongPassword123',
      new_password: 'BrandNewPassword456',
    })

    expect(mockedPost).toHaveBeenCalledWith('/users/me/change-password', {
      current_password: 'StrongPassword123',
      new_password: 'BrandNewPassword456',
    })
  })

  test('propagates a wrong-current-password rejection', async () => {
    mockedPost.mockReset()
    mockedPost.mockRejectedValue(new Error('Invalid current password'))

    const { result } = renderHook(() => useChangePassword(), { wrapper: makeWrapper() })

    await expect(
      result.current.mutateAsync({
        current_password: 'WrongPassword123',
        new_password: 'BrandNewPassword456',
      }),
    ).rejects.toThrow('Invalid current password')
  })

  test('does not touch the auth store', async () => {
    const user = makeUser()
    useAuthStore.setState({ user })
    mockedPost.mockReset()
    mockedPost.mockResolvedValue({ status: 204 } as never)

    const { result } = renderHook(() => useChangePassword(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({
      current_password: 'StrongPassword123',
      new_password: 'BrandNewPassword456',
    })

    // Tokens stay valid after a password change, so the session is untouched.
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})