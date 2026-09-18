import axios from 'axios'

type ValidationIssue = { loc?: unknown; msg?: unknown }

const isValidationIssue = (value: unknown): value is ValidationIssue =>
  typeof value === 'object' && value !== null

const readIssueMessage = (issue: ValidationIssue): string | null =>
  typeof issue.msg === 'string' ? issue.msg : null

const readIssueField = (issue: ValidationIssue): string | null => {
  if (!Array.isArray(issue.loc)) return null
  for (let index = issue.loc.length - 1; index >= 0; index -= 1) {
    const part = issue.loc[index]
    if (typeof part === 'string') return part
  }
  return null
}

const parseValidationDetail = (detail: unknown): { message: string; fieldErrors: Record<string, string> } | null => {
  if (!Array.isArray(detail)) return null
  const fieldErrors: Record<string, string> = {}
  const messages: string[] = []
  for (const rawIssue of detail) {
    if (!isValidationIssue(rawIssue)) continue
    const message = readIssueMessage(rawIssue)
    if (!message) continue
    messages.push(message)
    const field = readIssueField(rawIssue)
    if (field && !(field in fieldErrors)) fieldErrors[field] = message
  }
  if (messages.length === 0) return null
  return { message: messages.join(', '), fieldErrors }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly code?: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(detail)
    this.name = 'ApiError'
  }
}

export const fromAxiosError = (error: unknown): ApiError => {
  if (!axios.isAxiosError(error)) return new ApiError(0, 'Unexpected error')
  const rawDetail: unknown = error.response?.data?.detail
  const code = typeof error.response?.data?.code === 'string' ? error.response.data.code : undefined
  if (typeof rawDetail === 'string') {
    return new ApiError(error.response?.status ?? 0, rawDetail, code)
  }
  const parsed = parseValidationDetail(rawDetail)
  if (parsed) {
    return new ApiError(error.response?.status ?? 0, parsed.message, code, parsed.fieldErrors)
  }
  return new ApiError(error.response?.status ?? 0, error.message, code)
}