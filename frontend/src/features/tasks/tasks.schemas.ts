import { z } from 'zod'

import { fromDateInputValue, toDateInputValue } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { Task, TaskCreate, TaskStatus, TaskUpdate } from '@/types/api'

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done'])

/** `<input type="date">` emits "yyyy-MM-dd"; anything else is treated as unset. */
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, t.validation.required)
    .max(255, t.validation.maxLength(255)),
  description: z.string(),
  status: taskStatusSchema,
  due_date: z.union([z.string().regex(DATE_INPUT_PATTERN, t.validation.dateFormat), z.literal('')]),
  // The API requires a deal, so this behaves as mandatory despite the nullable
  // type on TaskRead.
  deal_id: z
    .string()
    .refine((value) => z.uuid().safeParse(value).success, { message: t.tasks.form.selectDeal }),
  assigned_to: z.union([z.uuid(t.validation.uuid), z.literal('')]),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const emptyTaskForm: TaskFormValues = {
  title: '',
  description: '',
  status: 'todo',
  due_date: '',
  deal_id: '',
  assigned_to: '',
}

/** Maps an existing task onto form values for the edit dialog. */
export const taskToFormValues = (task: {
  title: string
  description: string | null
  status: TaskStatus
  due_date: string | null
  deal_id: string | null
  assigned_to: string | null
}): TaskFormValues => ({
  title: task.title,
  description: task.description ?? '',
  status: task.status,
  due_date: toDateInputValue(task.due_date),
  deal_id: task.deal_id ?? '',
  assigned_to: task.assigned_to ?? '',
})

/**
 * Create payload. Blank optional fields are omitted so the API stores NULL.
 * `due_date` is converted into the timezone-aware ISO datetime the API demands —
 * sending "yyyy-MM-dd" is rejected with 422.
 */
export const toTaskCreate = (values: TaskFormValues): TaskCreate => {
  const description = values.description.trim()
  const dueDate = fromDateInputValue(values.due_date)
  const assignedTo = values.assigned_to.trim()

  return {
    title: values.title.trim(),
    status: values.status,
    deal_id: values.deal_id,
    ...(description === '' ? {} : { description }),
    ...(dueDate === null ? {} : { due_date: dueDate }),
    ...(assignedTo === '' ? {} : { assigned_to: assignedTo }),
  }
}

/**
 * Update payload. `exclude_none=True` on the backend drops nulls, and a payload
 * with no fields is rejected with 422, so an emptied description or due date is
 * omitted and the stored value survives. Clearing either is not supported by the
 * API without a dedicated null-sending path.
 */
export const toTaskUpdate = (values: TaskFormValues): TaskUpdate => {
  const description = values.description.trim()
  const dueDate = fromDateInputValue(values.due_date)
  const assignedTo = values.assigned_to.trim()

  return {
    title: values.title.trim(),
    status: values.status,
    deal_id: values.deal_id,
    ...(description === '' ? {} : { description }),
    ...(dueDate === null ? {} : { due_date: dueDate }),
    ...(assignedTo === '' ? {} : { assigned_to: assignedTo }),
  }
}

/** Rehydrates a form from an existing task; exported for the edit dialog. */
export const taskFormFromTask = (task: Task): TaskFormValues => taskToFormValues(task)