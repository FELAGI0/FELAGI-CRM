import { z } from 'zod'

import { t } from '@/lib/i18n'
import type { Role } from '@/types/api'

/** Mirrors the API's password policy: 12-128 with lower, upper and a digit. */
const passwordSchema = z
  .string()
  .min(12, t.validation.passwordMin)
  .max(128, t.validation.passwordMax)
  .regex(/[a-z]/, t.validation.passwordLower)
  .regex(/[A-Z]/, t.validation.passwordUpper)
  .regex(/\d/, t.validation.passwordDigit)

export const userCreateSchema = z.object({
  email: z.email(t.validation.email),
  password: passwordSchema,
  role: z.enum(['admin', 'manager', 'user']),
})

/**
 * An edit carries at least one change. The API answers 422 for an empty body,
 * so the same rule is enforced here before the request is made.
 */
export const userUpdateSchema = z
  .object({
    role: z.enum(['admin', 'manager', 'user']).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((values) => values.role !== undefined || values.is_active !== undefined, {
    message: t.validation.required,
    path: ['role'],
  })

export type UserCreateFormValues = z.infer<typeof userCreateSchema>
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>

export const emptyUserCreateForm: UserCreateFormValues = {
  email: '',
  password: '',
  role: 'user',
}

export const emptyUserUpdateForm: UserUpdateFormValues = {
  role: 'user',
  is_active: true,
}

/** Builds the update payload, omitting fields the user did not change. */
export const toUserAdminUpdate = (
  values: UserUpdateFormValues,
  original: { role: Role; is_active: boolean },
): Partial<{ role: Role; is_active: boolean }> => {
  const payload: Partial<{ role: Role; is_active: boolean }> = {}
  if (values.role !== undefined && values.role !== original.role) payload.role = values.role
  if (values.is_active !== undefined && values.is_active !== original.is_active) {
    payload.is_active = values.is_active
  }
  return payload
}