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