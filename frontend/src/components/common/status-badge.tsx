import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/i18n'
import type { DealStatus, TaskStatus } from '@/types/api'

const dealLabels: Record<DealStatus, string> = {
  new: t.status.deal.new,
  in_progress: t.status.deal.in_progress,
  won: t.status.deal.won,
  lost: t.status.deal.lost,
}

const taskLabels: Record<TaskStatus, string> = {
  todo: t.status.task.todo,
  in_progress: t.status.task.in_progress,
  done: t.status.task.done,
}

/** Status strings line up 1:1 with the badge variants, so they pass straight through. */
export const StatusBadge = ({
  status,
  kind,
  className,
}: {
  status: DealStatus | TaskStatus
  kind: 'deal' | 'task'
  className?: string
}) => {
  const label = kind === 'deal' ? dealLabels[status as DealStatus] : taskLabels[status as TaskStatus]
  return (
    <Badge variant={status} className={className}>
      {label}
    </Badge>
  )
}