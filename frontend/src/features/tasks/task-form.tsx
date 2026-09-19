import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { t } from '@/lib/i18n'
import type { Deal, Task, TaskStatus } from '@/types/api'

import { emptyTaskForm, taskFormSchema, taskToFormValues, type TaskFormValues } from './tasks.schemas'

const STATUS_KEYS: readonly TaskStatus[] = ['todo', 'in_progress', 'done']

export type TaskFormProps = {
  /** Present when editing; omitted when creating. */
  task?: Task
  /** Options for the deal selector. */
  deals: Deal[]
  /**
   * Whether the assignee selector is shown. The API has no user directory, so
   * this is limited to "me" and "unassigned"; a plain user is always assigned to
   * themselves server-side and the field is hidden.
   */
  canChooseAssignee: boolean
  /** Current user's id and label — the only assignee offered in this MVP. */
  currentUserId: string
  currentUserLabel: string
  onSubmit: (values: TaskFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

export const TaskForm = ({
  task,
  deals,
  canChooseAssignee,
  currentUserId,
  currentUserLabel,
  onSubmit,
  onCancel,
  isSubmitting,
}: TaskFormProps) => {
  // A task assigned to a third party keeps that value visible but unchangeable —
  // there is no user directory to pick them from.
  const foreignAssigneeId =
    task?.assigned_to && task.assigned_to !== currentUserId ? task.assigned_to : null
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task ? taskToFormValues(task) : emptyTaskForm,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor="task-title">{t.tasks.form.title} *</FieldLabel>
          <Input
            id="task-title"
            placeholder={t.tasks.form.titlePlaceholder}
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <div className="flex flex-col gap-2">
          <Label htmlFor="task-description">{t.tasks.form.description}</Label>
          <textarea
            id="task-description"
            rows={3}
            placeholder={t.tasks.form.descriptionPlaceholder}
            className="w-full rounded-control border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary transition-colors focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/50"
            {...register('description')}
          />
          <FieldError errors={[errors.description]} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.status)}>
            <FieldLabel htmlFor="task-status">{t.tasks.form.status}</FieldLabel>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (typeof value === 'string') field.onChange(value)
                  }}
                >
                  <SelectTrigger
                    id="task-status"
                    className="w-full"
                    aria-label={t.tasks.form.selectStatus}
                    aria-invalid={Boolean(errors.status)}
                  >
                    <SelectValue>
                      {(value: unknown) =>
                        typeof value === 'string' ? t.status.task[value as TaskStatus] : null
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_KEYS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t.status.task[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.status]} />
          </Field>

          <Field data-invalid={Boolean(errors.due_date)}>
            <FieldLabel htmlFor="task-due-date">{t.tasks.form.dueDate}</FieldLabel>
            <Input
              id="task-due-date"
              type="date"
              aria-invalid={Boolean(errors.due_date)}
              {...register('due_date')}
            />
            <FieldError errors={[errors.due_date]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.deal_id)}>
          <FieldLabel htmlFor="task-deal">{t.tasks.form.deal} *</FieldLabel>
          <Controller
            control={control}
            name="deal_id"
            render={({ field }) => (
              <Select
                value={field.value === '' ? null : field.value}
                onValueChange={(value) => {
                  if (typeof value === 'string') field.onChange(value)
                }}
              >
                <SelectTrigger
                  id="task-deal"
                  className="w-full"
                  aria-label={t.tasks.filters.filterByDeal}
                  aria-invalid={Boolean(errors.deal_id)}
                >
                  <SelectValue placeholder={t.tasks.form.selectDeal}>
                    {(value: unknown) =>
                      typeof value === 'string'
                        ? (deals.find((deal) => deal.id === value)?.title ?? t.tasks.form.selectDeal)
                        : t.tasks.form.selectDeal
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.deal_id]} />
        </Field>

        {canChooseAssignee && (
          <Field data-invalid={Boolean(errors.assigned_to)}>
            <FieldLabel htmlFor="task-assignee">{t.tasks.form.assignee}</FieldLabel>
            <Controller
              control={control}
              name="assigned_to"
              render={({ field }) => (
                <Select
                  value={field.value === '' ? null : field.value}
                  onValueChange={(value) => {
                    field.onChange(typeof value === 'string' ? value : '')
                  }}
                >
                  <SelectTrigger
                    id="task-assignee"
                    className="w-full"
                    aria-label={t.tasks.filters.filterByAssignee}
                    aria-invalid={Boolean(errors.assigned_to)}
                  >
                    <SelectValue placeholder={t.tasks.form.unassigned}>
                      {(value: unknown) =>
                        typeof value === 'string'
                          ? value === currentUserId
                            ? currentUserLabel
                            : t.tasks.form.otherAssignee
                          : t.tasks.form.unassigned
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>{t.tasks.form.unassigned}</SelectItem>
                    <SelectItem value={currentUserId}>{currentUserLabel}</SelectItem>
                    {foreignAssigneeId && (
                      <SelectItem value={foreignAssigneeId}>{t.tasks.form.otherAssignee}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-text-secondary">{t.tasks.assigneeSelfOnly}</p>
            <FieldError errors={[errors.assigned_to]} />
          </Field>
        )}
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {isSubmitting ? t.tasks.form.saving : task ? t.tasks.form.saveChanges : t.tasks.createTask}
        </Button>
      </div>
    </form>
  )
}