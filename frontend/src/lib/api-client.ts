import axios from 'axios'

import { fromAxiosError } from './api-errors'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
})

apiClient.interceptors.request.use((config) => config)
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(fromAxiosError(error)),
)
