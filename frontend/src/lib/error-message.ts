import { ApiError } from './api-errors'

export const getErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (error instanceof ApiError) return error.detail || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}