import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/error-message'
import { t } from '@/lib/i18n'
import type { User } from '@/types/api'

import { UserForm } from './user-form'
import { toUserAdminUpdate, type UserCreateFormValues, type UserUpdateFormValues } from './users.schemas'
import { useCreateUser, useUpdateUser } from './users.queries'

export type UserDialogProps =
  | {
      mode: 'create'
      open: boolean
      onOpenChange: (open: boolean) => void
    }
  | {
      mode: 'edit'
      user: User
      open: boolean
      onOpenChange: (open: boolean) => void
    }

export const UserDialog = (props: UserDialogProps) => {
  const { mode, open, onOpenChange } = props
  const isEdit = mode === 'edit'

  // The update mutation is keyed by id, so it is only real while editing.
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(isEdit ? props.user.id : '')
  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending

  const handleSubmit = async (values: UserCreateFormValues | UserUpdateFormValues) => {
    try {
      if (isEdit) {
        const payload = toUserAdminUpdate(values as UserUpdateFormValues, {
          role: props.user.role,
          is_active: props.user.is_active,
        })
        // The API rejects an empty body, so an unchanged form is a no-op rather
        // than a request that would come back 422.
        if (Object.keys(payload).length === 0) {
          onOpenChange(false)
          return
        }
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(values as UserCreateFormValues)
      }
      onOpenChange(false)
      toast.success(isEdit ? t.users.updated : t.users.created)
    } catch (error) {
      toast.error(getErrorMessage(error, isEdit ? t.users.updateFailed : t.users.createdFailed))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Ignore close requests while a request is in flight.
        if (isSubmitting && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.users.editUser : t.users.createUser}</DialogTitle>
          <DialogDescription>
            {isEdit ? t.users.editSubtitle : t.users.createSubtitle}
          </DialogDescription>
        </DialogHeader>
        <UserForm
          user={isEdit ? props.user : undefined}
          onSubmit={(values) => {
            void handleSubmit(values)
          }}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}