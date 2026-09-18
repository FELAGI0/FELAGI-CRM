import { BriefcaseBusiness, CheckSquare, TrendingUp, Users } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useAuthStore } from '@/features/auth/auth.store'
import { getErrorMessage } from '@/lib/error-message'
import { formatNumber, formatRelative } from '@/lib/format'
import { t } from '@/lib/i18n'

import {
  useDashboardMetrics,
  useDealsChartData,
  useRecentClients,
  useRecentDeals,
  useRecentTasks,
} from '@/features/dashboard/dashboard.queries'
import { DealsChart } from '@/features/dashboard/deals-chart'
import { MetricCard } from '@/features/dashboard/metric-card'
import { PipelineProgress } from '@/features/dashboard/pipeline-progress'
import { RecentActivity, type ActivityItem } from '@/features/dashboard/recent-activity'

type SectionProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

const Section = ({ title, description, children, className }: SectionProps) => (
  <section className={`rounded-card border border-border bg-surface p-5 ${className ?? ''}`}>
    <header className="mb-4">
      <h2 className="font-semibold text-text-primary">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
    </header>
    {children}
  </section>
)

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user)
  const { metrics, isLoading: metricsLoading, isError: metricsError } = useDashboardMetrics()
  const chart = useDealsChartData()
  const clients = useRecentClients()
  const deals = useRecentDeals()
  const tasks = useRecentTasks()

  const isError = metricsError || chart.isError || clients.isError || deals.isError || tasks.isError
  const firstError = [chart.error, clients.error, deals.error, tasks.error].find(Boolean)

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(firstError, t.dashboard.loadFailed))
  }, [isError, firstError])

  const clientItems: ActivityItem[] = (clients.data?.items ?? []).map((client) => ({
    id: client.id,
    title: client.name,
    meta: client.company ?? client.email ?? formatRelative(client.created_at),
  }))

  const dealItems: ActivityItem[] = (deals.data?.items ?? []).map((deal) => ({
    id: deal.id,
    title: deal.title,
    meta: formatRelative(deal.created_at),
    status: deal.status,
    statusKind: 'deal',
  }))

  const taskItems: ActivityItem[] = (tasks.data?.items ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    meta: formatRelative(task.created_at),
    status: task.status,
    statusKind: 'task',
  }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text-primary">{t.dashboard.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t.dashboard.welcome(user?.email ?? '—')}
        </p>
      </header>

      {isError && (
        <div
          role="alert"
          className="rounded-card border border-status-lost/30 bg-status-lost/8 px-4 py-3 text-sm text-text-primary"
        >
          {t.dashboard.loadFailedHint}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t.dashboard.totalClients}
          value={formatNumber(metrics.totalClients)}
          icon={Users}
          tone="blue"
          isLoading={metricsLoading}
        />
        <MetricCard
          label={t.dashboard.totalDeals}
          value={formatNumber(metrics.totalDeals)}
          icon={BriefcaseBusiness}
          tone="violet"
          hint={t.dashboard.active(metrics.activeDeals)}
          isLoading={metricsLoading}
        />
        <MetricCard
          label={t.dashboard.activeTasks}
          value={formatNumber(metrics.activeTasks)}
          icon={CheckSquare}
          tone="amber"
          hint={t.dashboard.total(metrics.totalTasks)}
          isLoading={metricsLoading}
        />
        <MetricCard
          label={t.dashboard.wonDeals}
          value={formatNumber(metrics.wonDeals)}
          icon={TrendingUp}
          tone="green"
          hint={t.dashboard.winRate(metrics.winRate)}
          isLoading={metricsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title={t.dashboard.dealsTimeline}
          description={t.dashboard.dealsTimelineSubtitle}
          className="lg:col-span-2"
        >
          <DealsChart data={chart.points} isLoading={chart.isLoading} />
        </Section>

        <Section title={t.dashboard.pipeline} description={t.dashboard.pipelineSubtitle}>
          <PipelineProgress
            won={metrics.wonDeals}
            lost={metrics.lostDeals}
            newDeals={metrics.newDeals}
            inProgress={metrics.inProgressDeals}
            isLoading={metricsLoading}
          />
        </Section>
      </div>

      <RecentActivity
        clients={{ items: clientItems, isLoading: clients.isLoading, total: clients.data?.total }}
        deals={{ items: dealItems, isLoading: deals.isLoading, total: deals.data?.total }}
        tasks={{ items: taskItems, isLoading: tasks.isLoading, total: tasks.data?.total }}
      />
    </div>
  )
}