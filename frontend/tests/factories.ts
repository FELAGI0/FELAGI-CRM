import type { Client, Deal, Page, Task, User } from '@/types/api'

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: '6f1a9b3c-0d2e-4f5a-8b7c-1d2e3f4a5b6c',
  email: 'user@example.com',
  name: null,
  role: 'manager',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

export const makePage = <T>(items: T[], overrides: Partial<Page<T>> = {}): Page<T> => ({
  items,
  total: items.length,
  limit: items.length,
  offset: 0,
  ...overrides,
})

export const makeClient = (overrides: Partial<Client> = {}): Client => ({
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Acme Corp',
  email: 'hello@acme.test',
  phone: null,
  company: 'Acme',
  notes: null,
  created_by: '6f1a9b3c-0d2e-4f5a-8b7c-1d2e3f4a5b6c',
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
  ...overrides,
})

export const makeDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Website redesign',
  amount: '1234.56',
  status: 'new',
  client_id: '11111111-1111-4111-8111-111111111111',
  created_by: '6f1a9b3c-0d2e-4f5a-8b7c-1d2e3f4a5b6c',
  created_at: '2026-09-10T10:00:00Z',
  updated_at: '2026-09-10T10:00:00Z',
  ...overrides,
})

export const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: '33333333-3333-4333-8333-333333333333',
  title: 'Send proposal',
  description: null,
  status: 'todo',
  due_date: null,
  deal_id: '22222222-2222-4222-8222-222222222222',
  assigned_to: null,
  created_by: '6f1a9b3c-0d2e-4f5a-8b7c-1d2e3f4a5b6c',
  created_at: '2026-09-12T10:00:00Z',
  updated_at: '2026-09-12T10:00:00Z',
  ...overrides,
})