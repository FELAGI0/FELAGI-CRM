import { format, formatDistanceToNow, isValid } from 'date-fns'

const parse = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return isValid(date) ? date : null
}

/** Short absolute date, e.g. "18 Sep 2026". */
export const formatDate = (value: string | null | undefined, fallback = '—'): string => {
  const date = parse(value)
  return date ? format(date, 'd MMM yyyy') : fallback
}

/** Relative date, e.g. "3 hours ago". */
export const formatRelative = (value: string | null | undefined, fallback = '—'): string => {
  const date = parse(value)
  return date ? formatDistanceToNow(date, { addSuffix: true }) : fallback
}

export const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value)