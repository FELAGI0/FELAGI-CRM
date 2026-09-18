import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { dealsKeys, useCreateDeal, useDeal, useDeals, useDeleteDeal, useUpdateDeal } from '@/features/deals/deals.queries'
import { apiClient } from '@/lib/api-client'
import { makeClient, makeDeal, makePage } from './factories'

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

const CLIENT_A = '11111111-1111-4111-8111-111111111111'
const CLIENT_B = '44444444-4444-4444-8444-444444444444'

// gcTime is left at the default: 0 GCs queries whose fetch is still in flight,
// which surfaces as a stray rejection attributed to the test.
const makeClient_ = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDeals', () => {
  test('requests the collection endpoint with a trailing slash', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([makeDeal()], { total: 1 }) } as never)

    const { result } = renderHook(() => useDeals({ limit: 20, offset: 0 }), {
      wrapper: makeClient_(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // The bare path 307-redirects and the redirect drops the Authorization header.
    expect(mockedGet).toHaveBeenCalledWith('/deals/', { params: { limit: 20, offset: 0 } })
  })

  test('sends only the non-empty filters', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([], { total: 0 }) } as never)

    const { result } = renderHook(
      () => useDeals({ limit: 20, offset: 0, status: 'won', client_id: CLIENT_A }),
      { wrapper: makeClient_() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith('/deals/', {
      params: { limit: 20, offset: 0, status: 'won', client_id: CLIENT_A },
    })
  })

  test('omits a status that is not set rather than sending it empty', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([], { total: 0 }) } as never)

    const { result } = renderHook(() => useDeals({ limit: 20, offset: 0, status: undefined }), {
      wrapper: makeClient_(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // A present-but-empty `status=` makes the backend match nothing, so the key
    // must not appear at all.
    const params = mockedGet.mock.calls[0]?.[1]?.params as Record<string, unknown>
    expect(params).not.toHaveProperty('status')
    expect(params).toEqual({ limit: 20, offset: 0 })
  })

  test('omits a client filter that is not set', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([], { total: 0 }) } as never)

    const { result } = renderHook(() => useDeals({ limit: 20, offset: 0, client_id: undefined }), {
      wrapper: makeClient_(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const params = mockedGet.mock.calls[0]?.[1]?.params as Record<string, unknown>
    expect(params).not.toHaveProperty('client_id')
  })

  test('passes a non-zero offset through with a filter', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([], { total: 0 }) } as never)

    const { result } = renderHook(() => useDeals({ limit: 5, offset: 10, client_id: CLIENT_B }), {
      wrapper: makeClient_(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith('/deals/', {
      params: { limit: 5, offset: 10, client_id: CLIENT_B },
    })
  })
})

describe('useDeal', () => {
  test('requests the item endpoint', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makeDeal() } as never)

    const { result } = renderHook(() => useDeal('deal-1'), { wrapper: makeClient_() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith('/deals/deal-1')
  })

  test('stays idle without an id', () => {
    mockedGet.mockReset()
    renderHook(() => useDeal(''), { wrapper: makeClient_() })
    expect(mockedGet).not.toHaveBeenCalled()
  })
})

describe('useCreateDeal', () => {
  test('posts the payload and invalidates every deals query', async () => {
    mockedPost.mockReset()
    mockedPost.mockResolvedValue({ data: makeDeal() } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreateDeal(), { wrapper })

    await result.current.mutateAsync({
      title: 'Внедрение',
      amount: '100.50',
      status: 'new',
      client_id: CLIENT_A,
    })

    expect(mockedPost).toHaveBeenCalledWith('/deals/', {
      title: 'Внедрение',
      amount: '100.50',
      status: 'new',
      client_id: CLIENT_A,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: dealsKeys.all })
  })
})

describe('useUpdateDeal', () => {
  test('patches the item and invalidates both list and detail', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: makeDeal() } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateDeal('deal-7'), { wrapper })
    await result.current.mutateAsync({ status: 'won' })

    expect(mockedPatch).toHaveBeenCalledWith('/deals/deal-7', { status: 'won' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: dealsKeys.all })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: dealsKeys.detail('deal-7') })
  })
})

describe('useDeleteDeal', () => {
  test('deletes the item and invalidates the list', async () => {
    mockedDelete.mockReset()
    mockedDelete.mockResolvedValue({ data: undefined } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteDeal(), { wrapper })
    await result.current.mutateAsync('deal-9')

    expect(mockedDelete).toHaveBeenCalledWith('/deals/deal-9')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: dealsKeys.all })
  })
})

describe('dealsKeys', () => {
  test('list keys are scoped by the whole param set', () => {
    expect(dealsKeys.list({ limit: 10, offset: 0 })).not.toEqual(dealsKeys.list({ limit: 10, offset: 10 }))
    expect(dealsKeys.list({ limit: 10, offset: 0 })).not.toEqual(
      dealsKeys.list({ limit: 10, offset: 0, status: 'won' }),
    )
    expect(dealsKeys.list({ limit: 10, offset: 0 })).not.toEqual(
      dealsKeys.list({ limit: 10, offset: 0, client_id: makeClient().id }),
    )
  })

  test('list keys keep their documented shape', () => {
    expect(dealsKeys.list({ limit: 10, offset: 0 })).toEqual(['deals', 'list', { limit: 10, offset: 0 }])
  })

  test('detail keys are scoped by id', () => {
    expect(dealsKeys.detail('a')).toEqual(['deals', 'detail', 'a'])
  })

  test('the root key covers lists and details', () => {
    expect(dealsKeys.all).toEqual(['deals'])
  })
})