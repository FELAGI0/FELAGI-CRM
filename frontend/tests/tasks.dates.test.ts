import { describe, expect, test } from 'vitest'

import { formatDueDate, getDueState } from '@/lib/format'
import { t } from '@/lib/i18n'

/** A fixed "now" so the tests never depend on the wall clock. */
const NOW = new Date(2026, 8, 18, 15, 30, 0)

const localIso = (year: number, month: number, day: number): string =>
  new Date(year, month - 1, day, 12, 0, 0).toISOString()

const PAST = localIso(2026, 9, 10)
const TODAY = localIso(2026, 9, 18)
const TOMORROW = localIso(2026, 9, 19)
const LATER = localIso(2026, 9, 25)

describe('getDueState', () => {
  test('reports an open task past its deadline as overdue', () => {
    expect(getDueState(PAST, false, NOW)).toBe('overdue')
  })

  test('reports today and tomorrow', () => {
    expect(getDueState(TODAY, false, NOW)).toBe('today')
    expect(getDueState(TOMORROW, false, NOW)).toBe('tomorrow')
  })

  test('reports anything further out as later', () => {
    expect(getDueState(LATER, false, NOW)).toBe('later')
  })

  test('a completed task is never overdue', () => {
    expect(getDueState(PAST, true, NOW)).toBe('later')
  })

  test('handles a missing or invalid deadline', () => {
    expect(getDueState(null, false, NOW)).toBe('none')
    expect(getDueState(undefined, false, NOW)).toBe('none')
    expect(getDueState('', false, NOW)).toBe('none')
    expect(getDueState('not-a-date', false, NOW)).toBe('none')
  })

  test('treats a deadline later today as due today, not overdue', () => {
    // 23:00 local on the same calendar day.
    const laterToday = new Date(2026, 8, 18, 23, 0, 0).toISOString()
    expect(getDueState(laterToday, false, NOW)).toBe('today')
  })

  test('treats an earlier time today as due today, not overdue', () => {
    const earlierToday = new Date(2026, 8, 18, 8, 0, 0).toISOString()
    expect(getDueState(earlierToday, false, NOW)).toBe('today')
  })

  test('yesterday is overdue', () => {
    expect(getDueState(localIso(2026, 9, 17), false, NOW)).toBe('overdue')
  })
})

describe('formatDueDate', () => {
  test('labels today and tomorrow in words', () => {
    expect(formatDueDate(TODAY, false, NOW)).toBe(t.tasks.dueToday)
    expect(formatDueDate(TOMORROW, false, NOW)).toBe(t.tasks.dueTomorrow)
  })

  test('renders other deadlines as a date', () => {
    expect(formatDueDate(LATER, false, NOW)).toBe('25.09.2026')
    expect(formatDueDate(PAST, false, NOW)).toBe('10.09.2026')
  })

  test('falls back when there is no deadline', () => {
    expect(formatDueDate(null, false, NOW)).toBe('—')
  })
})