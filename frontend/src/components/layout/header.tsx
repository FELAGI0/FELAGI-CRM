import { Bell, Menu, Moon, Search, Sun, UserRound } from 'lucide-react'
import { useState } from 'react'

import { setTheme, type Theme } from '@/lib/theme'
import { t } from '@/lib/i18n'

export type HeaderProps = {
  /** Opens the mobile navigation drawer; the button is hidden from md upwards. */
  onOpenNav?: () => void
  /** Whether the mobile drawer is currently open, for aria-expanded. */
  navOpen?: boolean
}

export const Header = ({ onOpenNav, navOpen = false }: HeaderProps) => {
  const [theme, setCurrentTheme] = useState<Theme>(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    setCurrentTheme(nextTheme)
  }

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenNav}
          className="rounded-control p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary md:hidden"
          aria-label={t.header.openNavigation}
          aria-controls="mobile-nav"
          aria-expanded={navOpen}
        >
          <Menu size={20} />
        </button>
        <button className="flex items-center gap-2 rounded-control border border-border px-3 py-2 text-sm text-text-secondary" aria-label={t.header.openSearch}>
          <Search size={16} />
          <span className="hidden sm:inline">{t.common.search}</span> <kbd className="hidden text-xs sm:inline">Ctrl K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleThemeToggle} className="rounded-full p-2 hover:bg-surface-hover" aria-label={t.header.toggleTheme}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="relative">
          <button onClick={() => setNotificationsOpen((open) => !open)} className="rounded-full p-2 hover:bg-surface-hover" aria-label={t.notifications.label}>
            <Bell size={18} />
          </button>
          {notificationsOpen && <div className="absolute right-0 z-10 mt-2 w-56 rounded-card border border-border bg-surface p-4 text-sm shadow-lg">{t.notifications.empty}</div>}
        </div>
        <button className="rounded-full p-2 hover:bg-surface-hover" aria-label={t.header.userMenu}><UserRound size={18} /></button>
      </div>
    </header>
  )
}
