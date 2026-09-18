import type { LucideIcon } from 'lucide-react'
import { BriefcaseBusiness, CheckSquare, Inbox, Users } from 'lucide-react'
import type { ReactNode } from 'react'

import type { DealStatus, TaskStatus } from '@/types/api'

import { StatusBadge } from '@/components/common/status-badge'
import { cn } from '@/lib/utils'

export type ActivityItem = {
  id: string
  title: string
  meta: string
  status?: DealStatus | TaskStatus
  statusKind?: 'deal' | 'task'
}

const ListSkeleton = () => (
  <ul className="space-y-3" role="status" aria-label="Loading recent activity">
    {[0, 1, 2, 3, 4].map((row) => (
      <li key={row} className="flex items-center gap-3">
        <div className="size-8 shrink-0 animate-pulse rounded-control bg-surface-hover" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-hover" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-surface-hover" />
        </div>
      </li>
    ))}
  </ul>
)

const ActivityList = ({
  items,
  icon: Icon,
  iconClassName,
  emptyLabel,
  isLoading,
}: {
  items: ActivityItem[]
  icon: LucideIcon
  iconClassName: string
  emptyLabel: string
  isLoading: boolean
}) => {
  if (isLoading) return <ListSkeleton />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border py-8">
        <Inbox className="size-5 text-text-secondary" aria-hidden />
        <p className="text-sm text-text-secondary">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3">
          <span className={cn('grid size-8 shrink-0 place-items-center rounded-control', iconClassName)}>
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
            <p className="truncate text-xs text-text-secondary">{item.meta}</p>
          </div>
          {item.status && item.statusKind && <StatusBadge status={item.status} kind={item.statusKind} />}
        </li>
      ))}
    </ul>
  )
}

const ActivitySection = ({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: ReactNode
}) => (
  <section className="rounded-card border border-border bg-surface p-5 transition-shadow hover:shadow-sm">
    <header className="mb-4 flex items-center justify-between">
      <h2 className="font-semibold text-text-primary">{title}</h2>
      {typeof count === 'number' && count > 0 && <span className="text-xs text-text-secondary">{count} total</span>}
    </header>
    {children}
  </section>
)

export type RecentActivityProps = {
  clients: { items: ActivityItem[]; isLoading: boolean; total?: number }
  deals: { items: ActivityItem[]; isLoading: boolean; total?: number }
  tasks: { items: ActivityItem[]; isLoading: boolean; total?: number }
}

export const RecentActivity = ({ clients, deals, tasks }: RecentActivityProps) => (
  <div className="grid gap-6 lg:grid-cols-3">
    <ActivitySection title="Recent Clients" count={clients.total}>
      <ActivityList
        items={clients.items}
        icon={Users}
        iconClassName="bg-[#4A7BF7]/12 text-[#4A7BF7]"
        emptyLabel="No clients yet"
        isLoading={clients.isLoading}
      />
    </ActivitySection>

    <ActivitySection title="Recent Deals" count={deals.total}>
      <ActivityList
        items={deals.items}
        icon={BriefcaseBusiness}
        iconClassName="bg-[#8B5CF6]/12 text-[#8B5CF6]"
        emptyLabel="No deals yet"
        isLoading={deals.isLoading}
      />
    </ActivitySection>

    <ActivitySection title="Recent Tasks" count={tasks.total}>
      <ActivityList
        items={tasks.items}
        icon={CheckSquare}
        iconClassName="bg-[#FF9F43]/14 text-[#FF9F43]"
        emptyLabel="No tasks yet"
        isLoading={tasks.isLoading}
      />
    </ActivitySection>
  </div>
)