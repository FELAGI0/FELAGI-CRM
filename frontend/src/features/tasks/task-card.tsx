import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { CalendarClock, GripVertical } from 'lucide-react'

import { StatusBadge } from '@/components/common/status-badge'
import { cn } from '@/lib/utils'
import { formatDueDate, getDueState } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { Deal, Task } from '@/types/api'

export type TaskCardProps = {
  task: Task
  deals: Deal[]
  /** Whether this card may be opened for editing. Independent of dragging. */
  canEdit: boolean
  /** Whether this card may be dragged between columns (managers and admins). */
  canDrag: boolean
  /** Label for the current user, used to render the assignee chip. */
  currentUserId: string
  currentUserLabel: string
  onOpen: (task: Task) => void
}

/** Two-letter initials for the assignee chip. */
const initials = (label: string): string =>
  label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

export const TaskCard = ({
  task,
  deals,
  canEdit,
  canDrag,
  currentUserId,
  currentUserLabel,
  onOpen,
}: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    // Managers move cards between columns; a plain user cannot change status at
    // all, so the handle is disabled rather than hidden.
    disabled: !canDrag,
  })

  const isDone = task.status === 'done'
  const dueState = getDueState(task.due_date, isDone)
  const dealTitle = task.deal_id
    ? (deals.find((deal) => deal.id === task.deal_id)?.title ?? t.tasks.unknownDeal)
    : null

  const assigneeLabel =
    task.assigned_to === null
      ? null
      : task.assigned_to === currentUserId
        ? currentUserLabel
        : t.tasks.form.otherAssignee

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="min-w-0"
    >
      <div
        ref={setNodeRef}
        style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
        data-task-id={task.id}
        className={cn(
          'group min-w-0 rounded-card border border-border bg-surface p-3 transition-shadow',
          'hover:shadow-sm focus-within:shadow-sm',
          isDragging && 'z-50 opacity-80 shadow-lg',
          dueState === 'overdue' && 'border-status-lost/40',
        )}
      >
        <div className="flex items-start gap-2">
          <button
            type="button"
            className={cn(
              'mt-0.5 shrink-0 rounded-control p-0.5 text-text-secondary',
              canDrag ? 'cursor-grab hover:bg-surface-hover' : 'cursor-not-allowed opacity-40',
            )}
            aria-label={t.tasks.dragHandle}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => canEdit && onOpen(task)}
              disabled={!canEdit}
              className={cn(
                'w-full text-left text-sm font-medium text-text-primary',
                canEdit && 'hover:underline',
              )}
            >
              {task.title}
            </button>

            {task.description && (
              <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{task.description}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} kind="task" />

              {dueState !== 'none' && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-badge px-2 py-0.5 text-xs font-medium',
                    dueState === 'overdue' && 'bg-status-lost/10 text-status-lost',
                    dueState === 'today' && 'bg-status-in-progress/10 text-status-in-progress',
                    (dueState === 'tomorrow' || dueState === 'later') && 'text-text-secondary',
                  )}
                >
                  <CalendarClock className="size-3" aria-hidden />
                  {dueState === 'overdue'
                    ? t.tasks.overdue
                    : formatDueDate(task.due_date, isDone)}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              {dealTitle && (
                <span className="truncate text-xs text-text-secondary" title={dealTitle}>
                  {dealTitle}
                </span>
              )}
              {assigneeLabel && (
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent"
                  title={assigneeLabel}
                  aria-label={`${t.tasks.columns.assignee}: ${assigneeLabel}`}
                >
                  {initials(assigneeLabel)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}