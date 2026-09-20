import { describe, expect, test } from 'vitest'

import {
  passwordSchema,
  profileSchema,
  toUserUpdateMe,
  userToProfileForm,
} from '@/features/profile/profile.schemas'
import { makeUser } from './factories'

const validPassword = 'BrandNewPassword456'

describe('profileSchema', () => {
  test('accepts a name on its own', () => {
    expect(profileSchema.safeParse({ name: 'Иван' }).success).toBe(true)
  })

  test('accepts an email on its own', () => {
    expect(profileSchema.safeParse({ email: 'new@example.com' }).success).toBe(true)
  })

  test('accepts both fields together', () => {
    expect(profileSchema.safeParse({ name: 'Иван', email: 'new@example.com' }).success).toBe(true)
  })

  test('rejects an empty payload', () => {
    const result = profileSchema.safeParse({ name: '', email: '' })

    expect(result.success).toBe(false)
  })

  test('rejects undefined for both fields', () => {
    expect(profileSchema.safeParse({}).success).toBe(false)
  })

  test('rejects a malformed email', () => {
    expect(profileSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })

  test('accepts an empty email when a name is present', () => {
    // Clearing the email is not offered by the UI, so an empty value is only
    // tolerated because the name carries the payload.
    expect(profileSchema.safeParse({ name: 'Иван', email: '' }).success).toBe(true)
  })

  test('rejects a name longer than 255 characters', () => {
    expect(profileSchema.safeParse({ name: 'a'.repeat(256) }).success).toBe(false)
  })

  test('accepts a name of exactly 255 characters', () => {
    expect(profileSchema.safeParse({ name: 'a'.repeat(255) }).success).toBe(true)
  })
})

describe('passwordSchema', () => {
  const base = {
    current_password: 'StrongPassword123',
    new_password: validPassword,
    confirm_password: validPassword,
  }

  test('accepts a matching, policy-compliant pair', () => {
    expect(passwordSchema.safeParse(base).success).toBe(true)
  })

  test('rejects mismatched confirmation', () => {
    const result = passwordSchema.safeParse({ ...base, confirm_password: 'DifferentPassword456' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Пароли не совпадают')
  })

  test('rejects an empty current password', () => {
    expect(passwordSchema.safeParse({ ...base, current_password: '' }).success).toBe(false)
  })

  test('rejects a new password shorter than 12 characters', () => {
    expect(passwordSchema.safeParse({ ...base, new_password: 'Sh0rt', confirm_password: 'Sh0rt' }).success).toBe(false)
  })

  test('accepts a new password of exactly 128 characters', () => {
    const long = `${'a'.repeat(126)}A1`
    expect(passwordSchema.safeParse({ ...base, new_password: long, confirm_password: long }).success).toBe(true)
  })

  test('rejects a new password longer than 128 characters', () => {
    const tooLong = `${'a'.repeat(127)}A1`
    expect(
      passwordSchema.safeParse({ ...base, new_password: tooLong, confirm_password: tooLong }).success,
    ).toBe(false)
  })

  test('requires a lowercase letter in the new password', () => {
    const bad = 'ALLUPPERCASE123'
    expect(passwordSchema.safeParse({ ...base, new_password: bad, confirm_password: bad }).success).toBe(false)
  })

  test('requires an uppercase letter in the new password', () => {
    const bad = 'alllowercase123'
    expect(passwordSchema.safeParse({ ...base, new_password: bad, confirm_password: bad }).success).toBe(false)
  })

  test('requires a digit in the new password', () => {
    const bad = 'NoDigitsInThisPassword'
    expect(passwordSchema.safeParse({ ...base, new_password: bad, confirm_password: bad }).success).toBe(false)
  })

  test('does not apply the policy to a wrong-but-short current password', () => {
    // The current password is only checked for presence: its policy is the
    // API's business, and reporting "too short" would leak nothing useful.
    const result = passwordSchema.safeParse({ ...base, current_password: 'x' })

    expect(result.success).toBe(true)
  })
})

describe('userToProfileForm', () => {
  test('maps a user with a name', () => {
    const user = makeUser({ name: 'Иван Петров', email: 'ivan@example.com' })

    expect(userToProfileForm(user)).toEqual({ name: 'Иван Петров', email: 'ivan@example.com' })
  })

  test('maps a user without a name to an empty string', () => {
    const user = makeUser({ name: null, email: 'noname@example.com' })

    expect(userToProfileForm(user)).toEqual({ name: '', email: 'noname@example.com' })
  })

  test('handles a null user', () => {
    expect(userToProfileForm(null)).toEqual({ name: '', email: '' })
  })
})

describe('toUserUpdateMe', () => {
  const user = makeUser({ name: 'Старое имя', email: 'old@example.com' })

  test('sends only the changed name', () => {
    expect(toUserUpdateMe({ name: 'Новое имя', email: 'old@example.com' }, user)).toEqual({
      name: 'Новое имя',
    })
  })

  test('sends only the changed email', () => {
    expect(toUserUpdateMe({ name: 'Старое имя', email: 'new@example.com' }, user)).toEqual({
      email: 'new@example.com',
    })
  })

  test('sends both when both changed', () => {
    expect(toUserUpdateMe({ name: 'Новое имя', email: 'new@example.com' }, user)).toEqual({
      name: 'Новое имя',
      email: 'new@example.com',
    })
  })

  test('returns an empty payload when nothing changed', () => {
    // The caller turns this into a no-op, because the API rejects an empty body.
    expect(toUserUpdateMe({ name: 'Старое имя', email: 'old@example.com' }, user)).toEqual({})
  })

  test('trims the name and lowercases the email', () => {
    expect(toUserUpdateMe({ name: '  Новое имя  ', email: '  NEW@Example.COM ' }, user)).toEqual({
      name: 'Новое имя',
      email: 'new@example.com',
    })
  })

  test('treats a first-time name on a nameless user as a change', () => {
    const nameless = makeUser({ name: null, email: 'x@example.com' })

    expect(toUserUpdateMe({ name: 'Первое имя', email: 'x@example.com' }, nameless)).toEqual({
      name: 'Первое имя',
    })
  })

  test('ignores an empty name so the payload stays valid', () => {
    expect(toUserUpdateMe({ name: '', email: 'new@example.com' }, user)).toEqual({
      email: 'new@example.com',
    })
  })
})