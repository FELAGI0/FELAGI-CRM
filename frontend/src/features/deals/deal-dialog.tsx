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
import type { Client, Deal } from '@/types/api'

import { DealForm } from './deal-form'
import { toDealCreate, toDealUpdate, type DealFormValues } from './deals.schemas'
import { useCreateDeal, useUpdateDeal } from './deals.queries'

type BaseProps = {
  /** Options for the client selector, usually the first 100 clients. */
  clients: Client[]
  /** Required in edit mode. */
  deal?: Deal
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
  deal: Deal
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type DealDialogProps = CreateProps | EditProps

export const DealDialog = (props: DealDialogProps) => {
  const { mode, deal, clients, trigger } = props
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  const isControlled = props.open !== undefined
  const open = isControlled ? props.open === true : uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    props.onOpenChange?.(next)
  }

  // The update mutation is keyed by id, so it is only instantiated when editing.
  const createMutation = useCreateDeal()
  const updateMutation = useUpdateDeal(mode === 'edit' ? deal.id : '')

  const isEdit = mode === 'edit'
  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending

  const handleSubmit = async (values: DealFormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(toDealUpdate(values))
      } else {
        await createMutation.mutateAsync(toDealCreate(values))
      }
      setOpen(false)
      toast.success(isEdit ? t.deals.updated : t.deals.created)
    } catch (error) {
      toast.error(getErrorMessage(error, isEdit ? t.deals.updateFailed : t.deals.createFailed))
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
          <DialogTitle>{isEdit ? t.deals.editDeal : t.deals.createDeal}</DialogTitle>
          <DialogDescription>{isEdit ? t.deals.editSubtitle : t.deals.createSubtitle}</DialogDescription>
        </DialogHeader>
        <DealForm
          deal={isEdit ? deal : undefined}
          clients={clients}
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