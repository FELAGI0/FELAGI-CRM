import { apiClient } from '@/lib/api-client'
import type { LoginRequest, RegisterRequest, TokenPair, User } from '@/types/api'

export const login = async (payload: LoginRequest): Promise<TokenPair> => {
  const response = await apiClient.post<TokenPair>('/auth/login', payload)
  return response.data
}

export const register = async (payload: RegisterRequest): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', payload)
  return response.data
}

export const refresh = async (refreshToken: string): Promise<TokenPair> => {
  const response = await apiClient.post<TokenPair>('/auth/refresh', { refresh_token: refreshToken })
  return response.data
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me')
  return response.data
}