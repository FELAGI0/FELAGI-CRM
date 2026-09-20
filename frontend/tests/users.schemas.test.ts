import { describe, expect, test } from 'vitest'

import {
  emptyUserCreateForm,
  toUserAdminUpdate,
  userCreateSchema,
  userUpdateSchema,
} from '@/features/users/users.schemas'

const validPassword = 'AnotherPassword123'

const firstMessage = (result: { success: boolean; error?: { issues: Array<{ message: string }> } }): string =>
  result.error?.issues[0]?.message ?? ''

describe('userCreateSchema', () => {
  test('accepts a valid payload', () => {
    const result = userCreateSchema.safeParse({
      email: 'new@example.com',
      password: validPassword,
      role: 'manager',
    })

    expect(result.success).toBe(true)
  })

  test('defaults an empty form to the plain user role', () => {
    expect(emptyUserCreateForm.role).toBe('user')
    expect(emptyUserCreateForm.email).toBe('')
  })

  test('rejects an invalid email', () => {
    const result = userCreateSchema.safeParse({
      email: 'not-an-email',
      password: validPassword,
      role: 'user',
    })

    expect(result.success).toBe(false)
  })

  test('rejects a password shorter than 12 characters', () => {
    const result = userCreateSchema.safeParse({
      email: 'new@example.com',
      password: 'Sh0rt',
      role: 'user',
    })

    expect(result.success).toBe(false)
  })

  test('accepts a password of exactly 128 characters', () => {
    // The boundary is inclusive, so this must pass.
    const result = userCreateSchema.safeParse({
      email: 'new@example.com',
      password: `${'a'.repeat(126)}A1`,
      role: 'user',
    })

    expect(result.success).toBe(true)
  })

  test('rejects a password longer than 128 characters', () => {
    const result = userCreateSchema.safeParse({
      email: 'new@example.com',
      password: `${'a'.repeat(127)}A1`,
      role: 'user',
    })

    expect(result.success).toBe(false)
  })

  test('requires a lowercase letter', () => {
    const result = userCreateSchema.safeParse({
      email: 'new@example.com',
      password: 'ALLUPPERCASE123',
      role: 'user',
    })

    expect(result.success).toBe(false)
  })

  test('requires an uppercase letter', () => {
    const result = userCreateSchema.safeParse({
      email: 'new@example.com',
      password: 'alllowercase123',
      role: 'user',
    })

    expect(result.success).toBe(false)
  })

  test('requires a digit', () => {
    const result = userCreateSchema.safeParse({
      email: 'new@example.com',
      password: 'NoDigitsInPassword',
      role: 'user',
    })

    expect(result.success).toBe(false)
  })

  test('accepts each of the three known roles', () => {
    for (const role of ['admin', 'manager', 'user'] as const) {
      const result = userCreateSchema.safeParse({
        email: `${role}@example.com`,
        password: validPassword,
        role,
      })
      expect(result.success).toBe(true)
    }
  })

  test('rejects an unknown role', () => {
    const result = userCreateSchema.safeParse({
      email: 'new@example.com',
      password: validPassword,
      role: 'superuser',
    })

    expect(result.success).toBe(false)
  })
})

describe('userUpdateSchema', () => {
  test('accepts a role change alone', () => {
    expect(userUpdateSchema.safeParse({ role: 'manager' }).success).toBe(true)
  })

  test('accepts an active-flag change alone', () => {
    expect(userUpdateSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  test('accepts both fields together', () => {
    expect(userUpdateSchema.safeParse({ role: 'admin', is_active: true }).success).toBe(true)
  })

  test('rejects an empty payload', () => {
    const result = userUpdateSchema.safeParse({})

    expect(result.success).toBe(false)
    expect(firstMessage(result)).toBeTruthy()
  })

  test('rejects an unknown role', () => {
    expect(userUpdateSchema.safeParse({ role: 'root' }).success).toBe(false)
  })

  test('rejects a non-boolean is_active', () => {
    expect(userUpdateSchema.safeParse({ is_active: 'yes' }).success).toBe(false)
  })
})

describe('toUserAdminUpdate', () => {
  const original = { role: 'user' as const, is_active: true }

  test('sends only the changed role', () => {
    expect(toUserAdminUpdate({ role: 'manager', is_active: true }, original)).toEqual({
      role: 'manager',
    })
  })

  test('sends only the changed active flag', () => {
    expect(toUserAdminUpdate({ role: 'user', is_active: false }, original)).toEqual({
      is_active: false,
    })
  })

  test('sends both when both changed', () => {
    expect(toUserAdminUpdate({ role: 'admin', is_active: false }, original)).toEqual({
      role: 'admin',
      is_active: false,
    })
  })

  test('returns an empty payload when nothing changed', () => {
    // The API rejects an empty body, so the caller turns this into a no-op.
    expect(toUserAdminUpdate({ role: 'user', is_active: true }, original)).toEqual({})
  })

  test('ignores undefined fields', () => {
    expect(toUserAdminUpdate({}, original)).toEqual({})
  })
})