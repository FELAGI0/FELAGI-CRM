import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { t } from '@/lib/i18n'
import type { Client } from '@/types/api'

import { clientFormSchema, clientToFormValues, emptyClientForm, type ClientFormValues } from './clients.schemas'

export type ClientFormProps = {
  /** Present when editing; omitted when creating. */
  client?: Client
  onSubmit: (values: ClientFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

export const ClientForm = ({ client, onSubmit, onCancel, isSubmitting }: ClientFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client ? clientToFormValues(client) : emptyClientForm,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="client-name">{t.clients.form.name} *</FieldLabel>
          <Input
            id="client-name"
            placeholder={t.clients.form.namePlaceholder}
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="client-email">{t.clients.form.email}</FieldLabel>
            <Input
              id="client-email"
              type="email"
              placeholder={t.clients.form.emailPlaceholder}
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={Boolean(errors.phone)}>
            <FieldLabel htmlFor="client-phone">{t.clients.form.phone}</FieldLabel>
            <Input
              id="client-phone"
              placeholder={t.clients.form.phonePlaceholder}
              aria-invalid={Boolean(errors.phone)}
              {...register('phone')}
            />
            <FieldError errors={[errors.phone]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.company)}>
          <FieldLabel htmlFor="client-company">{t.clients.form.company}</FieldLabel>
          <Input
            id="client-company"
            placeholder={t.clients.form.companyPlaceholder}
            aria-invalid={Boolean(errors.company)}
            {...register('company')}
          />
          <FieldError errors={[errors.company]} />
        </Field>

        <div className="flex flex-col gap-2">
          <Label htmlFor="client-notes">{t.clients.form.notes}</Label>
          <textarea
            id="client-notes"
            rows={3}
            placeholder={t.clients.form.notesPlaceholder}
            className="w-full rounded-control border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary transition-colors focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/50"
            {...register('notes')}
          />
          <FieldError errors={[errors.notes]} />
        </div>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {isSubmitting
            ? t.clients.form.saving
            : client
              ? t.clients.form.saveChanges
              : t.clients.createClient}
        </Button>
      </div>
    </form>
  )
}