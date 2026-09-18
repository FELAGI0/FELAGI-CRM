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
import type { Client } from '@/types/api'

import { ClientForm } from './client-form'
import { toClientCreate, toClientUpdate, type ClientFormValues } from './clients.schemas'
import { useCreateClient, useUpdateClient } from './clients.queries'

type BaseProps = {
  /** Required in edit mode. */
  client?: Client
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
  client: Client
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type ClientDialogProps = CreateProps | EditProps

export const ClientDialog = (props: ClientDialogProps) => {
  const { mode, client, trigger } = props
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  const isControlled = props.open !== undefined
  const open = isControlled ? props.open === true : uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    props.onOpenChange?.(next)
  }

  // The update mutation is keyed by id, so it is only instantiated when editing.
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient(mode === 'edit' ? client.id : '')

  const isEdit = mode === 'edit'
  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending

  const handleSubmit = async (values: ClientFormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(toClientUpdate(values))
      } else {
        await createMutation.mutateAsync(toClientCreate(values))
      }
      setOpen(false)
      toast.success(isEdit ? t.clients.updated : t.clients.created)
    } catch (error) {
      toast.error(getErrorMessage(error, isEdit ? t.clients.updateFailed : t.clients.createFailed))
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
          <DialogTitle>{isEdit ? t.clients.editClient : t.clients.createClient}</DialogTitle>
          <DialogDescription>
            {isEdit ? t.clients.editSubtitle : t.clients.createSubtitle}
          </DialogDescription>
        </DialogHeader>
        <ClientForm
          client={isEdit ? client : undefined}
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