import { Bell, Moon, Search, Sun, UserRound } from 'lucide-react'
import { useState } from 'react'

import { setTheme, type Theme } from '@/lib/theme'

export const Header = () => {
  const [theme, setCurrentTheme] = useState<Theme>(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    setCurrentTheme(nextTheme)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur">
      <button className="flex items-center gap-2 rounded-control border border-border px-3 py-2 text-sm text-text-secondary" aria-label="Open search">
        <Search size={16} />
        Search <kbd className="hidden text-xs sm:inline">Ctrl K</kbd>
      </button>
      <div className="flex items-center gap-2">
        <button onClick={handleThemeToggle} className="rounded-full p-2 hover:bg-surface-hover" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="relative">
          <button onClick={() => setNotificationsOpen((open) => !open)} className="rounded-full p-2 hover:bg-surface-hover" aria-label="Notifications">
            <Bell size={18} />
          </button>
          {notificationsOpen && <div className="absolute right-0 z-10 mt-2 w-56 rounded-card border border-border bg-surface p-4 text-sm shadow-lg">You're all caught up</div>}
        </div>
        <button className="rounded-full p-2 hover:bg-surface-hover" aria-label="User menu"><UserRound size={18} /></button>
      </div>
    </header>
  )
}
