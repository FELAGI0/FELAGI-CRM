import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { t } from '@/lib/i18n'
import type { Client, DealStatus } from '@/types/api'

export type DealsFiltersProps = {
  /** `null` means "all statuses". */
  status: DealStatus | null
  /** `null` means "all clients". */
  clientId: string | null
  clients: Client[]
  onStatusChange: (status: DealStatus | null) => void
  onClientChange: (clientId: string | null) => void
  /** Clears both filters in one URL update. */
  onReset: () => void
}

const STATUS_KEYS: readonly DealStatus[] = ['new', 'in_progress', 'won', 'lost']

/**
 * Base UI's Select treats `null` as "nothing selected", which maps exactly onto
 * our "no filter" state — so the "all" entry carries a null value rather than a
 * sentinel string that would otherwise be sent to the API as a real filter.
 *
 * `<SelectValue>` is given a render function because the raw value is an id or a
 * status key; supplying children also overrides `placeholder`, so the function
 * must return the placeholder text itself for the no-selection case.
 */
export const DealsFilters = ({
  status,
  clientId,
  clients,
  onStatusChange,
  onClientChange,
  onReset,
}: DealsFiltersProps) => {
  const hasActiveFilters = status !== null || clientId !== null
  const clientNames = new Map(clients.map((client) => [client.id, client.name]))

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
      <div className="flex w-full flex-col gap-2 sm:w-52">
        <label htmlFor="filter-status" className="text-sm font-medium text-text-primary">
          {t.filters.status}
        </label>
        <Select
          value={status}
          onValueChange={(value) => {
            onStatusChange(typeof value === 'string' ? (value as DealStatus) : null)
          }}
        >
          <SelectTrigger id="filter-status" className="w-full" aria-label={t.filters.filterByStatus}>
            <SelectValue placeholder={t.filters.all}>
              {(value: unknown) =>
                typeof value === 'string' ? t.status.deal[value as DealStatus] : t.filters.all
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>{t.filters.all}</SelectItem>
            {STATUS_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {t.status.deal[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-64">
        <label htmlFor="filter-client" className="text-sm font-medium text-text-primary">
          {t.filters.client}
        </label>
        <Select
          value={clientId}
          onValueChange={(value) => {
            onClientChange(typeof value === 'string' ? value : null)
          }}
        >
          <SelectTrigger id="filter-client" className="w-full" aria-label={t.filters.filterByClient}>
            <SelectValue placeholder={t.filters.allClients}>
              {(value: unknown) =>
                typeof value === 'string' ? (clientNames.get(value) ?? t.filters.allClients) : t.filters.allClients
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>{t.filters.allClients}</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={onReset}>
          {t.filters.resetFilters}
        </Button>
      )}
    </div>
  )
}