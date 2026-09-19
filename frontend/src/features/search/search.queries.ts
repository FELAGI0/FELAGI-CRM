import { useQuery } from '@tanstack/react-query'

import { listClients } from '@/features/clients/clients.api'
import { listDeals } from '@/features/deals/deals.api'
import { listTasks } from '@/features/tasks/tasks.api'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import type { Client, Deal, Page, Task } from '@/types/api'

/**
 * The list endpoints are the only search surface available: there is no
 * `/search` route on the API. Each collection is fetched once with a large
 * limit and then filtered in the browser, which keeps the backend untouched.
 *
 * MVP limitation: only the first 100 records per collection are searchable. A
 * real search endpoint or server-side `q` filter would be needed beyond that.
 */
export const SEARCH_LIMIT = 100

/** Requests are held until the query is long enough to be meaningful. */
export const MIN_QUERY_LENGTH = 2

/** Keeps typing from firing a request per keystroke. */
export const SEARCH_DEBOUNCE_MS = 200

/** How many matches are shown per group in the palette. */
export const GROUP_LIMIT = 5

export const searchKeys = {
  all: ['search'] as const,
  clients: (query: string) => ['search', 'clients', query] as const,
  deals: (query: string) => ['search', 'deals', query] as const,
  tasks: (query: string) => ['search', 'tasks', query] as const,
}

/**
 * Case-insensitive substring match. `toLocaleLowerCase` without a locale
 * argument uses the runtime default, which handles Cyrillic correctly.
 */
export const matchesQuery = (haystack: string | null | undefined, query: string): boolean => {
  if (!haystack) return false
  return haystack.toLocaleLowerCase().includes(query.toLocaleLowerCase())
}

/** Clients match on name, company, or email — the fields the palette shows. */
export const filterClients = (clients: readonly Client[], query: string): Client[] =>
  clients.filter(
    (client) =>
      matchesQuery(client.name, query) ||
      matchesQuery(client.company, query) ||
      matchesQuery(client.email, query),
  )

/** Deals match on their title. */
export const filterDeals = (deals: readonly Deal[], query: string): Deal[] =>
  deals.filter((deal) => matchesQuery(deal.title, query))

/** Tasks match on title or description. */
export const filterTasks = (tasks: readonly Task[], query: string): Task[] =>
  tasks.filter((task) => matchesQuery(task.title, query) || matchesQuery(task.description, query))

const useSearchQuery = (query: string) => useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)

export const useSearchClients = (query: string) => {
  const debounced = useSearchQuery(query)
  return useQuery<Page<Client>, Error, Client[]>({
    queryKey: searchKeys.clients(debounced),
    queryFn: () => listClients({ limit: SEARCH_LIMIT, offset: 0 }),
    enabled: debounced.length >= MIN_QUERY_LENGTH,
    select: (page) => filterClients(page.items, debounced),
  })
}

export const useSearchDeals = (query: string) => {
  const debounced = useSearchQuery(query)
  return useQuery<Page<Deal>, Error, Deal[]>({
    queryKey: searchKeys.deals(debounced),
    queryFn: () => listDeals({ limit: SEARCH_LIMIT, offset: 0 }),
    enabled: debounced.length >= MIN_QUERY_LENGTH,
    select: (page) => filterDeals(page.items, debounced),
  })
}

export const useSearchTasks = (query: string) => {
  const debounced = useSearchQuery(query)
  return useQuery<Page<Task>, Error, Task[]>({
    queryKey: searchKeys.tasks(debounced),
    queryFn: () => listTasks({ limit: SEARCH_LIMIT, offset: 0 }),
    enabled: debounced.length >= MIN_QUERY_LENGTH,
    select: (page) => filterTasks(page.items, debounced),
  })
}