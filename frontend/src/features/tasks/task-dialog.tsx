import { useState, type ReactElement, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'
import type { Deal, Task } from '@/types/api'

import { TaskForm } from './task-form'
import { toTaskCreate, toTaskUpdate, type TaskFormValues } from './tasks.schemas'
import { useCreateTask, useUpdateTask } from './tasks.queries'

type BaseProps = {
  /** Options for the deal selector, usually the first 100 deals. */
  deals: Deal[]
  /** Whether the assignee selector is shown (admin and manager only). */
  canChooseAssignee: boolean
  /** Current user's id, used as the only selectable assignee. */
  currentUserId: string
  currentUserLabel: string
  /** Required in edit mode. */
  task?: Task
  /** Optional trigger; omit to drive the dialog from a parent via `open`. */
  trigger?: ReactNode
}

type CreateProps = BaseProps & {
  mode: 'create'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type EditProps = BaseProps & {
  mode: 'edit'
  task: Task
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type TaskDialogProps = CreateProps | EditProps

export const TaskDialog = (props: TaskDialogProps) => {
  const { mode, task, deals, canChooseAssignee, currentUserId, currentUserLabel, trigger } = props
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  const isControlled = props.open !== undefined
  const open = isControlled ? props.open === true : uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    props.onOpenChange?.(next)
  }

  // The update mutation is keyed by id, so it is only instantiated when editing.
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask(mode === 'edit' ? task.id : '')

  const isEdit = mode === 'edit'
  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending

  const handleSubmit = async (values: TaskFormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(toTaskUpdate(values))
      } else {
        await createMutation.mutateAsync(toTaskCreate(values))
      }
      setOpen(false)
      toast.success(isEdit ? t.tasks.updated : t.tasks.created)
    } catch (error) {
      toast.error(getErrorMessage(error, isEdit ? t.tasks.updateFailed : t.tasks.createFailed))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Ignore close requests while a request is in flight.
        if (isSubmitting && !next) return
        setOpen(next)
      }}
    >
      {trigger !== undefined && <DialogTrigger render={trigger as ReactElement} />}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.tasks.editTask : t.tasks.createTask}</DialogTitle>
          <DialogDescription>{isEdit ? t.tasks.editSubtitle : t.tasks.createSubtitle}</DialogDescription>
        </DialogHeader>
        <TaskForm
          task={isEdit ? task : undefined}
          deals={deals}
          canChooseAssignee={canChooseAssignee}
          currentUserId={currentUserId}
          currentUserLabel={currentUserLabel}
          onSubmit={(values) => {
            void handleSubmit(values)
          }}
          onCancel={() => setOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}