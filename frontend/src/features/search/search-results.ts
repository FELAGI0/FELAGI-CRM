import { formatAmountWithCurrency, type Currency } from '@/lib/currency'
import { t } from '@/lib/i18n'
import type { Client, Deal, Task } from '@/types/api'

export type SearchResultKind = 'client' | 'deal' | 'task'

/** Plural labels used for the palette's group headings. */
export type SearchGroupKind = 'clients' | 'deals' | 'tasks'

/**
 * A flattened, presentational result. Built here so the modal and the item
 * component share one shape and stay free of entity-specific logic.
 */
export type SearchResult = {
  /** Stable across groups, because entity ids are unique per table only. */
  id: string
  kind: SearchResultKind
  title: string
  subtitle: string | null
  /** Route to open when the row is chosen. */
  href: string
}

export const toClientResult = (client: Client): SearchResult => ({
  id: `client-${client.id}`,
  kind: 'client',
  title: client.name,
  subtitle: client.company ?? client.email,
  href: '/clients',
})

export const toDealResult = (deal: Deal, currency: Currency): SearchResult => ({
  id: `deal-${deal.id}`,
  kind: 'deal',
  title: deal.title,
  subtitle: [t.status.deal[deal.status], formatAmountWithCurrency(deal.amount, currency)]
    .filter(Boolean)
    .join(' · '),
  href: '/deals',
})

export const toTaskResult = (task: Task): SearchResult => ({
  id: `task-${task.id}`,
  kind: 'task',
  title: task.title,
  subtitle: [t.status.task[task.status], task.description].filter(Boolean).join(' · '),
  href: '/tasks',
})