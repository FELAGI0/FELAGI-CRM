import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/auth.store'
import { t } from '@/lib/i18n'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

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
      <button onClick={handleLogout} className="rounded-control bg-accent px-4 py-2 text-accent-foreground">
        {t.settings.logout}
      </button>
      <p className="text-text-secondary">{t.settings.comingSoon}</p>
    </div>
  )
}