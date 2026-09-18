import { describe, expect, test } from 'vitest'

import { loginSchema, registerSchema } from '@/features/auth/auth.schemas'

describe('loginSchema', () => {
  test('accepts a valid email and any non-empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'x' })
    expect(result.success).toBe(true)
  })

  test('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['email'])
  })

  test('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['password'])
  })
})

describe('registerSchema', () => {
  const validPassword = 'StrongPassw0rd'

  test('accepts a compliant email/password pair', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: validPassword })
    expect(result.success).toBe(true)
  })

  test('rejects a password shorter than 12 characters', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'Short1Aa' })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path[0])).toContain('password')
  })

  test('rejects a password longer than 128 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: `${'a'.repeat(120)}A1${'b'.repeat(20)}`,
    })
    expect(result.success).toBe(false)
  })

  test('rejects a password without a lowercase letter', () => {
    expect(registerSchema.safeParse({ email: 'user@example.com', password: 'STRONGPASSW0RD' }).success).toBe(false)
  })

  test('rejects a password without an uppercase letter', () => {
    expect(registerSchema.safeParse({ email: 'user@example.com', password: 'strongpassw0rd' }).success).toBe(false)
  })

  test('rejects a password without a digit', () => {
    expect(registerSchema.safeParse({ email: 'user@example.com', password: 'StrongPassword' }).success).toBe(false)
  })

  test('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ email: 'bad@', password: validPassword })
    expect(result.success).toBe(false)
  })
})