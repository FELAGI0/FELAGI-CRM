import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Page, Task, TaskCreate, TaskUpdate } from '@/types/api'

import { createTask, deleteTask, getTask, listTasks, updateTask, type TaskListParams } from './tasks.api'

export const tasksKeys = {
  all: ['tasks'] as const,
  list: (params: TaskListParams) => ['tasks', 'list', params] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
}

export const useTasks = (params: TaskListParams) =>
  useQuery<Page<Task>>({
    queryKey: tasksKeys.list(params),
    queryFn: () => listTasks(params),
    placeholderData: (previous) => previous,
  })

export const useTask = (id: string) =>
  useQuery<Task>({
    queryKey: tasksKeys.detail(id),
    queryFn: () => getTask(id),
    enabled: id.length > 0,
  })

export const useCreateTask = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TaskCreate) => createTask(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all })
    },
  })
}

export const useUpdateTask = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TaskUpdate) => updateTask(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all })
      void queryClient.invalidateQueries({ queryKey: tasksKeys.detail(id) })
    },
  })
}

/**
 * Status change for a Kanban drop.
 *
 * The cache is updated before the request resolves so the card lands in its new
 * column immediately; the previous value is restored if the request fails. Every
 * cached list is patched, since the board and the list view hold separate keys.
 */
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) => updateTask(id, { status }),

    onMutate: async ({ id, status }) => {
      // Stop in-flight refetches from overwriting the optimistic value.
      await queryClient.cancelQueries({ queryKey: tasksKeys.all })

      const snapshots = queryClient
        .getQueriesData<Page<Task>>({ queryKey: tasksKeys.all })
        .map(([key, data]) => [key, data] as const)

      for (const [key, data] of snapshots) {
        if (!data?.items) continue
        queryClient.setQueryData<Page<Task>>(key, {
          ...data,
          items: data.items.map((task) => (task.id === id ? { ...task, status } : task)),
        })
      }

      return { snapshots }
    },

    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data)
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all })
    },
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all })
    },
  })
}