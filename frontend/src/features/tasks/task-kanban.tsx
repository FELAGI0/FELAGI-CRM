import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Deal, Task, TaskStatus } from '@/types/api'

import { TaskCard } from './task-card'
import { kanbanKeyboardCoordinates } from './kanban-keyboard'
import { useUpdateTaskStatus } from './tasks.queries'

const COLUMNS: readonly TaskStatus[] = ['todo', 'in_progress', 'done']

export type TaskKanbanProps = {
  tasks: Task[]
  deals: Deal[]
  isLoading: boolean
  /** Returns whether a given task may be edited/dragged by the current user. */
  canEditTask: (task: Task) => boolean
  /** Whether any task may be dragged at all (managers and admins). */
  canDrag: boolean
  currentUserId: string
  currentUserLabel: string
  onOpenTask: (task: Task) => void
  /** Shown in place of the generic empty text when the board has no tasks. */
  emptyTitle?: string
  emptyDescription?: string
}

const Column = ({
  status,
  count,
  children,
  isDragging,
}: {
  status: TaskStatus
  count: number
  children: React.ReactNode
  isDragging: boolean
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section
      ref={setNodeRef}
      data-column={status}
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-card border border-border bg-surface/60 p-3 transition-colors',
        isOver && isDragging && 'border-accent bg-accent/5',
      )}
    >
      <header className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold text-text-primary">{t.status.task[status]}</h2>
        <span className="rounded-badge bg-surface-hover px-2 py-0.5 text-xs text-text-secondary">
          {count}
        </span>
      </header>
      <div className="flex min-h-24 flex-col gap-2">{children}</div>
    </section>
  )
}

export const TaskKanban = ({
  tasks,
  deals,
  isLoading,
  canEditTask,
  canDrag,
  currentUserId,
  currentUserLabel,
  onOpenTask,
  emptyTitle,
  emptyDescription,
}: TaskKanbanProps) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const updateStatus = useUpdateTaskStatus()
  // Announce column changes to screen readers without stealing visible focus.
  const liveRef = useRef<HTMLParagraphElement | null>(null)

  const sensors = useSensors(
    // A small activation distance keeps clicks on the card from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Arrow keys must be able to cross columns, which needs a board-aware getter.
    useSensor(KeyboardSensor, { coordinateGetter: kanbanKeyboardCoordinates(COLUMNS) }),
  )

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>(COLUMNS.map((status) => [status, []]))
    for (const task of tasks) map.get(task.status)?.push(task)
    return map
  }, [tasks])

  const activeTask = activeId ? (tasks.find((task) => task.id === activeId) ?? null) : null

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const task = tasks.find((item) => item.id === active.id)
    if (!task) return

    // The drop target is either a column or a card inside one.
    const overId = String(over.id)
    const targetStatus = COLUMNS.find((status) => status === overId)
      ?? tasks.find((item) => item.id === overId)?.status
    if (!targetStatus || targetStatus === task.status) return

    try {
      await updateStatus.mutateAsync({ id: task.id, status: targetStatus })
      if (liveRef.current) {
        liveRef.current.textContent = `${task.title}: ${t.status.task[targetStatus]}`
      }
      toast.success(t.tasks.statusUpdated)
    } catch (error) {
      toast.error(getErrorMessage(error, t.tasks.statusUpdateFailed))
    }
  }

  useEffect(() => {
    if (activeId === null && liveRef.current) liveRef.current.textContent = ''
  }, [activeId])

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3" role="status" aria-label={t.common.loading}>
        {COLUMNS.map((status) => (
          <div key={status} className="space-y-3 rounded-card border border-border bg-surface/60 p-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    )
  }

  const isEmpty = tasks.length === 0

  return (
    <>
      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-border bg-surface px-6 py-16 text-center">
          <p className="font-medium text-text-primary">{emptyTitle ?? t.tasks.empty.title}</p>
          <p className="text-sm text-text-secondary">{emptyDescription ?? t.tasks.empty.description}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={(event) => {
            void handleDragEnd(event)
          }}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {COLUMNS.map((status) => {
              const columnTasks = grouped.get(status) ?? []
              return (
                <Column
                  key={status}
                  status={status}
                  count={columnTasks.length}
                  isDragging={activeId !== null}
                >
                  <AnimatePresence initial={false}>
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        deals={deals}
                        canEdit={canEditTask(task)}
                        canDrag={canDrag}
                        currentUserId={currentUserId}
                        currentUserLabel={currentUserLabel}
                        onOpen={onOpenTask}
                      />
                    ))}
                  </AnimatePresence>
                  {columnTasks.length === 0 && (
                    <p className="px-1 py-4 text-center text-xs text-text-secondary">
                      {t.tasks.columnEmpty}
                    </p>
                  )}
                </Column>
              )
            })}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rounded-card border border-accent bg-surface p-3 shadow-lg">
                <p className="text-sm font-medium text-text-primary">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </>
  )
}