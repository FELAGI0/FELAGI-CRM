import { BriefcaseBusiness, CheckSquare, LayoutDashboard, Settings, Users, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/deals', label: 'Deals', icon: BriefcaseBusiness },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const Brand = () => <div className="mb-8 text-lg font-semibold text-text-primary">FELAGI CRM</div>

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav className="space-y-1" aria-label="Main navigation">
    {links.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-control px-3 py-2 text-sm',
            isActive
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
          )
        }
      >
        <Icon size={18} />
        {label}
      </NavLink>
    ))}
  </nav>
)

/** Static sidebar, shown from md (768px) upwards. */
export const Sidebar = () => (
  <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
    <Brand />
    <NavLinks />
  </aside>
)

export type SidebarDrawerProps = {
  open: boolean
  onClose: () => void
}

/**
 * Off-canvas drawer for viewports below md. Rendered only while open so the
 * slide-in animation replays, and marked up as a modal dialog.
 */
export const SidebarDrawer = ({ open, onClose }: SidebarDrawerProps) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      // Keep focus inside the modal: wrap at both ends of the focusable set.
      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Lock body scroll while the drawer covers the page.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <motion.div
        data-slot="sidebar-backdrop"
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        ref={panelRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-60 max-w-[85vw] flex-col border-r border-border bg-surface p-4 outline-none"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-start justify-between">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-control p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>
        <NavLinks onNavigate={onClose} />
      </motion.div>
    </div>
  )
}