import { z } from 'zod'

import { t } from '@/lib/i18n'

export const loginSchema = z.object({
  email: z.email(t.validation.email),
  password: z.string().min(1, t.validation.passwordRequired),
})

export const registerSchema = z.object({
  email: z.email(t.validation.email),
  password: z
    .string()
    .min(12, t.validation.passwordMin)
    .max(128, t.validation.passwordMax)
    .regex(/[a-z]/, t.validation.passwordLower)
    .regex(/[A-Z]/, t.validation.passwordUpper)
    .regex(/\d/, t.validation.passwordDigit),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>