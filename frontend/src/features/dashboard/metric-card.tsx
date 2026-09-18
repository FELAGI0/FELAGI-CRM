import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type MetricTone = 'blue' | 'violet' | 'amber' | 'green' | 'red'

/**
 * Tones map onto the theme tokens declared in src/index.css (@theme): the accent
 * plus the six --color-status-* hues. Tailwind v4 derives the utilities from those
 * custom properties, so no raw hex values are needed here.
 */
const toneStyles: Record<MetricTone, { tile: string; icon: string; value: string }> = {
  blue: { tile: 'bg-accent/10', icon: 'text-accent', value: 'text-text-primary' },
  violet: { tile: 'bg-status-new/10', icon: 'text-status-new', value: 'text-text-primary' },
  amber: { tile: 'bg-status-in-progress/10', icon: 'text-status-in-progress', value: 'text-text-primary' },
  green: { tile: 'bg-status-won/10', icon: 'text-status-won', value: 'text-text-primary' },
  red: { tile: 'bg-status-lost/10', icon: 'text-status-lost', value: 'text-text-primary' },
}

export type MetricCardProps = {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: MetricTone
  trend?: number
  hint?: string
  isLoading?: boolean
  className?: string
}

export const MetricCard = ({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  trend,
  hint,
  isLoading = false,
  className,
}: MetricCardProps) => {
  const styles = toneStyles[tone]
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend)
  const isPositive = hasTrend && trend >= 0

  return (
    <div
      data-slot="metric-card"
      className={cn(
        'rounded-card border border-border bg-surface p-5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-secondary">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-3 h-8 w-16" role="status" aria-label={`${t.common.loading} ${label}`} />
          ) : (
            <p className={cn('mt-2 text-3xl font-semibold tabular-nums tracking-tight', styles.value)}>{value}</p>
          )}
          {!isLoading && hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
        </div>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-control', styles.tile)}>
          <Icon className={cn('size-5', styles.icon)} aria-hidden />
        </span>
      </div>

      {!isLoading && hasTrend && (
        <p
          className={cn(
            'mt-3 inline-flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-status-won' : 'text-status-lost',
          )}
        >
          {isPositive ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
          {isPositive ? '+' : ''}
          {trend}%
        </p>
      )}
    </div>
  )
}