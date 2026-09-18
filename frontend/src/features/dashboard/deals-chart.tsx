import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import type { DealsChartPoint } from './dashboard.queries'
import { t } from '@/lib/i18n'

// Follows the theme token rather than a fixed hex, so the bars stay legible in
// dark mode (where --color-accent resolves to #ffffff).
const ACCENT = 'var(--color-accent)'

type ChartTooltipProps = Partial<TooltipContentProps<number, string>>

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as DealsChartPoint | undefined
  if (!point) return null

  return (
    <div className="rounded-control border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">
        {t.dashboard.dealsCount(point.count)}
      </p>
    </div>
  )
}

export const DealsChart = ({ data, isLoading = false }: { data: DealsChartPoint[]; isLoading?: boolean }) => {
  if (isLoading) {
    return (
      <div role="status" aria-label={t.common.loading} className="h-64 animate-pulse rounded-control bg-surface-hover" />
    )
  }

  const hasDeals = data.some((point) => point.count > 0)
  if (!hasDeals) {
    return (
      <div className="flex h-64 items-center justify-center rounded-control border border-dashed border-border">
        <p className="text-sm text-text-secondary">{t.dashboard.noDealsInPeriod}</p>
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-surface-hover)' }} />
          <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}