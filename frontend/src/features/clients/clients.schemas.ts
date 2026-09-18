import { z } from 'zod'

import { t } from '@/lib/i18n'
import type { ClientCreate, ClientUpdate } from '@/types/api'

export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, t.validation.required)
    .max(255, t.validation.maxLength(255)),
  email: z.union([z.email(t.validation.email), z.literal('')]),
  phone: z.string().max(32, t.validation.maxLength(32)),
  company: z.string().max(255, t.validation.maxLength(255)),
  notes: z.string(),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

const trimmed = (value: string): string => value.trim()

export const emptyClientForm: ClientFormValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
}

/** Maps an existing client onto form values for the edit dialog. */
export const clientToFormValues = (client: {
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
}): ClientFormValues => ({
  name: client.name,
  email: client.email ?? '',
  phone: client.phone ?? '',
  company: client.company ?? '',
  notes: client.notes ?? '',
})

/**
 * Create payload: blank optional fields are omitted so the column stays NULL
 * rather than an empty string. An empty email becomes `undefined` for the same
 * reason (the API rejects "" outright, since it validates EmailStr).
 */
export const toClientCreate = (values: ClientFormValues): ClientCreate => {
  const email = trimmed(values.email)
  const phone = trimmed(values.phone)
  const company = trimmed(values.company)
  const notes = trimmed(values.notes)

  return {
    name: trimmed(values.name),
    ...(email === '' ? {} : { email }),
    ...(phone === '' ? {} : { phone }),
    ...(company === '' ? {} : { company }),
    ...(notes === '' ? {} : { notes }),
  }
}

/**
 * Update payload. The backend applies `exclude_none=True`, so nulls are dropped
 * silently — an emptied text field is therefore sent as "" to actually clear it.
 * Email is the exception: the API validates it as EmailStr, so both "" and null
 * are rejected, and clearing an email is simply not supported. A blank email is
 * omitted, leaving the stored value untouched.
 */
export const toClientUpdate = (values: ClientFormValues): ClientUpdate => {
  const email = trimmed(values.email)

  return {
    name: trimmed(values.name),
    ...(email === '' ? {} : { email }),
    phone: trimmed(values.phone),
    company: trimmed(values.company),
    notes: trimmed(values.notes),
  }
}