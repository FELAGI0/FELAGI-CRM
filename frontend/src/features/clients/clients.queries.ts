import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Client, ClientCreate, ClientUpdate, Page } from '@/types/api'

import { createClient, deleteClient, getClient, listClients, updateClient } from './clients.api'

export const clientsKeys = {
  all: ['clients'] as const,
  list: (params: { limit: number; offset: number }) => ['clients', 'list', params] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
}

export const useClients = (params: { limit: number; offset: number }) =>
  useQuery<Page<Client>>({
    queryKey: clientsKeys.list(params),
    queryFn: () => listClients(params),
    placeholderData: (previous) => previous,
  })

export const useClient = (id: string) =>
  useQuery<Client>({
    queryKey: clientsKeys.detail(id),
    queryFn: () => getClient(id),
    enabled: id.length > 0,
  })

export const useCreateClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientCreate) => createClient(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.all })
    },
  })
}

export const useUpdateClient = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientUpdate) => updateClient(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.all })
      void queryClient.invalidateQueries({ queryKey: clientsKeys.detail(id) })
    },
  })
}

export const useDeleteClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.all })
    },
  })
}