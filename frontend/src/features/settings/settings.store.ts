import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_CURRENCY, parseCurrency, type Currency } from '@/lib/currency'

type SettingsState = {
  currency: Currency
  setCurrency: (currency: Currency) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: DEFAULT_CURRENCY,
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'felagi-settings',
      // Guard against a stale or hand-edited localStorage value.
      merge: (persisted, current) => {
        const incoming = (persisted as { currency?: unknown } | undefined)?.currency
        return { ...current, currency: parseCurrency(incoming) }
      },
    },
  ),
)