import { Columns3, List } from 'lucide-react'

import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { TaskView } from '@/lib/use-tasks-params'

const VIEWS: ReadonlyArray<{ value: TaskView; label: string; icon: typeof List }> = [
  { value: 'kanban', label: t.tasks.view.kanban, icon: Columns3 },
  { value: 'list', label: t.tasks.view.list, icon: List },
]

export const TaskViewToggle = ({
  view,
  onChange,
}: {
  view: TaskView
  onChange: (view: TaskView) => void
}) => (
  <div
    role="group"
    aria-label={t.tasks.view.label}
    className="inline-flex items-center gap-1 rounded-control border border-border bg-surface p-1"
  >
    {VIEWS.map(({ value, label, icon: Icon }) => {
      const isActive = view === value
      return (
        <button
          key={value}
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-sm transition-colors',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      )
    })}
  </div>
)