import { z } from 'zod'

import { t } from '@/lib/i18n'
import type { DealCreate, DealStatus, DealUpdate } from '@/types/api'

const DEAL_STATUSES = ['new', 'in_progress', 'won', 'lost'] as const

export const dealStatusSchema = z.enum(DEAL_STATUSES)

/** Amount is a decimal string, at most two fraction digits, never negative. */
export const amountPattern = /^\d+(\.\d{1,2})?$/

export const dealFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, t.validation.required)
    .max(255, t.validation.maxLength(255)),
  amount: z.union([
    z.string().regex(amountPattern, t.validation.amountFormat),
    z.literal(''),
  ]),
  status: dealStatusSchema,
  /** Covers both "nothing chosen yet" (empty string) and a malformed id. */
  client_id: z
    .string()
    .refine((value) => z.uuid().safeParse(value).success, { message: t.deals.form.selectClient }),
})

export type DealFormValues = z.infer<typeof dealFormSchema>

export const emptyDealForm: DealFormValues = {
  title: '',
  amount: '',
  status: 'new',
  client_id: '',
}

/** Maps an existing deal onto form values for the edit dialog. */
export const dealToFormValues = (deal: {
  title: string
  amount: string | null
  status: DealStatus
  client_id: string
}): DealFormValues => ({
  title: deal.title,
  amount: deal.amount ?? '',
  status: deal.status,
  client_id: deal.client_id,
})

/**
 * Create payload. A blank amount is omitted so the column stays NULL.
 *
 * The amount stays a string on purpose: parsing it into a JS number would lose
 * precision on large decimals, and the API accepts the string form directly.
 */
export const toDealCreate = (values: DealFormValues): DealCreate => {
  const amount = values.amount.trim()

  return {
    title: values.title.trim(),
    status: values.status,
    client_id: values.client_id,
    ...(amount === '' ? {} : { amount }),
  }
}

/**
 * Update payload. `exclude_none=True` on the backend drops nulls, and a payload
 * with no fields at all is rejected with 422 — so an emptied amount is omitted
 * rather than sent, leaving any previously stored amount in place. Clearing an
 * amount once set is not supported by the API.
 */
export const toDealUpdate = (values: DealFormValues): DealUpdate => {
  const amount = values.amount.trim()

  return {
    title: values.title.trim(),
    status: values.status,
    client_id: values.client_id,
    ...(amount === '' ? {} : { amount }),
  }
}