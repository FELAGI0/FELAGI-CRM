import { describe, expect, test } from 'vitest'

import {
  dealFormSchema,
  dealToFormValues,
  emptyDealForm,
  toDealCreate,
  toDealUpdate,
} from '@/features/deals/deals.schemas'
import { t } from '@/lib/i18n'

const CLIENT_ID = '51bfac9f-a825-459e-847d-4956fcfbc8fa'

const valid = {
  title: 'Внедрение CRM',
  amount: '1234.56',
  status: 'new',
  client_id: CLIENT_ID,
} as const

const firstIssue = (input: unknown): { message: string; path: PropertyKey[] } | undefined => {
  const result = dealFormSchema.safeParse(input)
  const issue = result.success ? undefined : result.error.issues[0]
  return issue ? { message: issue.message, path: issue.path } : undefined
}

describe('dealFormSchema', () => {
  test('accepts a fully populated deal', () => {
    const result = dealFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  test('accepts an empty amount, meaning "no amount"', () => {
    const result = dealFormSchema.safeParse({ ...valid, amount: '' })
    expect(result.success).toBe(true)
  })

  test('requires a title', () => {
    expect(firstIssue({ ...valid, title: '' })).toEqual({ message: t.validation.required, path: ['title'] })
  })

  test('treats a whitespace-only title as empty', () => {
    expect(firstIssue({ ...valid, title: '   ' })?.message).toBe(t.validation.required)
  })

  test('rejects a title over 255 characters', () => {
    expect(firstIssue({ ...valid, title: 'a'.repeat(256) })?.message).toBe(t.validation.maxLength(255))
  })

  test('rejects a malformed amount', () => {
    expect(firstIssue({ ...valid, amount: 'abc' })?.message).toBe(t.validation.amountFormat)
    expect(firstIssue({ ...valid, amount: '1.234' })?.message).toBe(t.validation.amountFormat)
    expect(firstIssue({ ...valid, amount: '-5' })?.message).toBe(t.validation.amountFormat)
    expect(firstIssue({ ...valid, amount: '1,5' })?.message).toBe(t.validation.amountFormat)
  })

  test('accepts amounts with zero, one or two decimal places', () => {
    for (const amount of ['0', '100', '1234.5', '1234.56']) {
      expect(dealFormSchema.safeParse({ ...valid, amount }).success).toBe(true)
    }
  })

  test('requires a client to be chosen', () => {
    expect(firstIssue({ ...valid, client_id: '' })?.message).toBe(t.deals.form.selectClient)
  })

  test('rejects a client id that is not a uuid', () => {
    expect(firstIssue({ ...valid, client_id: 'not-a-uuid' })?.message).toBe(t.deals.form.selectClient)
  })

  test('rejects an unknown status', () => {
    const result = dealFormSchema.safeParse({ ...valid, status: 'archived' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['status'])
  })

  test('accepts every known status', () => {
    for (const status of ['new', 'in_progress', 'won', 'lost']) {
      expect(dealFormSchema.safeParse({ ...valid, status }).success).toBe(true)
    }
  })
})

describe('dealToFormValues', () => {
  test('maps a null amount to an empty string', () => {
    expect(dealToFormValues({ ...valid, amount: null }).amount).toBe('')
  })

  test('carries the stored amount through unchanged', () => {
    expect(dealToFormValues({ ...valid, amount: '16937.50' }).amount).toBe('16937.50')
  })

  test('fills every form field', () => {
    expect(dealToFormValues({ ...valid, amount: null })).toEqual({
      title: valid.title,
      amount: '',
      status: valid.status,
      client_id: valid.client_id,
    })
  })
})

describe('emptyDealForm', () => {
  test('defaults to the new status and no client', () => {
    expect(emptyDealForm.status).toBe('new')
    expect(emptyDealForm.client_id).toBe('')
    expect(emptyDealForm.amount).toBe('')
  })
})

describe('toDealCreate', () => {
  test('omits a blank amount so the column stays null', () => {
    const payload = toDealCreate({ ...valid, amount: '' })
    expect(payload).not.toHaveProperty('amount')
  })

  test('keeps the amount as a string, never a number', () => {
    const payload = toDealCreate({ ...valid, amount: '1234.56' })
    expect(payload.amount).toBe('1234.56')
    expect(typeof payload.amount).toBe('string')
  })

  test('trims the title', () => {
    expect(toDealCreate({ ...valid, title: '  Внедрение  ' }).title).toBe('Внедрение')
  })

  test('passes status and client through', () => {
    const payload = toDealCreate({ ...valid, status: 'won' })
    expect(payload.status).toBe('won')
    expect(payload.client_id).toBe(CLIENT_ID)
  })

  test('sends a large decimal without losing precision', () => {
    const payload = toDealCreate({ ...valid, amount: '999999999999.99' })
    expect(payload.amount).toBe('999999999999.99')
  })
})

describe('toDealUpdate', () => {
  test('omits a blank amount rather than sending an unusable value', () => {
    const payload = toDealUpdate({ ...valid, amount: '' })
    expect(payload).not.toHaveProperty('amount')
  })

  test('still carries the other fields when the amount is blank', () => {
    const payload = toDealUpdate({ ...valid, amount: '', status: 'lost' })
    expect(payload.status).toBe('lost')
    expect(payload.title).toBe(valid.title)
    expect(payload.client_id).toBe(CLIENT_ID)
  })

  test('keeps a stated amount as a string', () => {
    expect(toDealUpdate({ ...valid, amount: '100.50' }).amount).toBe('100.50')
  })
})