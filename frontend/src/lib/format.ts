import { format, formatDistanceToNow, isValid } from 'date-fns'
import { ru } from 'date-fns/locale/ru'

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