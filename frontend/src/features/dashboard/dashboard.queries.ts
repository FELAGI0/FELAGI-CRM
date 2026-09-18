import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { formatMonthShort } from '@/lib/format'
import type { Client, Deal, DealStatus, Page, Task, TaskStatus } from '@/types/api'

/**
 * Collection routes are registered with a trailing slash on the backend
 * ("/deals/" etc.), so request "/deals/" rather than "/deals" to avoid a
 * 307 redirect that would drop the Authorization header.
 */
export const fetchPage = async <T>(path: string, params?: Record<string, string | number>): Promise<Page<T>> => {
  const response = await apiClient.get<Page<T>>(path, { params })
  return response.data
}

export type DashboardMetrics = {
  totalClients: number
  totalDeals: number
  newDeals: number
  inProgressDeals: number
  wonDeals: number
  lostDeals: number
  totalTasks: number
  todoTasks: number
  inProgressTasks: number
  doneTasks: number
  /** Won / (won + lost), as a 0–100 percentage. 0 when no deal is closed yet. */
  winRate: number
  activeDeals: number
  activeTasks: number
}

type MetricQuery = {
  key: string
  path: string
  params: Record<string, string | number>
}

const countMetric = (key: string, path: string, params: Record<string, string | number>): MetricQuery => ({
  key,
  path,
  params: { ...params, limit: 1 },
})

const metricQueries: MetricQuery[] = [
  countMetric('totalClients', '/clients/', {}),
  countMetric('totalDeals', '/deals/', {}),
  countMetric('newDeals', '/deals/', { status: 'new' satisfies DealStatus }),
  countMetric('inProgressDeals', '/deals/', { status: 'in_progress' satisfies DealStatus }),
  countMetric('wonDeals', '/deals/', { status: 'won' satisfies DealStatus }),
  countMetric('lostDeals', '/deals/', { status: 'lost' satisfies DealStatus }),
  countMetric('totalTasks', '/tasks/', {}),
  countMetric('todoTasks', '/tasks/', { status: 'todo' satisfies TaskStatus }),
  countMetric('inProgressTasks', '/tasks/', { status: 'in_progress' satisfies TaskStatus }),
  countMetric('doneTasks', '/tasks/', { status: 'done' satisfies TaskStatus }),
]

export const dashboardMetricKeys = metricQueries.map((query) => ['dashboard', 'metric', query.key, query.params] as const)

const readTotal = (result: UseQueryResult<Page<unknown>>): number => result.data?.total ?? 0

const percent = (part: number, whole: number): number => (whole === 0 ? 0 : Math.round((part / whole) * 100))

/** Aggregates a lot of tiny count queries into the metric row. */
export const aggregateMetrics = (totals: Record<string, number>): DashboardMetrics => {
  const won = totals.wonDeals ?? 0
  const lost = totals.lostDeals ?? 0
  return {
    totalClients: totals.totalClients ?? 0,
    totalDeals: totals.totalDeals ?? 0,
    newDeals: totals.newDeals ?? 0,
    inProgressDeals: totals.inProgressDeals ?? 0,
    wonDeals: won,
    lostDeals: lost,
    totalTasks: totals.totalTasks ?? 0,
    todoTasks: totals.todoTasks ?? 0,
    inProgressTasks: totals.inProgressTasks ?? 0,
    doneTasks: totals.doneTasks ?? 0,
    winRate: percent(won, won + lost),
    activeDeals: (totals.newDeals ?? 0) + (totals.inProgressDeals ?? 0),
    activeTasks: (totals.todoTasks ?? 0) + (totals.inProgressTasks ?? 0),
  }
}

export const useDashboardMetrics = () => {
  const results = useQueries({
    queries: metricQueries.map((query) => ({
      queryKey: ['dashboard', 'metric', query.key, query.params] as const,
      queryFn: () => fetchPage<unknown>(query.path, query.params),
    })),
  })

  const totals: Record<string, number> = {}
  metricQueries.forEach((query, index) => {
    const result = results[index]
    totals[query.key] = result ? readTotal(result) : 0
  })

  return {
    metrics: aggregateMetrics(totals),
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
  }
}

export const useRecentDeals = () =>
  useQuery({
    queryKey: ['dashboard', 'recent', 'deals'],
    queryFn: () => fetchPage<Deal>('/deals/', { limit: 5 }),
  })

export const useRecentTasks = () =>
  useQuery({
    queryKey: ['dashboard', 'recent', 'tasks'],
    queryFn: () => fetchPage<Task>('/tasks/', { limit: 5 }),
  })

export const useRecentClients = () =>
  useQuery({
    queryKey: ['dashboard', 'recent', 'clients'],
    queryFn: () => fetchPage<Client>('/clients/', { limit: 5 }),
  })

export type DealsChartPoint = {
  /** Month key, e.g. "2026-09". */
  month: string
  /** Localised short axis label, e.g. "сент. 26". */
  label: string
  count: number
}

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

/** Parses a "YYYY-MM" key back into the first day of that month. */
const monthDateFromKey = (key: string): Date | null => {
  const [year, month] = key.split('-')
  const yearNumber = Number(year)
  const monthNumber = Number(month)
  if (!Number.isFinite(yearNumber) || !Number.isFinite(monthNumber)) return null
  return new Date(yearNumber, monthNumber - 1, 1)
}

const monthLabel = (key: string): string => {
  const date = monthDateFromKey(key)
  return date ? formatMonthShort(date) : key
}

/**
 * Buckets deals into the last `months` calendar months (oldest first) so the
 * chart has a continuous axis instead of only the months that have deals.
 */
export const buildDealsByMonth = (deals: Deal[], months = 6, now = new Date()): DealsChartPoint[] => {
  const keys: string[] = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - offset, 1)))
  }

  const counts = new Map<string, number>(keys.map((key) => [key, 0]))
  for (const deal of deals) {
    const created = new Date(deal.created_at)
    if (Number.isNaN(created.getTime())) continue
    const key = monthKey(created)
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return keys.map((key) => ({ month: key, label: monthLabel(key), count: counts.get(key) ?? 0 }))
}

export const useDealsChartData = () => {
  const query = useQuery({
    queryKey: ['dashboard', 'chart', 'deals'],
    queryFn: () => fetchPage<Deal>('/deals/', { limit: 100 }),
  })

  return {
    ...query,
    points: buildDealsByMonth(query.data?.items ?? []),
  }
}