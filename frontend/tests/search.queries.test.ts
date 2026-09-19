import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import {
  filterClients,
  filterDeals,
  filterTasks,
  matchesQuery,
  MIN_QUERY_LENGTH,
  SEARCH_LIMIT,
  searchKeys,
  useSearchClients,
  useSearchDeals,
  useSearchTasks,
} from '@/features/search/search.queries'
import { apiClient } from '@/lib/api-client'
import { makeClient, makeDeal, makePage, makeTask } from './factories'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)

// gcTime is left at the default: 0 GCs a query whose fetch is still in flight,
// which surfaces as a stray rejection attributed to the test.
const makeWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('matchesQuery', () => {
  test('matches a substring case-insensitively', () => {
    expect(matchesQuery('Партнёрская интеграция', 'партнёр')).toBe(true)
    expect(matchesQuery('Wayne Enterprises', 'wayne')).toBe(true)
    expect(matchesQuery('Wayne Enterprises', 'WAYNE')).toBe(true)
  })

  test('matches in the middle of a word, not only at the start', () => {
    expect(matchesQuery('Автоматизация тикетов', 'тикет')).toBe(true)
    expect(matchesQuery('E-commerce replatform', 'commerce')).toBe(true)
  })

  test('rejects a non-match and empty haystacks', () => {
    expect(matchesQuery('Stark Industries', 'wayne')).toBe(false)
    expect(matchesQuery(null, 'wayne')).toBe(false)
    expect(matchesQuery(undefined, 'wayne')).toBe(false)
    expect(matchesQuery('', 'wayne')).toBe(false)
  })
})

describe('filters', () => {
  const clients = [
    makeClient({ id: 'c1', name: 'Wayne Enterprises', company: 'Wayne', email: 'bids@wayne.test' }),
    makeClient({ id: 'c2', name: 'Acme Corp', company: 'Acme', email: 'hello@acme.test' }),
  ]

  test('filterClients matches name, company, or email', () => {
    expect(filterClients(clients, 'wayne').map((c) => c.id)).toEqual(['c1'])
    // Unambiguous only because c1's email no longer contains "acme".
    expect(filterClients(clients, 'acme').map((c) => c.id)).toEqual(['c2'])
    // A match on the email domain, which no name or company contains.
    expect(filterClients(clients, 'wayne.test').map((c) => c.id)).toEqual(['c1'])
  })

  test('filterDeals matches the title only', () => {
    const deals = [
      makeDeal({ id: 'd1', title: 'Партнёрская интеграция' }),
      makeDeal({ id: 'd2', title: 'Редизайн сайта' }),
    ]
    expect(filterDeals(deals, 'ПАРТНЁР').map((d) => d.id)).toEqual(['d1'])
    expect(filterDeals(deals, 'сайт').map((d) => d.id)).toEqual(['d2'])
    expect(filterDeals(deals, 'nothing')).toEqual([])
  })

  test('filterTasks matches the title or the description', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Организовать выезд', description: null }),
      makeTask({ id: 't2', title: 'Позвонить', description: 'Согласовать бюджет' }),
    ]
    expect(filterTasks(tasks, 'организ').map((t) => t.id)).toEqual(['t1'])
    // t2 matches through its description, not its title.
    expect(filterTasks(tasks, 'бюджет').map((t) => t.id)).toEqual(['t2'])
    expect(filterTasks(tasks, 'zzz')).toEqual([])
  })
})

describe('useSearchClients', () => {
  test('requests the clients collection with the search limit', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([makeClient()]) } as never)

    const { result } = renderHook(() => useSearchClients('wayne'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Trailing slash matters: the bare path 307-redirects and drops auth.
    expect(mockedGet).toHaveBeenCalledWith('/clients/', {
      params: { limit: SEARCH_LIMIT, offset: 0 },
    })
  })

  test('returns only the matching items', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({
      data: makePage([
        makeClient({ id: 'c1', name: 'Wayne Enterprises' }),
        makeClient({ id: 'c2', name: 'Stark Industries' }),
      ]),
    } as never)

    const { result } = renderHook(() => useSearchClients('wayne'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.map((c) => c.id)).toEqual(['c1'])
  })

  test('does not fetch until the query reaches the minimum length', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([makeClient()]) } as never)

    const { result } = renderHook(() => useSearchClients('w'), { wrapper: makeWrapper() })
    // Give the debounce a chance to flush before asserting the absence of a call.
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
    expect('w'.length).toBeLessThan(MIN_QUERY_LENGTH)
  })
})

describe('useSearchDeals', () => {
  test('requests the deals collection and filters by title', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({
      data: makePage([
        makeDeal({ id: 'd1', title: 'Партнёрская интеграция' }),
        makeDeal({ id: 'd2', title: 'Редизайн сайта' }),
      ]),
    } as never)

    const { result } = renderHook(() => useSearchDeals('партнёр'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledWith('/deals/', { params: { limit: SEARCH_LIMIT, offset: 0 } })
    expect(result.current.data?.map((d) => d.id)).toEqual(['d1'])
  })
})

describe('useSearchTasks', () => {
  test('requests the tasks collection and filters by title', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({
      data: makePage([
        makeTask({ id: 't1', title: 'Организовать выезд' }),
        makeTask({ id: 't2', title: 'Собрать подписи' }),
      ]),
    } as never)

    const { result } = renderHook(() => useSearchTasks('организ'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledWith('/tasks/', { params: { limit: SEARCH_LIMIT, offset: 0 } })
    expect(result.current.data?.map((t) => t.id)).toEqual(['t1'])
  })
})

describe('searchKeys', () => {
  test('namespaces keys per collection and query', () => {
    expect(searchKeys.all).toEqual(['search'])
    expect(searchKeys.clients('wayne')).toEqual(['search', 'clients', 'wayne'])
    expect(searchKeys.deals('партнёр')).toEqual(['search', 'deals', 'партнёр'])
    expect(searchKeys.tasks('организ')).toEqual(['search', 'tasks', 'организ'])
  })
})