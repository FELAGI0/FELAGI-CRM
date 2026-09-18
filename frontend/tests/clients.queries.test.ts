import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { clientsKeys, useClients, useCreateClient, useDeleteClient, useUpdateClient } from '@/features/clients/clients.queries'
import { apiClient } from '@/lib/api-client'
import { makeClient, makePage } from './factories'

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

// gcTime is left at the default: 0 GCs queries whose fetch is still in flight,
// which surfaces as a stray rejection attributed to the test.
const makeWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useClients', () => {
  test('requests the collection endpoint with limit and offset', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([makeClient()], { total: 1 }) } as never)

    const { result } = renderHook(() => useClients({ limit: 20, offset: 0 }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Trailing slash matters: the bare path 307-redirects and drops auth.
    expect(mockedGet).toHaveBeenCalledWith('/clients/', { params: { limit: 20, offset: 0 } })
  })

  test('passes a non-zero offset through', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([], { total: 0 }) } as never)

    const { result } = renderHook(() => useClients({ limit: 10, offset: 20 }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith('/clients/', { params: { limit: 10, offset: 20 } })
  })
})

describe('useCreateClient', () => {
  test('posts to the collection endpoint and invalidates the clients cache', async () => {
    mockedPost.mockReset()
    mockedPost.mockResolvedValue({ data: makeClient() } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreateClient(), { wrapper })

    await result.current.mutateAsync({ name: 'New Co' })

    expect(mockedPost).toHaveBeenCalledWith('/clients/', { name: 'New Co' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: clientsKeys.all })
  })
})

describe('useUpdateClient', () => {
  test('patches the item endpoint and invalidates both list and detail', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: makeClient() } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateClient('client-1'), { wrapper })
    await result.current.mutateAsync({ name: 'Renamed' })

    expect(mockedPatch).toHaveBeenCalledWith('/clients/client-1', { name: 'Renamed' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: clientsKeys.all })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: clientsKeys.detail('client-1') })
  })
})

describe('useDeleteClient', () => {
  test('deletes the item and invalidates the list', async () => {
    mockedDelete.mockReset()
    mockedDelete.mockResolvedValue({ data: undefined } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteClient(), { wrapper })
    await result.current.mutateAsync('client-9')

    expect(mockedDelete).toHaveBeenCalledWith('/clients/client-9')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: clientsKeys.all })
  })
})

describe('clientsKeys', () => {
  test('list keys are scoped by params so pages cache separately', () => {
    expect(clientsKeys.list({ limit: 10, offset: 0 })).not.toEqual(
      clientsKeys.list({ limit: 10, offset: 10 }),
    )
    expect(clientsKeys.list({ limit: 10, offset: 0 })).toEqual([
      'clients',
      'list',
      { limit: 10, offset: 0 },
    ])
  })

  test('detail keys are scoped by id', () => {
    expect(clientsKeys.detail('a')).toEqual(['clients', 'detail', 'a'])
  })
})