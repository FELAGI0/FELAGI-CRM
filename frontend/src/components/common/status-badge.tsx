import { cn } from '@/lib/utils'
import type { DealStatus, TaskStatus } from '@/types/api'

const dealLabels: Record<DealStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  won: 'Won',
  lost: 'Lost',
}

const dealStyles: Record<DealStatus, string> = {
  new: 'bg-[#5B8DEF]/12 text-[#5B8DEF]',
  in_progress: 'bg-[#FF9F43]/14 text-[#FF9F43]',
  won: 'bg-[#4CD97B]/14 text-[#4CD97B]',
  lost: 'bg-[#FF5C5C]/14 text-[#FF5C5C]',
}

const taskLabels: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

const taskStyles: Record<TaskStatus, string> = {
  todo: 'bg-[#5B8DEF]/12 text-[#5B8DEF]',
  in_progress: 'bg-[#FF9F43]/14 text-[#FF9F43]',
  done: 'bg-[#4CD97B]/14 text-[#4CD97B]',
}

const base = 'inline-flex h-5 shrink-0 items-center rounded-badge px-2 text-xs font-medium'

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
  const style = kind === 'deal' ? dealStyles[status as DealStatus] : taskStyles[status as TaskStatus]
  return <span className={cn(base, style, className)}>{label}</span>
}