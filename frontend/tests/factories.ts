import type { User } from '@/types/api'

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: '6f1a9b3c-0d2e-4f5a-8b7c-1d2e3f4a5b6c',
  email: 'user@example.com',
  role: 'manager',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})