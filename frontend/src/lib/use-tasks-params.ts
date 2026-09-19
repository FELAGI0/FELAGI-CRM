import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, parseNonNegativeInt, parsePositiveInt } from '@/lib/use-pagination-params'
import type { TaskStatus } from '@/types/api'

const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done']

export type TaskView = 'kanban' | 'list'

export const DEFAULT_TASK_VIEW: TaskView = 'kanban'

/** Narrows an arbitrary query value to a known task status; anything else is "all". */
export const parseTaskStatus = (value: string | null): TaskStatus | null => {
  if (value === null) return null
  return TASK_STATUSES.find((status) => status === value) ?? null
}

export const parseTaskView = (value: string | null): TaskView =>
  value === 'list' ? 'list' : DEFAULT_TASK_VIEW

export type TasksParams = {
  view: TaskView
  limit: number
  offset: number
  status: TaskStatus | null
  assignedTo: string | null
  dealId: string | null
}

/**
 * Reads `?view=&status=&assigned_to=&deal_id=&limit=&offset=` from the URL so
 * every board and list state is deep-linkable. Unknown values degrade to "no
 * filter" rather than being sent to the API, where an unrecognised status would
 * match nothing.
 */
export const useTasksParams = (): TasksParams & {
  setParams: (next: Partial<TasksParams>) => void
} => {
  const [searchParams, setSearchParams] = useSearchParams()

  const view = parseTaskView(searchParams.get('view'))
  const limit = Math.min(MAX_PAGE_SIZE, parsePositiveInt(searchParams.get('limit'), DEFAULT_PAGE_SIZE))
  const requestedOffset = parseNonNegativeInt(searchParams.get('offset'), 0)
  const offset = Math.floor(requestedOffset / limit) * limit
  const status = parseTaskStatus(searchParams.get('status'))
  const assignedTo = searchParams.get('assigned_to')
  const dealId = searchParams.get('deal_id')

  const setParams = useCallback(
    (next: Partial<TasksParams>) => {
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous)

          if (next.view !== undefined) params.set('view', next.view)
          if (next.limit !== undefined) params.set('limit', String(next.limit))
          if (next.offset !== undefined) params.set('offset', String(Math.max(0, next.offset)))

          const setOrDelete = (key: string, value: string | null | undefined) => {
            if (value === undefined) return
            if (value === null || value === '') params.delete(key)
            else params.set(key, value)
          }
          setOrDelete('status', next.status)
          setOrDelete('assigned_to', next.assignedTo)
          setOrDelete('deal_id', next.dealId)

          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { view, limit, offset, status, assignedTo, dealId, setParams }
}