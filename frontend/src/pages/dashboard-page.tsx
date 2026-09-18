import { BriefcaseBusiness, CheckSquare, TrendingUp, Users } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useAuthStore } from '@/features/auth/auth.store'
import { getErrorMessage } from '@/lib/error-message'
import { formatNumber, formatRelative } from '@/lib/format'

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
    if (isError) toast.error(getErrorMessage(firstError, 'Failed to load dashboard data'))
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
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Welcome back, {user?.email ?? 'there'}
        </p>
      </header>

      {isError && (
        <div
          role="alert"
          className="rounded-card border border-[#FF5C5C]/30 bg-[#FF5C5C]/8 px-4 py-3 text-sm text-text-primary"
        >
          Some dashboard data could not be loaded. Check that the API is running and try again.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Clients"
          value={formatNumber(metrics.totalClients)}
          icon={Users}
          tone="blue"
          isLoading={metricsLoading}
        />
        <MetricCard
          label="Total Deals"
          value={formatNumber(metrics.totalDeals)}
          icon={BriefcaseBusiness}
          tone="violet"
          hint={`${metrics.activeDeals} active`}
          isLoading={metricsLoading}
        />
        <MetricCard
          label="Active Tasks"
          value={formatNumber(metrics.activeTasks)}
          icon={CheckSquare}
          tone="amber"
          hint={`${metrics.totalTasks} total`}
          isLoading={metricsLoading}
        />
        <MetricCard
          label="Won Deals"
          value={formatNumber(metrics.wonDeals)}
          icon={TrendingUp}
          tone="green"
          hint={`${metrics.winRate}% win rate`}
          isLoading={metricsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Deals Timeline"
          description="Deals created per month (last 6 months)"
          className="lg:col-span-2"
        >
          <DealsChart data={chart.points} isLoading={chart.isLoading} />
        </Section>

        <Section title="Pipeline" description="Deal distribution and win rate">
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