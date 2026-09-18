import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { t } from '@/lib/i18n'
import type { Client, Deal, DealStatus } from '@/types/api'

import { dealFormSchema, dealToFormValues, emptyDealForm, type DealFormValues } from './deals.schemas'

const STATUS_KEYS: readonly DealStatus[] = ['new', 'in_progress', 'won', 'lost']

export type DealFormProps = {
  /** Present when editing; omitted when creating. */
  deal?: Deal
  /** Options for the client selector. */
  clients: Client[]
  onSubmit: (values: DealFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

export const DealForm = ({ deal, clients, onSubmit, onCancel, isSubmitting }: DealFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: deal ? dealToFormValues(deal) : emptyDealForm,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor="deal-title">{t.deals.form.title} *</FieldLabel>
          <Input
            id="deal-title"
            placeholder={t.deals.form.titlePlaceholder}
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.amount)}>
            <FieldLabel htmlFor="deal-amount">{t.deals.form.amount}</FieldLabel>
            <Input
              id="deal-amount"
              inputMode="decimal"
              placeholder={t.deals.form.amountPlaceholder}
              aria-invalid={Boolean(errors.amount)}
              {...register('amount')}
            />
            <FieldError errors={[errors.amount]} />
          </Field>

          <Field data-invalid={Boolean(errors.status)}>
            <FieldLabel htmlFor="deal-status">{t.deals.form.status}</FieldLabel>
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
                    id="deal-status"
                    className="w-full"
                    aria-label={t.deals.form.selectStatus}
                    aria-invalid={Boolean(errors.status)}
                  >
                    <SelectValue>
                      {(value: unknown) =>
                        typeof value === 'string' ? t.status.deal[value as DealStatus] : null
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_KEYS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t.status.deal[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.status]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.client_id)}>
          <FieldLabel htmlFor="deal-client">{t.deals.form.client} *</FieldLabel>
          <Controller
            control={control}
            name="client_id"
            render={({ field }) => (
              <Select
                value={field.value === '' ? null : field.value}
                onValueChange={(value) => {
                  if (typeof value === 'string') field.onChange(value)
                }}
              >
                <SelectTrigger
                  id="deal-client"
                  className="w-full"
                  aria-label={t.filters.filterByClient}
                  aria-invalid={Boolean(errors.client_id)}
                >
                  <SelectValue placeholder={t.deals.form.selectClient}>
                    {(value: unknown) =>
                      typeof value === 'string'
                        ? (clients.find((client) => client.id === value)?.name ?? t.deals.form.selectClient)
                        : t.deals.form.selectClient
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.client_id]} />
        </Field>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {isSubmitting ? t.deals.form.saving : deal ? t.deals.form.saveChanges : t.deals.createDeal}
        </Button>
      </div>
    </form>
  )
}