import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import {
  aggregateMetrics,
  buildDealsByMonth,
  useDashboardMetrics,
  useDealsChartData,
  useRecentClients,
  useRecentDeals,
  useRecentTasks,
} from '@/features/dashboard/dashboard.queries'
import { apiClient } from '@/lib/api-client'
import { makeClient, makeDeal, makePage, makeTask } from './factories'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

const mockedGet = vi.mocked(apiClient.get)

// createElement instead of JSX so this stays a .ts module.
// gcTime is left at the default: a 0 here GCs the query while its fetch is in
// flight, which surfaces as an unhandled rejection instead of an error state.
const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

/** Routes each GET to a canned Page payload, keyed by path + status param. */
const readStatusParam = (config: { params?: unknown } | undefined): string | undefined => {
  const params = config?.params
  if (typeof params !== 'object' || params === null) return undefined
  const status = (params as Record<string, unknown>).status
  return typeof status === 'string' ? status : undefined
}

const respondWith = (totals: Record<string, number>) => {
  mockedGet.mockImplementation((url, config) => {
    const key = readStatusParam(config) ?? url
    const total = totals[key] ?? 0
    return Promise.resolve({ data: makePage([], { total }) } as never)
  })
}

const rejectWith = (message: string) => {
  mockedGet.mockImplementation(() => Promise.reject(new Error(message)))
}

/**
 * Resets the mock at the start of each test instead of in a beforeEach.
 * Vitest's mockReset() inside beforeEach clears the implementation of a mock
 * that a previous test's on-screen queries are still awaiting, and the resulting
 * rejections are then attributed to the current test as stray errors.
 */
const resetMock = () => mockedGet.mockReset()

describe('useDashboardMetrics', () => {
  test('requests every metric endpoint with limit=1', async () => {
    resetMock()
    respondWith({})
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const calls = mockedGet.mock.calls.map(([url, config]) => ({
      url,
      params: (config as { params?: Record<string, unknown> } | undefined)?.params ?? {},
    }))

    expect(calls).toHaveLength(10)
    expect(calls.every((call) => call.params.limit === 1)).toBe(true)

    const urls = calls.map((call) => call.url)
    expect(urls.filter((url) => url === '/clients/')).toHaveLength(1)
    expect(urls.filter((url) => url === '/deals/')).toHaveLength(5)
    expect(urls.filter((url) => url === '/tasks/')).toHaveLength(4)

    const statuses = calls.map((call) => call.params.status).filter(Boolean)
    expect(statuses).toEqual(
      expect.arrayContaining(['new', 'in_progress', 'won', 'lost', 'todo', 'done']),
    )
  })

  test('aggregates totals from each response', async () => {
    resetMock()
    respondWith({
      '/clients/': 12,
      '/deals/': 30,
      new: 7,
      in_progress: 5,
      won: 14,
      lost: 4,
      '/tasks/': 21,
      todo: 9,
      done: 8,
    })

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.metrics).toMatchObject({
      totalClients: 12,
      totalDeals: 30,
      newDeals: 7,
      inProgressDeals: 5,
      wonDeals: 14,
      lostDeals: 4,
      totalTasks: 21,
      todoTasks: 9,
      doneTasks: 8,
      // activeDeals = new(7) + in_progress(5); activeTasks = todo(9) + in_progress(5).
      // Both in_progress queries share the "in_progress" key, so both read 5.
      activeDeals: 12,
      activeTasks: 14,
    })

    expect(result.current.metrics.winRate).toBe(78)
  })

  test('flags isError when a request fails', async () => {
    resetMock()
    rejectWith('boom')
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockedGet.mock.calls).toHaveLength(10)
    expect(result.current.metrics.totalDeals).toBe(0)
  })
})

describe('aggregateMetrics', () => {
  test('computes win rate from closed deals only', () => {
    expect(aggregateMetrics({ wonDeals: 3, lostDeals: 1 }).winRate).toBe(75)
    expect(aggregateMetrics({ wonDeals: 2, lostDeals: 2 }).winRate).toBe(50)
  })

  test('avoids division by zero when nothing is closed', () => {
    expect(aggregateMetrics({}).winRate).toBe(0)
    expect(aggregateMetrics({ wonDeals: 0, lostDeals: 0 }).winRate).toBe(0)
  })
})

describe('recent activity queries', () => {
  test('useRecentDeals requests five deals', async () => {
    resetMock()
    mockedGet.mockResolvedValue({ data: makePage([makeDeal()]) } as never)
    const { result } = renderHook(() => useRecentDeals(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockedGet).toHaveBeenCalledWith('/deals/', { params: { limit: 5 } })
  })

  test('useRecentTasks requests five tasks', async () => {
    resetMock()
    mockedGet.mockResolvedValue({ data: makePage([makeTask()]) } as never)
    const { result } = renderHook(() => useRecentTasks(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockedGet).toHaveBeenCalledWith('/tasks/', { params: { limit: 5 } })
  })

  test('useRecentClients requests five clients', async () => {
    resetMock()
    mockedGet.mockResolvedValue({ data: makePage([makeClient()]) } as never)
    const { result } = renderHook(() => useRecentClients(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockedGet).toHaveBeenCalledWith('/clients/', { params: { limit: 5 } })
  })

  test('useDealsChartData requests up to 100 deals and buckets them', async () => {
    resetMock()
    mockedGet.mockResolvedValue({ data: makePage([makeDeal()]) } as never)
    const { result } = renderHook(() => useDealsChartData(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockedGet).toHaveBeenCalledWith('/deals/', { params: { limit: 100 } })
    expect(result.current.points).toHaveLength(6)
  })
})

describe('buildDealsByMonth', () => {
  const now = new Date('2026-09-18T00:00:00Z')

  test('returns a continuous six month axis ending with the current month', () => {
    const points = buildDealsByMonth([], 6, now)
    expect(points.map((point) => point.month)).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ])
    expect(points.every((point) => point.count === 0)).toBe(true)
    expect(points.at(-1)?.label).toBe('Sep 26')
  })

  // Buckets are computed in the viewer's local time, so the fixtures stay away
  // from month boundaries (a UTC instant late on the last day can already be
  // the next month for a UTC+3 viewer such as this repo's dev machine).
  test('counts deals into their created month', () => {
    const deals = [
      makeDeal({ id: 'a', created_at: '2026-09-01T12:00:00Z' }),
      makeDeal({ id: 'b', created_at: '2026-09-20T12:00:00Z' }),
      makeDeal({ id: 'c', created_at: '2026-07-15T12:00:00Z' }),
    ]
    const points = buildDealsByMonth(deals, 6, now)
    const byMonth = Object.fromEntries(points.map((point) => [point.month, point.count]))
    expect(byMonth).toMatchObject({ '2026-07': 1, '2026-09': 2 })
    expect(byMonth['2026-08']).toBe(0)
  })

  test('buckets by local month, not UTC month', () => {
    // Viewed from October, a deal created 2026-09-30T23:00Z is already
    // 2026-10-01 in any UTC+ timezone and must land in the local October bucket.
    const localNow = new Date('2026-10-15T12:00:00Z')
    const edge = new Date('2026-09-30T23:00:00Z')
    const expectedMonth = `${edge.getFullYear()}-${String(edge.getMonth() + 1).padStart(2, '0')}`

    const deals = [makeDeal({ id: 'edge', created_at: '2026-09-30T23:00:00Z' })]
    const points = buildDealsByMonth(deals, 6, localNow)

    expect(points.reduce((sum, point) => sum + point.count, 0)).toBe(1)
    expect(points.find((point) => point.count === 1)?.month).toBe(expectedMonth)
  })

  test('ignores deals outside the window and unparseable dates', () => {
    const deals = [
      makeDeal({ id: 'old', created_at: '2020-01-01T00:00:00Z' }),
      makeDeal({ id: 'bad', created_at: 'not-a-date' }),
    ]
    const points = buildDealsByMonth(deals, 6, now)
    expect(points.reduce((sum, point) => sum + point.count, 0)).toBe(0)
  })
})