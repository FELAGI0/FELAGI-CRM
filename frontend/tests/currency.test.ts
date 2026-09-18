import { describe, expect, test } from 'vitest'

import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencySymbols,
  formatAmountWithCurrency,
  parseCurrency,
} from '@/lib/currency'

describe('currency symbols', () => {
  test('maps each supported currency to its symbol', () => {
    expect(currencySymbols.RUB).toBe('₽')
    expect(currencySymbols.USD).toBe('$')
    expect(currencySymbols.EUR).toBe('€')
  })

  test('offers exactly the three supported currencies', () => {
    expect(CURRENCIES).toEqual(['RUB', 'USD', 'EUR'])
  })

  test('defaults to the rouble', () => {
    expect(DEFAULT_CURRENCY).toBe('RUB')
  })
})

describe('formatAmountWithCurrency', () => {
  test('appends the rouble symbol', () => {
    expect(formatAmountWithCurrency('1234.56', 'RUB')).toBe('1 234.56 ₽')
  })

  test('appends the dollar symbol', () => {
    expect(formatAmountWithCurrency('1234.56', 'USD')).toBe('1 234.56 $')
  })

  test('appends the euro symbol', () => {
    expect(formatAmountWithCurrency('1234.56', 'EUR')).toBe('1 234.56 €')
  })

  test('groups thousands with a space for every currency', () => {
    expect(formatAmountWithCurrency('1234567.89', 'RUB')).toBe('1 234 567.89 ₽')
    expect(formatAmountWithCurrency('1234567.89', 'USD')).toBe('1 234 567.89 $')
    expect(formatAmountWithCurrency('1234567.89', 'EUR')).toBe('1 234 567.89 €')
  })

  test('pads a missing fraction to two decimals', () => {
    expect(formatAmountWithCurrency('100', 'RUB')).toBe('100.00 ₽')
    expect(formatAmountWithCurrency('1234.5', 'USD')).toBe('1 234.50 $')
    expect(formatAmountWithCurrency('0', 'EUR')).toBe('0.00 €')
  })

  test('falls back when there is no amount', () => {
    expect(formatAmountWithCurrency(null, 'RUB')).toBe('—')
    expect(formatAmountWithCurrency(undefined, 'USD')).toBe('—')
    expect(formatAmountWithCurrency('', 'EUR')).toBe('—')
    expect(formatAmountWithCurrency('   ', 'RUB')).toBe('—')
  })

  test('honours a custom fallback', () => {
    expect(formatAmountWithCurrency(null, 'RUB', 'н/д')).toBe('н/д')
  })

  test('keeps the symbol separated by a plain space', () => {
    // A non-breaking space would break copy/paste and the assertion below.
    const formatted = formatAmountWithCurrency('100', 'RUB')
    expect(formatted).toBe('100.00 ₽')
    expect(formatted).not.toContain('\u00a0')
  })

  test('never loses precision on a large decimal', () => {
    expect(formatAmountWithCurrency('999999999999.99', 'RUB')).toBe('999 999 999 999.99 ₽')
  })

  test('switching currency changes only the symbol', () => {
    const amount = '16937.50'
    const rub = formatAmountWithCurrency(amount, 'RUB')
    const usd = formatAmountWithCurrency(amount, 'USD')
    const eur = formatAmountWithCurrency(amount, 'EUR')
    expect(rub.replace('₽', '')).toBe(usd.replace('$', ''))
    expect(rub.replace('₽', '')).toBe(eur.replace('€', ''))
  })
})

describe('parseCurrency', () => {
  test('accepts every supported code', () => {
    expect(parseCurrency('RUB')).toBe('RUB')
    expect(parseCurrency('USD')).toBe('USD')
    expect(parseCurrency('EUR')).toBe('EUR')
  })

  test('falls back to the default for anything unrecognised', () => {
    expect(parseCurrency('GBP')).toBe('RUB')
    expect(parseCurrency('')).toBe('RUB')
    expect(parseCurrency(null)).toBe('RUB')
    expect(parseCurrency(undefined)).toBe('RUB')
    expect(parseCurrency(42)).toBe('RUB')
  })
})