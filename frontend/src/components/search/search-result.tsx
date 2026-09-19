import { Briefcase, CheckSquare, Users } from 'lucide-react'

import type { SearchResult } from '@/features/search/search-results'
import { cn } from '@/lib/utils'

const ICONS = {
  client: Users,
  deal: Briefcase,
  task: CheckSquare,
} as const

export type SearchResultItemProps = {
  result: SearchResult
  active: boolean
  onSelect: (result: SearchResult) => void
  onHover: () => void
}

/**
 * A single palette row. `onMouseMove` rather than `onMouseEnter` keeps the
 * highlight in sync when the list itself scrolls under a stationary pointer.
 *
 * The button itself carries `role="option"`/`aria-selected` rather than a
 * wrapping `<li>`, so assistive tech reads the selection state from the element
 * that actually receives focus.
 */
export const SearchResultItem = ({ result, active, onSelect, onHover }: SearchResultItemProps) => {
  const Icon = ICONS[result.kind]

  return (
    <button
      type="button"
      role="option"
      id={`search-option-${result.id}`}
      aria-selected={active}
      data-search-result={result.kind}
      onMouseMove={onHover}
      onClick={() => onSelect(result)}
      className={cn(
        'flex w-full items-center gap-3 rounded-control px-3 py-2 text-left transition-colors',
        active ? 'bg-accent-subtle text-text-primary' : 'text-text-primary hover:bg-surface-hover',
      )}
    >
      <Icon className="size-4 shrink-0 text-text-secondary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{result.title}</span>
        {result.subtitle && (
          <span className="block truncate text-xs text-text-secondary">{result.subtitle}</span>
        )}
      </span>
    </button>
  )
}