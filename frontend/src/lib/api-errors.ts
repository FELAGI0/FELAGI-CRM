import axios from 'axios'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly code?: string,
  ) {
    super(detail)
    this.name = 'ApiError'
  }
}

export const fromAxiosError = (error: unknown): ApiError => {
  if (!axios.isAxiosError(error)) return new ApiError(0, 'Unexpected error')
  const detail = typeof error.response?.data?.detail === 'string'
    ? error.response.data.detail
    : error.message
  const code = typeof error.response?.data?.code === 'string' ? error.response.data.code : undefined
  return new ApiError(error.response?.status ?? 0, detail, code)
}
