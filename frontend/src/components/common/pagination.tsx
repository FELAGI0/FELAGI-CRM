import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAGE_SIZE_OPTIONS } from '@/lib/use-pagination-params'
import { t } from '@/lib/i18n'

export type PaginationProps = {
  total: number
  limit: number
  offset: number
  onPageChange: (offset: number) => void
  onLimitChange: (limit: number) => void
  isFetching?: boolean
}

export const Pagination = ({
  total,
  limit,
  offset,
  onPageChange,
  onLimitChange,
  isFetching = false,
}: PaginationProps) => {
  const pageCount = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(pageCount, Math.floor(offset / limit) + 1)
  const firstItem = total === 0 ? 0 : offset + 1
  const lastItem = Math.min(offset + limit, total)
  const canPrev = offset > 0
  const canNext = offset + limit < total
  // A deep-linked limit (e.g. ?limit=2) is not one of the presets, so surface it
  // as an extra option instead of letting the selector render blank.
  const limitOptions: number[] = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limit)
    ? [...PAGE_SIZE_OPTIONS]
    : [...PAGE_SIZE_OPTIONS, limit].sort((a, b) => a - b)

  return (
    <div
      data-slot="pagination"
      className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-text-secondary" aria-live="polite">
        {t.pagination.showing(firstItem, lastItem, total)}
      </p>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="whitespace-nowrap">{t.pagination.perPage}</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              if (typeof value === 'string') onLimitChange(Number.parseInt(value, 10))
            }}
          >
            <SelectTrigger size="sm" aria-label={t.pagination.rowsPerPage}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-text-secondary">
            {t.pagination.page(currentPage, pageCount)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t.pagination.previousPage}
            disabled={!canPrev || isFetching}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t.pagination.nextPage}
            disabled={!canNext || isFetching}
            onClick={() => onPageChange(offset + limit)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}