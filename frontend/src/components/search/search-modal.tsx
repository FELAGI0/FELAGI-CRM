import { Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SearchResultItem } from '@/components/search/search-result'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useSearchStore } from '@/features/search/search.store'
import { useSearchClients, useSearchDeals, useSearchTasks, GROUP_LIMIT, MIN_QUERY_LENGTH } from '@/features/search/search.queries'
import {
  toClientResult,
  toDealResult,
  toTaskResult,
  type SearchGroupKind,
  type SearchResult,
} from '@/features/search/search-results'
import { useSettingsStore } from '@/features/settings/settings.store'

type Group = {
  kind: SearchGroupKind
  label: string
  results: SearchResult[]
}

export const SearchModal = () => {
  const isOpen = useSearchStore((state) => state.isOpen)
  const close = useSearchStore((state) => state.close)
  const currency = useSettingsStore((state) => state.currency)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const clientsQuery = useSearchClients(query)
  const dealsQuery = useSearchDeals(query)
  const tasksQuery = useSearchTasks(query)

  // Reset on open so the palette never shows the previous search.
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [isOpen])

  const trimmed = query.trim()
  const isQueryTooShort = trimmed.length < MIN_QUERY_LENGTH

  const groups = useMemo<Group[]>(() => {
    if (isQueryTooShort) return []
    const built: Group[] = [
      {
        kind: 'clients',
        label: t.search.groups.clients,
        results: (clientsQuery.data ?? []).slice(0, GROUP_LIMIT).map(toClientResult),
      },
      {
        kind: 'deals',
        label: t.search.groups.deals,
        results: (dealsQuery.data ?? []).slice(0, GROUP_LIMIT).map((deal) => toDealResult(deal, currency)),
      },
      {
        kind: 'tasks',
        label: t.search.groups.tasks,
        results: (tasksQuery.data ?? []).slice(0, GROUP_LIMIT).map(toTaskResult),
      },
    ]
    return built.filter((group) => group.results.length > 0)
  }, [isQueryTooShort, clientsQuery.data, dealsQuery.data, tasksQuery.data, currency])

  // Flat list backing arrow-key navigation across group boundaries.
  const flatResults = useMemo(() => groups.flatMap((group) => group.results), [groups])

  const isLoading = clientsQuery.isFetching || dealsQuery.isFetching || tasksQuery.isFetching
  const isError = clientsQuery.isError || dealsQuery.isError || tasksQuery.isError

  // Keep the highlight in range when the result set shrinks.
  useEffect(() => {
    setActiveIndex((current) => (current < flatResults.length ? current : 0))
  }, [flatResults.length])

  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const active = listRef.current?.querySelector('[aria-selected="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleSelect = (result: SearchResult) => {
    close()
    navigate(result.href)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (flatResults.length === 0) return
      setActiveIndex((current) => (current + 1) % flatResults.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (flatResults.length === 0) return
      setActiveIndex((current) => (current - 1 + flatResults.length) % flatResults.length)
      return
    }
    if (event.key === 'Enter') {
      const result = flatResults[activeIndex]
      if (!result) return
      event.preventDefault()
      handleSelect(result)
    }
  }

  let index = -1

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      {/* The base DialogContent sets `sm:max-w-sm`, which outranks a plain
          `max-w-2xl` because variant utilities are more specific than
          unprefixed ones — so the width must be overridden at the same
          breakpoint to actually apply. */}
      <DialogContent className="top-[15%] translate-y-0 gap-0 p-0 sm:max-w-2xl" showCloseButton={false}>
        <DialogTitle className="sr-only">{t.search.title}</DialogTitle>
        <DialogDescription className="sr-only">{t.search.placeholder}</DialogDescription>

        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-text-secondary" aria-hidden />
          <input
            id="search-input"
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={t.search.placeholder}
            aria-label={t.search.title}
            role="combobox"
            aria-expanded={flatResults.length > 0}
            aria-controls="search-results"
            aria-activedescendant={flatResults[activeIndex] ? `search-option-${flatResults[activeIndex].id}` : undefined}
            className="h-12 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
          />
          {isLoading && !isQueryTooShort && (
            <Loader2 className="size-4 shrink-0 animate-spin text-text-secondary" aria-hidden />
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {isQueryTooShort ? (
            <p data-slot="search-hint" className="px-3 py-6 text-center text-sm text-text-secondary">
              {t.search.hint}
            </p>
          ) : isError ? (
            <p
              role="alert"
              data-slot="search-error"
              className="px-3 py-6 text-center text-sm text-status-lost"
            >
              {t.search.error}
            </p>
          ) : flatResults.length === 0 ? (
            <p data-slot="search-empty" className="px-3 py-6 text-center text-sm text-text-secondary">
              {isLoading ? t.common.loading : t.search.noResults}
            </p>
          ) : (
            // role="listbox" may only contain options or groups, so each group is
            // a labelled div and the rows are the options.
            <div id="search-results" ref={listRef} role="listbox" aria-label={t.search.title}>
              {groups.map((group) => (
                <div key={group.kind} role="group" aria-label={group.label}>
                  <p className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-text-secondary uppercase">
                    {group.label}
                  </p>
                  {group.results.map((result) => {
                    index += 1
                    const itemIndex = index
                    return (
                      <SearchResultItem
                        key={result.id}
                        result={result}
                        active={itemIndex === activeIndex}
                        onSelect={handleSelect}
                        onHover={() => setActiveIndex(itemIndex)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className={cn('border-t border-border px-4 py-2 text-xs text-text-secondary')}>
          {t.search.navigateHint}
        </p>
      </DialogContent>
    </Dialog>
  )
}