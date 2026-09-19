import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { t } from '@/lib/i18n'
import type { Deal, TaskStatus } from '@/types/api'

import { ASSIGNEE_MINE, UNASSIGNED_VALUE } from './task-filter-values'

export type TaskFiltersProps = {
  status: TaskStatus | null
  assignedTo: string | null
  dealId: string | null
  deals: Deal[]
  /** Managers and admins additionally get "unassigned"; a user only sees theirs. */
  canSeeUnassigned: boolean
  onStatusChange: (status: TaskStatus | null) => void
  onAssigneeChange: (assignedTo: string | null) => void
  onDealChange: (dealId: string | null) => void
  onReset: () => void
}

const STATUS_KEYS: readonly TaskStatus[] = ['todo', 'in_progress', 'done']

const FilterSelect = ({
  id,
  label,
  ariaLabel,
  value,
  placeholder,
  onChange,
  renderValue,
  children,
}: {
  id: string
  label: string
  ariaLabel: string
  value: string | null
  placeholder: string
  onChange: (value: string | null) => void
  /** Maps the raw value to its label; without it the trigger shows the raw value. */
  renderValue?: (value: string) => string
  children: React.ReactNode
}) => (
  <div className="flex w-full flex-col gap-2 sm:w-52">
    <label htmlFor={id} className="text-sm font-medium text-text-primary">
      {label}
    </label>
    <Select
      value={value}
      onValueChange={(next) => {
        onChange(typeof next === 'string' ? next : null)
      }}
    >
      <SelectTrigger id={id} className="w-full" aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder}>
          {(current: unknown) =>
            typeof current === 'string'
              ? (renderValue?.(current) ?? current)
              : placeholder
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  </div>
)

export const TaskFilters = ({
  status,
  assignedTo,
  dealId,
  deals,
  canSeeUnassigned,
  onStatusChange,
  onAssigneeChange,
  onDealChange,
  onReset,
}: TaskFiltersProps) => {
  const hasActiveFilters = status !== null || assignedTo !== null || dealId !== null

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
      <FilterSelect
        id="filter-task-status"
        label={t.tasks.filters.status}
        ariaLabel={t.tasks.filters.filterByStatus}
        value={status}
        placeholder={t.tasks.filters.all}
        onChange={(value) => onStatusChange(value === null ? null : (value as TaskStatus))}
        renderValue={(value) => t.status.task[value as TaskStatus]}
      >
        <SelectItem value={null}>{t.tasks.filters.all}</SelectItem>
        {STATUS_KEYS.map((key) => (
          <SelectItem key={key} value={key}>
            {t.status.task[key]}
          </SelectItem>
        ))}
      </FilterSelect>

      <FilterSelect
        id="filter-task-assignee"
        label={t.tasks.filters.assignee}
        ariaLabel={t.tasks.filters.filterByAssignee}
        value={assignedTo}
        placeholder={t.tasks.filters.allAssignees}
        onChange={onAssigneeChange}
        renderValue={(value) =>
          value === ASSIGNEE_MINE
            ? t.tasks.filters.mine
            : value === UNASSIGNED_VALUE
              ? t.tasks.filters.unassigned
              : t.tasks.filters.allAssignees
        }
      >
        <SelectItem value={null}>{t.tasks.filters.allAssignees}</SelectItem>
        <SelectItem value={ASSIGNEE_MINE}>{t.tasks.filters.mine}</SelectItem>
        {canSeeUnassigned && (
          // Empty string is not a valid UUID, so it cannot collide with a real
          // assignee; the page maps it to the backend's "assigned_to is null".
          <SelectItem value={UNASSIGNED_VALUE}>{t.tasks.filters.unassigned}</SelectItem>
        )}
      </FilterSelect>

      <FilterSelect
        id="filter-task-deal"
        label={t.tasks.filters.deal}
        ariaLabel={t.tasks.filters.filterByDeal}
        value={dealId}
        placeholder={t.tasks.filters.allDeals}
        onChange={onDealChange}
        renderValue={(value) =>
          deals.find((deal) => deal.id === value)?.title ?? t.tasks.filters.allDeals
        }
      >
        <SelectItem value={null}>{t.tasks.filters.allDeals}</SelectItem>
        {deals.map((deal) => (
          <SelectItem key={deal.id} value={deal.id}>
            {deal.title}
          </SelectItem>
        ))}
      </FilterSelect>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={onReset}>
          {t.filters.resetFilters}
        </Button>
      )}
    </div>
  )
}