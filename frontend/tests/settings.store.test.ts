import { beforeEach, describe, expect, test } from 'vitest'

import { useSettingsStore } from '@/features/settings/settings.store'
import { DEFAULT_CURRENCY } from '@/lib/currency'

describe('useSettingsStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useSettingsStore.setState({ currency: DEFAULT_CURRENCY })
  })

  test('defaults to the rouble', () => {
    expect(useSettingsStore.getState().currency).toBe('RUB')
  })

  test('setCurrency updates the current value', () => {
    useSettingsStore.getState().setCurrency('USD')
    expect(useSettingsStore.getState().currency).toBe('USD')

    useSettingsStore.getState().setCurrency('EUR')
    expect(useSettingsStore.getState().currency).toBe('EUR')
  })

  test('switches back to the rouble', () => {
    useSettingsStore.getState().setCurrency('USD')
    useSettingsStore.getState().setCurrency('RUB')
    expect(useSettingsStore.getState().currency).toBe('RUB')
  })

  test('persists under the felagi-settings key', () => {
    useSettingsStore.getState().setCurrency('EUR')
    const raw = window.localStorage.getItem('felagi-settings')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ state: { currency: 'EUR' } })
  })
})