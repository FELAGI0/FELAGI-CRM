import { Badge } from '@/components/ui/badge'
import type { DealStatus, TaskStatus } from '@/types/api'

const dealLabels: Record<DealStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  won: 'Won',
  lost: 'Lost',
}

const taskLabels: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
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