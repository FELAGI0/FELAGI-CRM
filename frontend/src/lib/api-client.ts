import axios, { type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '@/features/auth/auth.store'
import type { TokenPair } from '@/types/api'

import { ApiError, fromAxiosError } from './api-errors'

const baseURL = import.meta.env.VITE_API_URL || '/api/v1'

export const apiClient = axios.create({ baseURL })

/** Bare client without interceptors: used for refresh to avoid recursion. */
const refreshClient = axios.create({ baseURL })

const AUTH_ERROR_MESSAGE = 'Session expired. Please sign in again.'

const PUBLIC_PATHS = ['/login', '/register']

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string> | null = null

const requestPath = (url?: string): string => {
  if (!url) return ''
  const [path = ''] = url.split('?')
  return path
}

const isExemptEndpoint = (url?: string): boolean => {
  const path = requestPath(url)
  return path.endsWith('/auth/refresh') || path.endsWith('/auth/login')
}

export const redirectToLogin = (): void => {
  const { pathname } = window.location
  if (PUBLIC_PATHS.includes(pathname)) return
  window.location.assign('/login')
}

const handoffToLogin = (): void => {
  useAuthStore.getState().clearSession()
  redirectToLogin()
}

const runRefresh = async (): Promise<string> => {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) throw new ApiError(401, AUTH_ERROR_MESSAGE)

  const response = await refreshClient.post<TokenPair>('/auth/refresh', {
    refresh_token: refreshToken,
  })
  const { access_token: accessToken, refresh_token: nextRefreshToken } = response.data
  useAuthStore.getState().updateTokens(accessToken, nextRefreshToken)
  return accessToken
}

/** Single shared refresh promise so concurrent 401s wait for one refresh round trip. */
const getRefreshedAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`)
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(fromAxiosError(error))

    const config = error.config as RetryableRequestConfig | undefined
    const shouldAttemptRefresh =
      error.response?.status === 401 &&
      config !== undefined &&
      config._retry !== true &&
      !isExemptEndpoint(config.url)

    if (!shouldAttemptRefresh || !config) return Promise.reject(fromAxiosError(error))

    if (!useAuthStore.getState().refreshToken) {
      handoffToLogin()
      return Promise.reject(fromAxiosError(error))
    }

    config._retry = true

    let accessToken: string
    try {
      accessToken = await getRefreshedAccessToken()
    } catch {
      handoffToLogin()
      return Promise.reject(fromAxiosError(error))
    }

    config.headers.set('Authorization', `Bearer ${accessToken}`)
    return apiClient.request(config)
  },
)