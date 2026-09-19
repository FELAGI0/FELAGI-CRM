import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import {
  tasksKeys,
  useCreateTask,
  useDeleteTask,
  useTask,
  useTasks,
  useUpdateTask,
  useUpdateTaskStatus,
} from '@/features/tasks/tasks.queries'
import { apiClient } from '@/lib/api-client'
import type { Page, Task } from '@/types/api'
import { makePage, makeTask } from './factories'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPatch = vi.mocked(apiClient.patch)
const mockedDelete = vi.mocked(apiClient.delete)

const DEAL_ID = '22222222-2222-4222-8222-222222222222'
const USER_ID = '6f1a9b3c-0d2e-4f5a-8b7c-1d2e3f4a5b6c'

// gcTime is left at the default: 0 GCs queries whose fetch is still in flight,
// which surfaces as a stray rejection attributed to the test.
const makeWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useTasks', () => {
  test('requests the collection endpoint with a trailing slash', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([makeTask()], { total: 1 }) } as never)

    const { result } = renderHook(() => useTasks({ limit: 20, offset: 0 }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // The bare path 307-redirects and the redirect drops the Authorization header.
    expect(mockedGet).toHaveBeenCalledWith('/tasks/', { params: { limit: 20, offset: 0 } })
  })

  test('sends only the non-empty filters', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([], { total: 0 }) } as never)

    const { result } = renderHook(
      () => useTasks({ limit: 20, offset: 0, status: 'todo', assigned_to: USER_ID, deal_id: DEAL_ID }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith('/tasks/', {
      params: { limit: 20, offset: 0, status: 'todo', assigned_to: USER_ID, deal_id: DEAL_ID },
    })
  })

  test('omits unset filters rather than sending them empty', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([], { total: 0 }) } as never)

    const { result } = renderHook(
      () => useTasks({ limit: 20, offset: 0, status: undefined, assigned_to: undefined, deal_id: undefined }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // A present-but-empty `status=` makes the backend match nothing.
    const params = mockedGet.mock.calls[0]?.[1]?.params as Record<string, unknown>
    expect(params).toEqual({ limit: 20, offset: 0 })
    expect(params).not.toHaveProperty('status')
    expect(params).not.toHaveProperty('assigned_to')
    expect(params).not.toHaveProperty('deal_id')
  })

  test('passes a non-zero offset through', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makePage([], { total: 0 }) } as never)

    const { result } = renderHook(() => useTasks({ limit: 5, offset: 15 }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith('/tasks/', { params: { limit: 5, offset: 15 } })
  })
})

describe('useTask', () => {
  test('requests the item endpoint', async () => {
    mockedGet.mockReset()
    mockedGet.mockResolvedValue({ data: makeTask() } as never)

    const { result } = renderHook(() => useTask('task-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith('/tasks/task-1')
  })

  test('stays idle without an id', () => {
    mockedGet.mockReset()
    renderHook(() => useTask(''), { wrapper: makeWrapper() })
    expect(mockedGet).not.toHaveBeenCalled()
  })
})

describe('useCreateTask', () => {
  test('posts the payload and invalidates every tasks query', async () => {
    mockedPost.mockReset()
    mockedPost.mockResolvedValue({ data: makeTask() } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreateTask(), { wrapper })
    await result.current.mutateAsync({ title: 'Новая', deal_id: DEAL_ID, status: 'todo' })

    expect(mockedPost).toHaveBeenCalledWith('/tasks/', {
      title: 'Новая',
      deal_id: DEAL_ID,
      status: 'todo',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tasksKeys.all })
  })
})

describe('useUpdateTask', () => {
  test('patches the item and invalidates both list and detail', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: makeTask() } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateTask('task-7'), { wrapper })
    await result.current.mutateAsync({ status: 'done' })

    expect(mockedPatch).toHaveBeenCalledWith('/tasks/task-7', { status: 'done' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tasksKeys.all })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tasksKeys.detail('task-7') })
  })
})

describe('useUpdateTaskStatus', () => {
  test('patches only the status and invalidates the lists', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: makeTask({ status: 'done' }) } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper })
    await result.current.mutateAsync({ id: 'task-3', status: 'done' })

    expect(mockedPatch).toHaveBeenCalledWith('/tasks/task-3', { status: 'done' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tasksKeys.all })
  })

  test('moves the task into its new column optimistically, before the request resolves', async () => {
    let release: (() => void) | undefined
    mockedPatch.mockReset()
    mockedPatch.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ data: makeTask({ status: 'done' }) } as never)
        }) as never,
    )

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const listKey = tasksKeys.list({ limit: 100, offset: 0 })
    const initial: Page<Task> = makePage([makeTask({ id: 'task-3', status: 'todo' })], { total: 1 })
    queryClient.setQueryData(listKey, initial)

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper })
    const mutation = result.current.mutateAsync({ id: 'task-3', status: 'done' })

    // While the request is still in flight the cache already shows the new status.
    await waitFor(() => {
      const cached = queryClient.getQueryData<Page<Task>>(listKey)
      expect(cached?.items[0]?.status).toBe('done')
    })

    release?.()
    await mutation
  })

  test('rolls the optimistic change back when the request fails', async () => {
    mockedPatch.mockReset()
    mockedPatch.mockRejectedValue(new Error('403') as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const listKey = tasksKeys.list({ limit: 100, offset: 0 })
    queryClient.setQueryData(listKey, makePage([makeTask({ id: 'task-3', status: 'todo' })], { total: 1 }))

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper })
    await expect(result.current.mutateAsync({ id: 'task-3', status: 'done' })).rejects.toThrow()

    const cached = queryClient.getQueryData<Page<Task>>(listKey)
    expect(cached?.items[0]?.status).toBe('todo')
  })
})

describe('useDeleteTask', () => {
  test('deletes the item and invalidates the list', async () => {
    mockedDelete.mockReset()
    mockedDelete.mockResolvedValue({ data: undefined } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteTask(), { wrapper })
    await result.current.mutateAsync('task-9')

    expect(mockedDelete).toHaveBeenCalledWith('/tasks/task-9')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tasksKeys.all })
  })
})

describe('tasksKeys', () => {
  test('list keys are scoped by the whole param set', () => {
    expect(tasksKeys.list({ limit: 10, offset: 0 })).not.toEqual(tasksKeys.list({ limit: 10, offset: 10 }))
    expect(tasksKeys.list({ limit: 10, offset: 0 })).not.toEqual(
      tasksKeys.list({ limit: 10, offset: 0, status: 'done' }),
    )
    expect(tasksKeys.list({ limit: 10, offset: 0 })).not.toEqual(
      tasksKeys.list({ limit: 10, offset: 0, deal_id: DEAL_ID }),
    )
  })

  test('detail keys are scoped by id', () => {
    expect(tasksKeys.detail('a')).toEqual(['tasks', 'detail', 'a'])
  })

  test('the root key covers lists and details', () => {
    expect(tasksKeys.all).toEqual(['tasks'])
  })
})