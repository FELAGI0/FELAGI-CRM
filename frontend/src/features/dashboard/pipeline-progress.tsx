import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type PipelineProgressProps = {
  won: number
  lost: number
  newDeals: number
  inProgress: number
  isLoading?: boolean
}

const SPARK_MAX = 1

export const PipelineProgress = ({ won, lost, newDeals, inProgress, isLoading = false }: PipelineProgressProps) => {
  const closed = won + lost
  const winRate = closed === 0 ? 0 : Math.round((won / closed) * 100)
  const total = won + lost + newDeals + inProgress

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading pipeline" className="space-y-4">
        <Skeleton className="h-3 rounded-full" />
        <Skeleton className="h-20" />
      </div>
    )
  }

  const segments = [
    { key: 'won', label: 'Won', value: won, className: 'bg-status-won' },
    { key: 'in_progress', label: 'In progress', value: inProgress, className: 'bg-status-in-progress' },
    { key: 'new', label: 'New', value: newDeals, className: 'bg-status-new' },
    { key: 'lost', label: 'Lost', value: lost, className: 'bg-status-lost' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-text-secondary">Win rate</p>
          <p className="text-2xl font-semibold tabular-nums text-text-primary">{winRate}%</p>
        </div>
        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-hover"
          role="progressbar"
          aria-valuenow={winRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Win rate"
        >
          <div
            className="h-full rounded-full bg-status-won transition-all duration-500"
            style={{ width: `${winRate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {won} won · {lost} lost{closed === 0 ? ' (no closed deals yet)' : ''}
        </p>
      </div>

      <div
        className={cn('flex h-2 w-full overflow-hidden rounded-full bg-surface-hover', total === 0 && 'invisible')}
        aria-hidden={total === 0}
      >
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={cn('h-full', segment.className)}
            style={{ width: `${(segment.value / Math.max(total, SPARK_MAX)) * 100}%` }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>

      <ul className="space-y-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-text-secondary">
              <span className={cn('size-2.5 rounded-full', segment.className)} aria-hidden />
              {segment.label}
            </span>
            <span className="font-medium tabular-nums text-text-primary">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}