import { ApiError } from './api-errors'
import { t } from './i18n'

/** Known backend `detail` values, keyed by the exact text the API returns. */
const backendMessages: Record<string, string> = {
  'Invalid credentials': 'Неверный email или пароль',
  'Email already registered': 'Email уже зарегистрирован',
  'Client has deals': 'У клиента есть сделки',
  'Deal not found': 'Сделка не найдена',
  'Client not found': 'Клиент не найден',
  'Task not found': 'Задача не найдена',
  'User not found': 'Пользователь не найден',
  'Insufficient permissions': 'Недостаточно прав',
  'Not authenticated': 'Требуется вход',
  'Invalid access token': 'Недействительный токен',
  'Rate limit exceeded': 'Слишком много запросов. Попробуйте позже',
  'Name must be between 1 and 255 characters': 'Имя должно быть от 1 до 255 символов',
  'At least one field must be provided': 'Нужно заполнить хотя бы одно поле',
  'Session expired. Please sign in again.': 'Сессия истекла. Войдите снова',
}

/** Resolves a known backend detail; unrecognised text is returned unchanged. */
export const resolveBackendMessage = (detail: string): string => backendMessages[detail] ?? detail

/**
 * The dictionary is `as const`, so its values are literal types. Widening the
 * fallback to `string` lets callers pass any other message from the dictionary.
 */
export const getErrorMessage = (error: unknown, fallback: string = t.errors.generic): string => {
  if (error instanceof ApiError) return error.detail ? resolveBackendMessage(error.detail) : fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}