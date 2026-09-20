import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { t } from '@/lib/i18n'
import { ROLES } from './users.api'
import type { User } from '@/types/api'

import {
  emptyUserCreateForm,
  userCreateSchema,
  userUpdateSchema,
  type UserCreateFormValues,
  type UserUpdateFormValues,
} from './users.schemas'

const roleLabels = {
  admin: t.users.roles.admin,
  manager: t.users.roles.manager,
  user: t.users.roles.user,
} as const

export type UserFormProps = {
  /** Present when editing; omitted when creating. */
  user?: User
  onSubmit: (values: UserCreateFormValues | UserUpdateFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

/**
 * One component covers both modes: create needs email, password and role, while
 * edit only changes role and the active flag. The two shapes differ enough that
 * each mode renders its own fields rather than sharing a single form object.
 */
export const UserForm = ({ user, onSubmit, onCancel, isSubmitting }: UserFormProps) => {
  const isEdit = user !== undefined

  const createForm = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: emptyUserCreateForm,
  })

  const updateForm = useForm<UserUpdateFormValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: { role: user?.role ?? 'user', is_active: user?.is_active ?? true },
  })

  if (isEdit) {
    const {
      handleSubmit,
      setValue,
      watch,
      formState: { errors },
    } = updateForm
    const role = watch('role') ?? user.role
    const isActive = watch('is_active') ?? user.is_active

    return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel>{t.users.form.email}</FieldLabel>
            {/* Email is the account identifier and is not editable. */}
            <Input id="user-email" value={user.email} readOnly disabled />
          </Field>

          <Field data-invalid={Boolean(errors.role)}>
            <FieldLabel htmlFor="user-role">{t.users.form.role} *</FieldLabel>
            <Select
              value={role}
              onValueChange={(value) => setValue('role', value as User['role'], { shouldDirty: true })}
            >
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue placeholder={t.users.form.selectRole}>
                  {(value: unknown) =>
                    typeof value === 'string' ? roleLabels[value as User['role']] : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {roleLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[errors.role]} />
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-3">
              <div>
                <FieldLabel htmlFor="user-active">{t.users.form.isActive}</FieldLabel>
                <p className="text-xs text-text-secondary">{t.users.form.isActiveHint}</p>
              </div>
              {/* A plain checkbox: the UI kit has no Switch primitive, and adding
                  one for a single field would be a bigger change than it earns. */}
              <input
                id="user-active"
                type="checkbox"
                checked={isActive}
                onChange={(event) => setValue('is_active', event.target.checked, { shouldDirty: true })}
                className="size-4 shrink-0 accent-accent"
              />
            </div>
          </Field>
        </FieldGroup>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {isSubmitting ? t.users.form.saving : t.users.form.saveChanges}
          </Button>
        </div>
      </form>
    )
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = createForm
  const createRole = watch('role') ?? 'user'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="user-email">{t.users.form.email} *</FieldLabel>
          <Input
            id="user-email"
            type="email"
            placeholder={t.users.form.emailPlaceholder}
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="user-password">{t.users.form.password} *</FieldLabel>
          <Input
            id="user-password"
            type="password"
            placeholder={t.users.form.passwordPlaceholder}
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <p className="text-xs text-text-secondary">{t.users.form.passwordHint}</p>
          )}
        </Field>

        <Field data-invalid={Boolean(errors.role)}>
          <FieldLabel htmlFor="user-role">{t.users.form.role} *</FieldLabel>
          <Select
            value={createRole}
            onValueChange={(value) => setValue('role', value as User['role'], { shouldDirty: true })}
          >
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue placeholder={t.users.form.selectRole}>
                {(value: unknown) =>
                  typeof value === 'string' ? roleLabels[value as User['role']] : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((option) => (
                <SelectItem key={option} value={option}>
                  {roleLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[errors.role]} />
        </Field>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {isSubmitting ? t.users.form.saving : t.users.createUser}
        </Button>
      </div>
    </form>
  )
}