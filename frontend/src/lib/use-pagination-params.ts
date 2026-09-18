import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 20
/** The API caps `limit` at 100. */
export const MAX_PAGE_SIZE = 100

export type PaginationParams = {
  limit: number
  offset: number
}

const parsePositiveInt = (value: string | null, fallback: number): number => {
  if (value === null) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const parseNonNegativeInt = (value: string | null, fallback: number): number => {
  if (value === null) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/** Reads ?limit=&offset= from the URL, clamped to what the API accepts (1..100). */
export const usePaginationParams = (): PaginationParams & {
  setParams: (next: Partial<PaginationParams>) => void
} => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Any limit the API accepts is honoured, so a deep link such as ?limit=2 works
  // even though the selector only offers PAGE_SIZE_OPTIONS.
  const limit = Math.min(MAX_PAGE_SIZE, parsePositiveInt(searchParams.get('limit'), DEFAULT_PAGE_SIZE))
  // offset is 0-based and must stay aligned to the page size so page numbers work out.
  const requestedOffset = parseNonNegativeInt(searchParams.get('offset'), 0)
  const offset = Math.floor(requestedOffset / limit) * limit

  const setParams = useCallback(
    (next: Partial<PaginationParams>) => {
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous)
          if (next.limit !== undefined) params.set('limit', String(next.limit))
          if (next.offset !== undefined) params.set('offset', String(Math.max(0, next.offset)))
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { limit, offset, setParams }
}