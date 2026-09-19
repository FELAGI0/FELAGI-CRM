import { format, formatDistanceToNow, isBefore, isSameDay, isValid, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale/ru'

import { t } from './i18n'

const parse = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return isValid(date) ? date : null
}

/** Short absolute date, e.g. "18.09.2026". */
export const formatDate = (value: string | null | undefined, fallback = '—'): string => {
  const date = parse(value)
  return date ? format(date, 'dd.MM.yyyy', { locale: ru }) : fallback
}

/** Relative date, e.g. "2 часа назад". */
export const formatRelative = (value: string | null | undefined, fallback = '—'): string => {
  const date = parse(value)
  return date ? formatDistanceToNow(date, { addSuffix: true, locale: ru }) : fallback
}

/** Short month + year for chart axes, e.g. "сен 26". */
export const formatMonthShort = (date: Date): string => format(date, 'LLL yy', { locale: ru })

export const formatNumber = (value: number): string => new Intl.NumberFormat('ru-RU').format(value)

/** Deadlines are dates, not instants: compare whole days in the local zone. */
export type DueState = 'overdue' | 'today' | 'tomorrow' | 'later' | 'none'

export const getDueState = (
  dueDate: string | null | undefined,
  isDone: boolean,
  now = new Date(),
): DueState => {
  const date = parse(dueDate)
  if (!date) return 'none'
  // A completed task is never late, however old its deadline is.
  if (isDone) return 'later'

  const today = startOfDay(now)
  const due = startOfDay(date)
  if (isBefore(due, today)) return 'overdue'
  if (isSameDay(due, today)) return 'today'
  if (isSameDay(due, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))) return 'tomorrow'
  return 'later'
}

/** Localised short label for a deadline, e.g. "Сегодня" or "20.09.2026". */
export const formatDueDate = (
  dueDate: string | null | undefined,
  isDone: boolean,
  now = new Date(),
): string => {
  const date = parse(dueDate)
  if (!date) return '—'
  switch (getDueState(dueDate, isDone, now)) {
    case 'today':
      return t.tasks.dueToday
    case 'tomorrow':
      return t.tasks.dueTomorrow
    default:
      return formatDate(dueDate)
  }
}

/** Converts a datetime to the value an `<input type="date">` expects ("yyyy-MM-dd"). */
export const toDateInputValue = (value: string | null | undefined): string => {
  const date = parse(value)
  return date ? format(date, 'yyyy-MM-dd') : ''
}

/**
 * Turns a date-input value into the timezone-aware ISO datetime the API requires.
 * The input has no time, so it is anchored at local noon: that stays on the same
 * calendar day for any offset within ±12h, which midnight would not.
 */
export const fromDateInputValue = (value: string): string | null => {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const [year, month, day] = trimmed.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString()
}

/**
 * Money amount without a currency symbol, normalised to two decimals and a
 * space thousands separator, e.g. "1234.5" -> "1 234.50".
 *
 * The API sends Decimal as a string; it is parsed here only for display and
 * never converted back to a number, so no precision is lost on the way out.
 * Returned unchanged when it is not a valid number.
 */
export const formatAmount = (value: string | null | undefined, fallback = '—'): string => {
  if (value === null || value === undefined || value.trim() === '') return fallback
  const trimmed = value.trim()
  // Manual grouping rather than Intl so the separator is a plain space (Intl
  // uses a non-breaking space for ru-RU, which breaks copy/paste and tests).
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(trimmed)
  if (!match) return trimmed
  const sign = match[1] ?? ''
  const intPart = match[2] ?? ''
  const fracPart = match[3] ?? ''
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${sign}${grouped}.${fracPart.padEnd(2, '0').slice(0, 2)}`
}