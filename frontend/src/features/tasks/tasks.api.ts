import { apiClient } from '@/lib/api-client'
import type { Page, Task, TaskCreate, TaskStatus, TaskUpdate } from '@/types/api'

export type TaskListParams = {
  limit?: number
  offset?: number
  status?: TaskStatus
  assigned_to?: string
  deal_id?: string
}

/**
 * Drops empty values so the query string only carries real filters. The backend
 * treats a present-but-empty `status=` as a filter matching nothing, rather than
 * as "no filter".
 */
const toQueryParams = (params: TaskListParams): Record<string, string | number> => {
  const query: Record<string, string | number> = {}
  if (params.limit !== undefined) query.limit = params.limit
  if (params.offset !== undefined) query.offset = params.offset
  if (params.status) query.status = params.status
  if (params.assigned_to) query.assigned_to = params.assigned_to
  if (params.deal_id) query.deal_id = params.deal_id
  return query
}

/**
 * Collection routes are registered with a trailing slash on the backend, so
 * "/tasks/" is required — the bare path 307-redirects and the redirect drops
 * the Authorization header.
 */
export const listTasks = async (params: TaskListParams = {}): Promise<Page<Task>> => {
  const response = await apiClient.get<Page<Task>>('/tasks/', { params: toQueryParams(params) })
  return response.data
}

export const getTask = async (id: string): Promise<Task> => {
  const response = await apiClient.get<Task>(`/tasks/${id}`)
  return response.data
}

export const createTask = async (payload: TaskCreate): Promise<Task> => {
  const response = await apiClient.post<Task>('/tasks/', payload)
  return response.data
}

export const updateTask = async (id: string, payload: TaskUpdate): Promise<Task> => {
  const response = await apiClient.patch<Task>(`/tasks/${id}`, payload)
  return response.data
}

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(`/tasks/${id}`)
}