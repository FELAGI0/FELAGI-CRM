import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, parseNonNegativeInt, parsePositiveInt } from '@/lib/use-pagination-params'
import type { DealStatus } from '@/types/api'

const DEAL_STATUSES: readonly DealStatus[] = ['new', 'in_progress', 'won', 'lost']

/** Narrows an arbitrary query value to a known deal status; anything else is "all". */
export const parseDealStatus = (value: string | null): DealStatus | null => {
  if (value === null) return null
  return DEAL_STATUSES.find((status) => status === value) ?? null
}

export type DealsParams = {
  limit: number
  offset: number
  status: DealStatus | null
  clientId: string | null
}

/**
 * Reads `?status=&client_id=&limit=&offset=` from the URL so every list state is
 * deep-linkable. Unknown values degrade to "no filter" rather than being sent
 * to the API, where an unrecognised status would simply match nothing.
 */
export const useDealsParams = (): DealsParams & {
  setParams: (next: Partial<DealsParams>) => void
} => {
  const [searchParams, setSearchParams] = useSearchParams()

  const limit = Math.min(MAX_PAGE_SIZE, parsePositiveInt(searchParams.get('limit'), DEFAULT_PAGE_SIZE))
  const requestedOffset = parseNonNegativeInt(searchParams.get('offset'), 0)
  const offset = Math.floor(requestedOffset / limit) * limit
  const status = parseDealStatus(searchParams.get('status'))
  const clientId = searchParams.get('client_id')

  const setParams = useCallback(
    (next: Partial<DealsParams>) => {
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous)

          if (next.limit !== undefined) params.set('limit', String(next.limit))
          if (next.status !== undefined) {
            if (next.status === null) params.delete('status')
            else params.set('status', next.status)
          }
          if (next.clientId !== undefined) {
            if (next.clientId === null) params.delete('client_id')
            else params.set('client_id', next.clientId)
          }
          if (next.offset !== undefined) params.set('offset', String(Math.max(0, next.offset)))

          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { limit, offset, status, clientId, setParams }
}