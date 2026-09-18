import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'

export type MetricTone = 'blue' | 'violet' | 'amber' | 'green' | 'red'

/**
 * Tones are hard-coded because this theme only defines --color-accent plus the
 * --color-status-* tokens; shadcn's --color-primary/--color-muted do not exist here.
 */
const toneStyles: Record<MetricTone, { tile: string; icon: string; value: string }> = {
  blue: { tile: 'bg-[#4A7BF7]/12', icon: 'text-[#4A7BF7]', value: 'text-text-primary' },
  violet: { tile: 'bg-[#8B5CF6]/12', icon: 'text-[#8B5CF6]', value: 'text-text-primary' },
  amber: { tile: 'bg-[#FF9F43]/14', icon: 'text-[#FF9F43]', value: 'text-text-primary' },
  green: { tile: 'bg-[#4CD97B]/14', icon: 'text-[#4CD97B]', value: 'text-text-primary' },
  red: { tile: 'bg-[#FF5C5C]/14', icon: 'text-[#FF5C5C]', value: 'text-text-primary' },
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
            <div
              role="status"
              aria-label={`Loading ${label}`}
              className="mt-3 h-8 w-16 animate-pulse rounded-control bg-surface-hover"
            />
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
            isPositive ? 'text-[#4CD97B]' : 'text-[#FF5C5C]',
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