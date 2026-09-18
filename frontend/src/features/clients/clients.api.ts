import { apiClient } from '@/lib/api-client'
import type { Client, ClientCreate, ClientUpdate, Page } from '@/types/api'

/**
 * Collection routes are registered with a trailing slash on the backend, so
 * "/clients/" is required — the bare path 307-redirects and the redirect drops
 * the Authorization header.
 */
export const listClients = async (params: { limit?: number; offset?: number } = {}): Promise<Page<Client>> => {
  const response = await apiClient.get<Page<Client>>('/clients/', { params })
  return response.data
}

export const getClient = async (id: string): Promise<Client> => {
  const response = await apiClient.get<Client>(`/clients/${id}`)
  return response.data
}

export const createClient = async (payload: ClientCreate): Promise<Client> => {
  const response = await apiClient.post<Client>('/clients/', payload)
  return response.data
}

export const updateClient = async (id: string, payload: ClientUpdate): Promise<Client> => {
  const response = await apiClient.patch<Client>(`/clients/${id}`, payload)
  return response.data
}

export const deleteClient = async (id: string): Promise<void> => {
  await apiClient.delete(`/clients/${id}`)
}