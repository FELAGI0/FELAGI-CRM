import { describe, expect, test } from 'vitest'

import { loginSchema, registerSchema } from '@/features/auth/auth.schemas'
import { clientFormSchema, emptyClientForm } from '@/features/clients/clients.schemas'
import { getErrorMessage, resolveBackendMessage } from '@/lib/error-message'
import { formatAmount, formatDate, formatRelative } from '@/lib/format'
import { t } from '@/lib/i18n'
import { ApiError } from '@/lib/api-errors'

const firstMessage = (result: { success: boolean; error?: { issues: Array<{ message: string }> } }): string =>
  result.error?.issues[0]?.message ?? ''

describe('dictionary', () => {
  test('navigation labels', () => {
    expect(t.nav).toEqual({
      dashboard: 'Дашборд',
      clients: 'Клиенты',
      deals: 'Сделки',
      tasks: 'Задачи',
      users: 'Пользователи',
      settings: 'Настройки',
      mainNavigation: 'Основная навигация',
    })
  })

  test('status labels cover every deal and task status', () => {
    expect(t.status.deal).toEqual({
      new: 'Новый',
      in_progress: 'В работе',
      won: 'Выиграно',
      lost: 'Проиграно',
    })
    expect(t.status.task).toEqual({
      todo: 'К выполнению',
      in_progress: 'В работе',
      done: 'Готово',
    })
  })

  test('pluralises clients with correct endings', () => {
    expect(t.clients.total(1)).toBe('1 клиент')
    expect(t.clients.total(2)).toBe('2 клиента')
    expect(t.clients.total(4)).toBe('4 клиента')
    expect(t.clients.total(5)).toBe('5 клиентов')
    expect(t.clients.total(11)).toBe('11 клиентов')
    expect(t.clients.total(21)).toBe('21 клиент')
    expect(t.clients.total(22)).toBe('22 клиента')
    expect(t.clients.total(25)).toBe('25 клиентов')
    expect(t.clients.total(0)).toBe('0 клиентов')
  })

  test('pluralises deals with correct endings', () => {
    expect(t.deals.total(1)).toBe('1 сделка')
    expect(t.deals.total(3)).toBe('3 сделки')
    expect(t.deals.total(5)).toBe('5 сделок')
    expect(t.deals.total(11)).toBe('11 сделок')
    expect(t.deals.total(21)).toBe('21 сделка')
    expect(t.deals.total(22)).toBe('22 сделки')
    expect(t.deals.total(0)).toBe('0 сделок')
    expect(t.deals.total(18)).toBe('18 сделок')
  })

  test('pluralises the deals total label', () => {
    expect(t.deals.totalLabel(1)).toBe('1 сделка всего')
    expect(t.deals.totalLabel(2)).toBe('2 сделки всего')
    expect(t.deals.totalLabel(18)).toBe('18 сделок всего')
  })

  test('deal status labels are distinct', () => {
    expect(t.status.deal.new).toBe('Новый')
    expect(t.status.deal.in_progress).toBe('В работе')
    expect(t.status.deal.won).toBe('Выиграно')
    expect(t.status.deal.lost).toBe('Проиграно')
  })

  test('interpolates the welcome and delete confirmation strings', () => {
    expect(t.dashboard.welcome('a@b.ru')).toBe('С возвращением, a@b.ru')
    expect(t.clients.deleteConfirm.description('Ромашка')).toBe(
      'Вы уверены, что хотите удалить «Ромашка»? Это действие нельзя отменить.',
    )
  })
})

describe('backend message resolution', () => {
  test('resolves known backend details', () => {
    expect(resolveBackendMessage('Invalid credentials')).toBe('Неверный email или пароль')
    expect(resolveBackendMessage('Email already registered')).toBe('Email уже зарегистрирован')
    expect(resolveBackendMessage('Client has deals')).toBe('У клиента есть сделки')
    expect(resolveBackendMessage('Insufficient permissions')).toBe('Недостаточно прав')
    expect(resolveBackendMessage('Not authenticated')).toBe('Требуется вход')
    expect(resolveBackendMessage('Rate limit exceeded')).toBe('Слишком много запросов. Попробуйте позже')
  })

  test('passes through unknown details unchanged', () => {
    expect(resolveBackendMessage('Some new backend message')).toBe('Some new backend message')
  })

  test('getErrorMessage resolves ApiError details', () => {
    expect(getErrorMessage(new ApiError(409, 'Client has deals'))).toBe('У клиента есть сделки')
  })

  test('getErrorMessage falls back to the generic message', () => {
    expect(getErrorMessage(new ApiError(500, ''))).toBe(t.errors.generic)
    expect(getErrorMessage('not an error')).toBe(t.errors.generic)
  })

  test('getErrorMessage honours a custom fallback', () => {
    expect(getErrorMessage(new ApiError(500, ''), t.clients.loadFailed)).toBe('Не удалось загрузить клиентов')
  })
})

describe('validation messages', () => {
  test('login schema', () => {
    expect(firstMessage(loginSchema.safeParse({ email: 'bad', password: 'x' }))).toBe(t.validation.email)
    expect(firstMessage(loginSchema.safeParse({ email: 'a@b.ru', password: '' }))).toBe(t.validation.passwordRequired)
  })

  test('register schema', () => {
    const short = registerSchema.safeParse({ email: 'a@b.ru', password: 'Short1Aa' })
    expect(firstMessage(short)).toBe(t.validation.passwordMin)

    const noLower = registerSchema.safeParse({ email: 'a@b.ru', password: 'STRONGPASSW0RD' })
    expect(noLower.error?.issues.some((i) => i.message === t.validation.passwordLower)).toBe(true)

    const noUpper = registerSchema.safeParse({ email: 'a@b.ru', password: 'strongpassw0rd' })
    expect(noUpper.error?.issues.some((i) => i.message === t.validation.passwordUpper)).toBe(true)

    const noDigit = registerSchema.safeParse({ email: 'a@b.ru', password: 'StrongPassword' })
    expect(noDigit.error?.issues.some((i) => i.message === t.validation.passwordDigit)).toBe(true)
  })

  test('client form schema', () => {
    expect(firstMessage(clientFormSchema.safeParse({ ...emptyClientForm, name: '' }))).toBe(t.validation.required)
    expect(firstMessage(clientFormSchema.safeParse({ ...emptyClientForm, name: 'A', email: 'nope' }))).toBe(
      t.validation.email,
    )
    expect(
      clientFormSchema.safeParse({ ...emptyClientForm, name: 'A', phone: '1'.repeat(33) }).error?.issues[0]?.message,
    ).toBe(t.validation.maxLength(32))
  })
})

describe('date formatting', () => {
  test('formatDate uses dd.MM.yyyy', () => {
    expect(formatDate('2026-09-18T10:00:00Z')).toBe('18.09.2026')
    expect(formatDate('2026-01-05T10:00:00Z')).toBe('05.01.2026')
  })

  test('formatDate falls back for empty or invalid input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })

  test('formatRelative renders relative wording', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(formatRelative(twoHoursAgo)).toMatch(/час/)
    expect(formatRelative(null)).toBe('—')
  })
})

describe('amount formatting', () => {
  test('groups thousands with a space and keeps two decimals', () => {
    expect(formatAmount('1234.56')).toBe('1 234.56')
    expect(formatAmount('1234567.89')).toBe('1 234 567.89')
    expect(formatAmount('16937.50')).toBe('16 937.50')
  })

  test('pads a missing fraction to two places', () => {
    expect(formatAmount('100')).toBe('100.00')
    expect(formatAmount('1234.5')).toBe('1 234.50')
    expect(formatAmount('0')).toBe('0.00')
  })

  test('leaves a small amount alone', () => {
    expect(formatAmount('5.00')).toBe('5.00')
  })

  test('falls back when there is no amount', () => {
    expect(formatAmount(null)).toBe('—')
    expect(formatAmount(undefined)).toBe('—')
    expect(formatAmount('')).toBe('—')
    expect(formatAmount('   ')).toBe('—')
  })

  test('never rounds a large decimal through a float', () => {
    // Parsing this into a JS number would lose the trailing digits.
    expect(formatAmount('999999999999.99')).toBe('999 999 999 999.99')
  })

  test('returns unparseable input unchanged rather than inventing a value', () => {
    expect(formatAmount('abc')).toBe('abc')
  })
})