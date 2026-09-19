import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Pagination } from '@/components/common/pagination'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'
import { canEditTask, isManagerialRole, useCurrentUserId, useRole } from '@/lib/permissions'
import { useTasksParams } from '@/lib/use-tasks-params'
import type { Task } from '@/types/api'

import { useAuthStore } from '@/features/auth/auth.store'
import { useDeals } from '@/features/deals/deals.queries'
import { TaskDialog } from '@/features/tasks/task-dialog'
import { TaskFilters } from '@/features/tasks/task-filters'
import { resolveAssigneeFilter } from '@/features/tasks/task-filter-values'
import { TaskKanban } from '@/features/tasks/task-kanban'
import { TaskList } from '@/features/tasks/task-list'
import { TaskViewToggle } from '@/features/tasks/task-view-toggle'
import { useTasks } from '@/features/tasks/tasks.queries'

export const TasksPage = () => {
  const { view, limit, offset, status, assignedTo, dealId, setParams } = useTasksParams()
  const role = useRole()
  const userId = useCurrentUserId()
  const userEmail = useAuthStore((state) => state.user?.email ?? null)
  const canChooseAssignee = isManagerialRole(role)

  const { assignedTo: apiAssignee, clientSideUnassigned } = resolveAssigneeFilter(assignedTo, userId ?? '')

  const { data, isLoading, isError, error, isFetching } = useTasks({
    limit,
    offset,
    ...(status === null ? {} : { status }),
    ...(dealId === null ? {} : { deal_id: dealId }),
    // "Unassigned" cannot be expressed as a query parameter, so it is filtered
    // client-side below instead.
    ...(apiAssignee === null ? {} : { assigned_to: apiAssignee }),
  })
  // The deal selector needs the full list to resolve names and options.
  const dealsQuery = useDeals({ limit: 100, offset: 0 })
  const deals = dealsQuery.data?.items ?? []
  const [createOpen, setCreateOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, t.tasks.loadFailed))
  }, [isError, error])

  /**
   * The backend returns every task to every role, so the ownership rule is
   * applied here: a plain user only ever sees their own work.
   */
  const visibleTasks = useMemo(() => {
    const items = data?.items ?? []
    if (isManagerialRole(role)) {
      return clientSideUnassigned ? items.filter((task) => task.assigned_to === null) : items
    }
    return items.filter((task) => task.assigned_to === userId)
  }, [data, role, userId, clientSideUnassigned])

  const total = data?.total ?? 0
  const shownTotal = isManagerialRole(role) && !clientSideUnassigned ? total : visibleTasks.length
  const hasActiveFilters = status !== null || assignedTo !== null || dealId !== null

  const resetFilters = () => {
    setParams({ status: null, assignedTo: null, dealId: null, offset: 0 })
  }

  const canEdit = (task: Task) => canEditTask(role, userId, task)

  const currentUserLabel = userEmail ?? t.tasks.form.otherAssignee
  const isPlainUser = !isManagerialRole(role)
  const plainUserEmpty = isPlainUser && visibleTasks.length === 0 && !hasActiveFilters

  const emptyTitle = plainUserEmpty ? t.tasks.noOwnTasks.title : undefined
  const emptyDescription = plainUserEmpty ? t.tasks.noOwnTasks.description : undefined

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{t.tasks.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {shownTotal === 0
              ? isPlainUser
                ? t.tasks.noOwnTasks.title
                : t.tasks.empty.title
              : t.tasks.totalLabel(shownTotal)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TaskViewToggle view={view} onChange={(next) => setParams({ view: next })} />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            {t.tasks.addTask}
          </Button>
        </div>
      </header>

      <TaskFilters
        status={status}
        assignedTo={assignedTo}
        dealId={dealId}
        deals={deals}
        canSeeUnassigned={canChooseAssignee}
        onStatusChange={(next) => setParams({ status: next, offset: 0 })}
        onAssigneeChange={(next) => setParams({ assignedTo: next, offset: 0 })}
        onDealChange={(next) => setParams({ dealId: next, offset: 0 })}
        onReset={resetFilters}
      />

      {isError && (
        <div
          role="alert"
          className="rounded-card border border-status-lost/30 bg-status-lost/8 px-4 py-3 text-sm text-text-primary"
        >
          {t.tasks.loadFailedHint}
        </div>
      )}

      {!isError && view === 'kanban' && (
        <TaskKanban
          tasks={visibleTasks}
          deals={deals}
          isLoading={isLoading || dealsQuery.isLoading}
          canEditTask={canEdit}
          canDrag={canChooseAssignee}
          currentUserId={userId ?? ''}
          currentUserLabel={currentUserLabel}
          onOpenTask={setTaskToEdit}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      )}

      {!isError && view === 'list' && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <TaskList
            tasks={visibleTasks}
            deals={deals}
            isLoading={isLoading || dealsQuery.isLoading}
            canEditTask={canEdit}
            canChooseAssignee={canChooseAssignee}
            currentUserId={userId ?? ''}
            currentUserLabel={currentUserLabel}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
            onCreateClick={() => setCreateOpen(true)}
          />
          {total > 0 && (
            <Pagination
              total={total}
              limit={limit}
              offset={offset}
              isFetching={isFetching}
              onPageChange={(nextOffset) => setParams({ offset: nextOffset })}
              onLimitChange={(nextLimit) => setParams({ limit: nextLimit, offset: 0 })}
            />
          )}
        </div>
      )}

      {createOpen && (
        <TaskDialog
          mode="create"
          deals={deals}
          canChooseAssignee={canChooseAssignee}
          currentUserId={userId ?? ''}
          currentUserLabel={currentUserLabel}
          open
          onOpenChange={setCreateOpen}
        />
      )}

      {taskToEdit && (
        <TaskDialog
          mode="edit"
          task={taskToEdit}
          deals={deals}
          canChooseAssignee={canChooseAssignee}
          currentUserId={userId ?? ''}
          currentUserLabel={currentUserLabel}
          open
          onOpenChange={(open) => {
            if (!open) setTaskToEdit(null)
          }}
        />
      )}
    </div>
  )
}