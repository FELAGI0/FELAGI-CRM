import { apiClient } from '@/lib/api-client'
import type { Deal, DealCreate, DealStatus, DealUpdate, Page } from '@/types/api'

export type DealListParams = {
  limit?: number
  offset?: number
  status?: DealStatus
  client_id?: string
}

/**
 * Drops empty values so the query string only ever carries real filters. This
 * matters because the backend treats a present-but-empty `status=` as a filter
 * that matches nothing, rather than as "no filter".
 */
const toQueryParams = (params: DealListParams): Record<string, string | number> => {
  const query: Record<string, string | number> = {}
  if (params.limit !== undefined) query.limit = params.limit
  if (params.offset !== undefined) query.offset = params.offset
  if (params.status) query.status = params.status
  if (params.client_id) query.client_id = params.client_id
  return query
}

/**
 * Collection routes are registered with a trailing slash on the backend, so
 * "/deals/" is required — the bare path 307-redirects and the redirect drops
 * the Authorization header.
 */
export const listDeals = async (params: DealListParams = {}): Promise<Page<Deal>> => {
  const response = await apiClient.get<Page<Deal>>('/deals/', { params: toQueryParams(params) })
  return response.data
}

export const getDeal = async (id: string): Promise<Deal> => {
  const response = await apiClient.get<Deal>(`/deals/${id}`)
  return response.data
}

export const createDeal = async (payload: DealCreate): Promise<Deal> => {
  const response = await apiClient.post<Deal>('/deals/', payload)
  return response.data
}

export const updateDeal = async (id: string, payload: DealUpdate): Promise<Deal> => {
  const response = await apiClient.patch<Deal>(`/deals/${id}`, payload)
  return response.data
}

export const deleteDeal = async (id: string): Promise<void> => {
  await apiClient.delete(`/deals/${id}`)
}