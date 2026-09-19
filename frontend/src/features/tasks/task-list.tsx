import { ListChecks, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getErrorMessage } from '@/lib/error-message'
import { formatDate, formatDueDate, getDueState } from '@/lib/format'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Deal, Task } from '@/types/api'

import { TaskDialog } from './task-dialog'
import { useDeleteTask } from './tasks.queries'

const COLUMNS = [
  t.tasks.columns.title,
  t.tasks.columns.status,
  t.tasks.columns.dueDate,
  t.tasks.columns.assignee,
  t.tasks.columns.deal,
  t.common.actions,
] as const

const ACTIONS_COLUMN = t.common.actions
const EMPTY_CELL = '—'

export type TaskListProps = {
  tasks: Task[]
  deals: Deal[]
  isLoading: boolean
  /** Returns whether a given task may be edited by the current user. */
  canEditTask: (task: Task) => boolean
  canChooseAssignee: boolean
  currentUserId: string
  currentUserLabel: string
  hasActiveFilters?: boolean
  onResetFilters?: () => void
  onCreateClick?: () => void
}

const TableSkeleton = () => (
  <div className="space-y-3 p-5" role="status" aria-label={t.common.loading}>
    {[0, 1, 2, 3, 4].map((row) => (
      <div key={row} className="flex items-center gap-4">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </div>
)

const EmptyState = ({
  hasActiveFilters,
  onResetFilters,
  onCreateClick,
  emptyTitle,
  emptyDescription,
}: {
  hasActiveFilters: boolean
  onResetFilters?: () => void
  onCreateClick?: () => void
  emptyTitle?: string
  emptyDescription?: string
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <span className="grid size-11 place-items-center rounded-control bg-accent/10 text-accent">
      <ListChecks className="size-5" aria-hidden />
    </span>
    <div>
      <p className="font-medium text-text-primary">
        {hasActiveFilters ? t.tasks.noMatches.title : (emptyTitle ?? t.tasks.empty.title)}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        {hasActiveFilters
          ? t.tasks.noMatches.description
          : (emptyDescription ?? t.tasks.empty.description)}
      </p>
    </div>
    {hasActiveFilters
      ? onResetFilters && (
          <Button variant="outline" onClick={onResetFilters} className="mt-1">
            {t.filters.resetFilters}
          </Button>
        )
      : onCreateClick && (
          <Button onClick={onCreateClick} className="mt-1">
            {t.tasks.addTask}
          </Button>
        )}
  </div>
)

export const TaskList = ({
  tasks,
  deals,
  isLoading,
  canEditTask,
  canChooseAssignee,
  currentUserId,
  currentUserLabel,
  hasActiveFilters = false,
  onResetFilters,
  onCreateClick,
}: TaskListProps) => {
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const deleteMutation = useDeleteTask()

  const dealTitles = new Map(deals.map((deal) => [deal.id, deal.title]))

  const handleDelete = async () => {
    if (!taskToDelete) return
    try {
      await deleteMutation.mutateAsync(taskToDelete.id)
      toast.success(t.tasks.deleted)
    } catch (error) {
      toast.error(getErrorMessage(error, t.tasks.deleteFailed))
    } finally {
      setTaskToDelete(null)
    }
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        onCreateClick={onCreateClick}
      />
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead
                key={column}
                className={column === ACTIONS_COLUMN ? 'w-16 text-right' : undefined}
              >
                {column === ACTIONS_COLUMN ? <span className="sr-only">{t.common.actions}</span> : column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const dueState = getDueState(task.due_date, task.status === 'done')
            const editable = canEditTask(task)
            return (
              <TableRow key={task.id}>
                <TableCell className="font-medium text-text-primary">{task.title}</TableCell>
                <TableCell>
                  <StatusBadge status={task.status} kind="task" />
                </TableCell>
                <TableCell>
                  {dueState === 'none' ? (
                    <span className="text-text-secondary">{EMPTY_CELL}</span>
                  ) : (
                    <span
                      className={cn(
                        'text-sm',
                        dueState === 'overdue' && 'font-medium text-status-lost',
                        dueState === 'today' && 'font-medium text-status-in-progress',
                        (dueState === 'tomorrow' || dueState === 'later') && 'text-text-secondary',
                      )}
                    >
                      {dueState === 'overdue'
                        ? `${t.tasks.overdue} · ${formatDate(task.due_date)}`
                        : formatDueDate(task.due_date, task.status === 'done')}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {task.assigned_to === null
                    ? EMPTY_CELL
                    : task.assigned_to === currentUserId
                      ? currentUserLabel
                      : t.tasks.form.otherAssignee}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {task.deal_id ? (dealTitles.get(task.deal_id) ?? t.tasks.unknownDeal) : EMPTY_CELL}
                </TableCell>
                <TableCell className="text-right">
                  {editable && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${t.common.actions}: ${task.title}`}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => {
                            setTimeout(() => setTaskToEdit(task), 0)
                          }}
                        >
                          <Pencil />
                          {t.common.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setTimeout(() => setTaskToDelete(task), 0)
                          }}
                        >
                          <Trash2 />
                          {t.common.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Dialog open={taskToDelete !== null} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.tasks.deleteConfirm.title}</DialogTitle>
            <DialogDescription>
              {t.tasks.deleteConfirm.description(taskToDelete?.title ?? '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTaskToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              {t.tasks.deleteConfirm.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDelete()
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t.tasks.deleting : t.tasks.deleteConfirm.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {taskToEdit && (
        <TaskDialog
          mode="edit"
          task={taskToEdit}
          deals={deals}
          canChooseAssignee={canChooseAssignee}
          currentUserId={currentUserId}
          currentUserLabel={currentUserLabel}
          open
          onOpenChange={(open) => {
            if (!open) setTaskToEdit(null)
          }}
        />
      )}
    </>
  )
}