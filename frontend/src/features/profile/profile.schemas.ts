import { z } from 'zod'

import { t } from '@/lib/i18n'
import type { User, UserUpdateMe } from '@/types/api'

/**
 * Name and email are both optional individually, but at least one must be
 * present: the API answers 422 for an empty payload, and an untouched form
 * should not produce a request at all.
 */
export const profileSchema = z
  .object({
    name: z.string().trim().max(255, t.validation.maxLength(255)).optional(),
    email: z.union([z.literal(''), z.email(t.validation.email)]).optional(),
  })
  .refine((values) => Boolean(values.name) || Boolean(values.email), {
    message: t.validation.required,
    path: ['name'],
  })

/** Mirrors the API policy: 12-128 with a lowercase, uppercase and a digit. */
const newPasswordSchema = z
  .string()
  .min(12, t.validation.passwordMin)
  .max(128, t.validation.passwordMax)
  .regex(/[a-z]/, t.validation.passwordLower)
  .regex(/[A-Z]/, t.validation.passwordUpper)
  .regex(/\d/, t.validation.passwordDigit)

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, t.validation.passwordRequired),
    new_password: newPasswordSchema,
    confirm_password: z.string().min(1, t.validation.passwordRequired),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: t.profile.passwordsMismatch,
    path: ['confirm_password'],
  })

export type ProfileFormValues = z.infer<typeof profileSchema>
export type PasswordFormValues = z.infer<typeof passwordSchema>

/** Seeds the profile form from the signed-in user. */
export const userToProfileForm = (user: User | null): ProfileFormValues => ({
  name: user?.name ?? '',
  email: user?.email ?? '',
})

/**
 * Builds the update payload, dropping values that did not change so the request
 * carries only real edits.
 */
export const toUserUpdateMe = (values: ProfileFormValues, user: User | null): UserUpdateMe => {
  const payload: UserUpdateMe = {}
  const name = values.name?.trim() ?? ''
  const email = values.email?.trim().toLowerCase() ?? ''

  if (name && name !== (user?.name ?? '')) payload.name = name
  if (email && email !== (user?.email ?? '')) payload.email = email
  return payload
}