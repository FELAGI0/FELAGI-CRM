import { useAuthStore } from '@/features/auth/auth.store'

export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-semibold">Profile</h2>
        <p className="mt-2 text-text-secondary">{user?.email ?? 'Not signed in'}</p>
      </section>
      <button onClick={clearSession} className="rounded-control bg-accent px-4 py-2 text-white">Logout</button>
      <p className="text-text-secondary">Coming soon</p>
    </div>
  )
}
