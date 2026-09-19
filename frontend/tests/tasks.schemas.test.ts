import { describe, expect, test } from 'vitest'

import {
  emptyTaskForm,
  taskFormSchema,
  taskToFormValues,
  toTaskCreate,
  toTaskUpdate,
} from '@/features/tasks/tasks.schemas'
import { fromDateInputValue, toDateInputValue } from '@/lib/format'
import { t } from '@/lib/i18n'

const DEAL_ID = '22222222-2222-4222-8222-222222222222'
const USER_ID = '6f1a9b3c-0d2e-4f5a-8b7c-1d2e3f4a5b6c'

const valid = {
  title: 'Подготовить КП',
  description: 'Согласовать с клиентом',
  status: 'todo',
  due_date: '2026-09-20',
  deal_id: DEAL_ID,
  assigned_to: '',
} as const

const firstIssue = (input: unknown): { message: string; path: PropertyKey[] } | undefined => {
  const result = taskFormSchema.safeParse(input)
  const issue = result.success ? undefined : result.error.issues[0]
  return issue ? { message: issue.message, path: issue.path } : undefined
}

describe('taskFormSchema', () => {
  test('accepts a fully populated task', () => {
    expect(taskFormSchema.safeParse(valid).success).toBe(true)
  })

  test('accepts empty optional fields', () => {
    expect(
      taskFormSchema.safeParse({
        ...valid,
        description: '',
        due_date: '',
        assigned_to: '',
      }).success,
    ).toBe(true)
  })

  test('requires a title', () => {
    expect(firstIssue({ ...valid, title: '' })).toEqual({ message: t.validation.required, path: ['title'] })
  })

  test('treats a whitespace-only title as empty', () => {
    expect(firstIssue({ ...valid, title: '   ' })?.message).toBe(t.validation.required)
  })

  test('rejects a title over 255 characters', () => {
    expect(firstIssue({ ...valid, title: 'a'.repeat(256) })?.message).toBe(t.validation.maxLength(255))
  })

  test('accepts every known status', () => {
    for (const status of ['todo', 'in_progress', 'done']) {
      expect(taskFormSchema.safeParse({ ...valid, status }).success).toBe(true)
    }
  })

  test('rejects an unknown status', () => {
    const result = taskFormSchema.safeParse({ ...valid, status: 'archived' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['status'])
  })

  test('accepts a yyyy-MM-dd due date', () => {
    expect(taskFormSchema.safeParse({ ...valid, due_date: '2026-01-05' }).success).toBe(true)
  })

  test('rejects a malformed due date', () => {
    expect(firstIssue({ ...valid, due_date: '20.09.2026' })?.message).toBe(t.validation.dateFormat)
    expect(firstIssue({ ...valid, due_date: '2026-9-5' })?.message).toBe(t.validation.dateFormat)
    expect(firstIssue({ ...valid, due_date: 'tomorrow' })?.message).toBe(t.validation.dateFormat)
  })

  test('requires a deal, matching the API', () => {
    expect(firstIssue({ ...valid, deal_id: '' })?.message).toBe(t.tasks.form.selectDeal)
  })

  test('rejects a deal id that is not a uuid', () => {
    expect(firstIssue({ ...valid, deal_id: 'not-a-uuid' })?.message).toBe(t.tasks.form.selectDeal)
  })

  test('accepts an empty assignee but rejects a malformed one', () => {
    expect(taskFormSchema.safeParse({ ...valid, assigned_to: '' }).success).toBe(true)
    expect(taskFormSchema.safeParse({ ...valid, assigned_to: USER_ID }).success).toBe(true)
    expect(firstIssue({ ...valid, assigned_to: 'nope' })?.message).toBe(t.validation.uuid)
  })
})

describe('emptyTaskForm', () => {
  test('defaults to the todo status and no relations', () => {
    expect(emptyTaskForm.status).toBe('todo')
    expect(emptyTaskForm.deal_id).toBe('')
    expect(emptyTaskForm.assigned_to).toBe('')
    expect(emptyTaskForm.due_date).toBe('')
  })
})

describe('toTaskCreate', () => {
  test('converts an empty due date to an omitted field', () => {
    expect(toTaskCreate({ ...valid, due_date: '' })).not.toHaveProperty('due_date')
  })

  test('converts an empty assigned_to to an omitted field', () => {
    expect(toTaskCreate({ ...valid, assigned_to: '' })).not.toHaveProperty('assigned_to')
  })

  test('converts an empty description to an omitted field', () => {
    expect(toTaskCreate({ ...valid, description: '' })).not.toHaveProperty('description')
  })

  test('sends a timezone-aware ISO datetime for the due date', () => {
    // A bare "yyyy-MM-dd" is rejected by the API with 422.
    const payload = toTaskCreate({ ...valid, due_date: '2026-09-20' })
    expect(payload.due_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(new Date(payload.due_date ?? '').getDate()).toBe(20)
  })

  test('trims the title and description', () => {
    const payload = toTaskCreate({ ...valid, title: '  КП  ', description: '  текст  ' })
    expect(payload.title).toBe('КП')
    expect(payload.description).toBe('текст')
  })

  test('always sends the required deal_id', () => {
    expect(toTaskCreate(valid).deal_id).toBe(DEAL_ID)
  })

  test('carries the assignee through when set', () => {
    expect(toTaskCreate({ ...valid, assigned_to: USER_ID }).assigned_to).toBe(USER_ID)
  })

  test('omits an empty description but keeps status', () => {
    const payload = toTaskCreate({ ...valid, description: '', status: 'in_progress' })
    expect(payload).not.toHaveProperty('description')
    expect(payload.status).toBe('in_progress')
  })
})

describe('toTaskUpdate', () => {
  test('omits blank nullable fields rather than sending unusable values', () => {
    const payload = toTaskUpdate({ ...valid, description: '', due_date: '', assigned_to: '' })
    expect(payload).not.toHaveProperty('description')
    expect(payload).not.toHaveProperty('due_date')
    expect(payload).not.toHaveProperty('assigned_to')
  })

  test('still carries the mutable fields when the rest are blank', () => {
    const payload = toTaskUpdate({ ...valid, description: '', status: 'done' })
    expect(payload.status).toBe('done')
    expect(payload.title).toBe(valid.title)
    expect(payload.deal_id).toBe(DEAL_ID)
  })
})

describe('taskToFormValues', () => {
  test('maps null relation and date fields to empty strings', () => {
    const values = taskToFormValues({
      title: 'Задача',
      description: null,
      status: 'todo',
      due_date: null,
      deal_id: null,
      assigned_to: null,
    })
    expect(values).toEqual({
      title: 'Задача',
      description: '',
      status: 'todo',
      due_date: '',
      deal_id: '',
      assigned_to: '',
    })
  })

  test('renders an ISO datetime as a yyyy-MM-dd input value', () => {
    const values = taskToFormValues({
      title: 'Задача',
      description: 'текст',
      status: 'done',
      due_date: '2026-09-20T12:00:00.000Z',
      deal_id: DEAL_ID,
      assigned_to: USER_ID,
    })
    expect(values.due_date).toBe('2026-09-20')
    expect(values.assigned_to).toBe(USER_ID)
  })
})

describe('date input helpers', () => {
  test('formats a datetime for a date input', () => {
    expect(toDateInputValue('2026-09-20T12:00:00.000Z')).toBe('2026-09-20')
    expect(toDateInputValue(null)).toBe('')
    expect(toDateInputValue('not-a-date')).toBe('')
  })

  test('anchors a date at local noon so the calendar day survives any offset', () => {
    const iso = fromDateInputValue('2026-09-20')
    expect(iso).not.toBeNull()
    const parsed = new Date(iso ?? '')
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(8)
    expect(parsed.getDate()).toBe(20)
    expect(parsed.getHours()).toBe(12)
  })

  test('returns null for an empty or malformed date', () => {
    expect(fromDateInputValue('')).toBeNull()
    expect(fromDateInputValue('   ')).toBeNull()
    expect(fromDateInputValue('nope')).toBeNull()
  })

  test('round-trips through the input format', () => {
    expect(toDateInputValue(fromDateInputValue('2026-01-05'))).toBe('2026-01-05')
  })
})