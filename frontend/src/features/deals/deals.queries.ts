import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Deal, DealCreate, DealUpdate, Page } from '@/types/api'

import { createDeal, deleteDeal, getDeal, listDeals, updateDeal, type DealListParams } from './deals.api'

export const dealsKeys = {
  all: ['deals'] as const,
  list: (params: DealListParams) => ['deals', 'list', params] as const,
  detail: (id: string) => ['deals', 'detail', id] as const,
}

export const useDeals = (params: DealListParams) =>
  useQuery<Page<Deal>>({
    queryKey: dealsKeys.list(params),
    queryFn: () => listDeals(params),
    placeholderData: (previous) => previous,
  })

export const useDeal = (id: string) =>
  useQuery<Deal>({
    queryKey: dealsKeys.detail(id),
    queryFn: () => getDeal(id),
    enabled: id.length > 0,
  })

export const useCreateDeal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DealCreate) => createDeal(payload),
    onSuccess: () => {
      // Every cached list, regardless of its filters, may now be stale.
      void queryClient.invalidateQueries({ queryKey: dealsKeys.all })
    },
  })
}

export const useUpdateDeal = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DealUpdate) => updateDeal(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealsKeys.all })
      void queryClient.invalidateQueries({ queryKey: dealsKeys.detail(id) })
    },
  })
}

export const useDeleteDeal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDeal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealsKeys.all })
    },
  })
}