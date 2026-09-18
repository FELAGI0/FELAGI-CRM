import { BriefcaseBusiness, CheckSquare, LayoutDashboard, Settings, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/deals', label: 'Deals', icon: BriefcaseBusiness },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const Sidebar = () => (
  <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface p-4">
    <div className="mb-8 text-lg font-semibold">FELAGI CRM</div>
    <nav className="space-y-1" aria-label="Main navigation">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `flex items-center gap-3 rounded-control px-3 py-2 text-sm ${isActive ? 'bg-accent text-white' : 'text-text-secondary hover:bg-surface-hover'}`}
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  </aside>
)
