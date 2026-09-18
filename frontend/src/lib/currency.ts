import { formatAmount } from './format'

export type Currency = 'RUB' | 'USD' | 'EUR'

export const CURRENCIES: readonly Currency[] = ['RUB', 'USD', 'EUR']

export const currencySymbols: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
}

export const DEFAULT_CURRENCY: Currency = 'RUB'

/** Narrows an arbitrary stored value to a known currency, falling back to the default. */
export const parseCurrency = (value: unknown): Currency =>
  CURRENCIES.find((currency) => currency === value) ?? DEFAULT_CURRENCY

/**
 * Amount with its currency symbol appended, e.g. "1 234.56 ₽". The number itself
 * keeps the space-grouped, dot-decimal format from `formatAmount`, so only the
 * symbol changes when the user switches currency.
 */
export const formatAmountWithCurrency = (
  amount: string | null | undefined,
  currency: Currency,
  fallback = '—',
): string => {
  const formatted = formatAmount(amount, '')
  if (formatted === '') return fallback
  return `${formatted} ${currencySymbols[currency]}`
}