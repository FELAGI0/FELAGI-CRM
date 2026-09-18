import { useNavigate } from 'react-router-dom'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/features/auth/auth.store'
import { useSettingsStore } from '@/features/settings/settings.store'
import { CURRENCIES, type Currency } from '@/lib/currency'
import { t } from '@/lib/i18n'

const currencyLabels: Record<Currency, string> = {
  RUB: t.settings.currencyRUB,
  USD: t.settings.currencyUSD,
  EUR: t.settings.currencyEUR,
}

export const SettingsPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const currency = useSettingsStore((state) => state.currency)
  const setCurrency = useSettingsStore((state) => state.setCurrency)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.settings.title}</h1>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-semibold">{t.settings.profile}</h2>
        <p className="mt-2 text-text-secondary">{user?.email ?? t.settings.notSignedIn}</p>
      </section>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-semibold">{t.settings.currency}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:max-w-xs">
          <Select
            value={currency}
            onValueChange={(value) => {
              if (typeof value === 'string') setCurrency(value as Currency)
            }}
          >
            <SelectTrigger id="settings-currency" className="w-full" aria-label={t.settings.selectCurrency}>
              <SelectValue>
                {(value: unknown) => (typeof value === 'string' ? currencyLabels[value as Currency] : null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {currencyLabels[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-text-secondary">{t.settings.currencyHint}</p>
        </div>
      </section>

      <button
        onClick={handleLogout}
        className="rounded-control bg-accent px-4 py-2 text-accent-foreground"
      >
        {t.settings.logout}
      </button>
      <p className="text-text-secondary">{t.settings.comingSoon}</p>
    </div>
  )
}