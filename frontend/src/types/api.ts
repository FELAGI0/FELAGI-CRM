export type Role = 'admin' | 'manager' | 'user'
export type DealStatus = 'new' | 'in_progress' | 'won' | 'lost'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface User {
  id: string
  email: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ClientCreate {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  notes?: string | null
}

/**
 * The backend applies `exclude_none=True` to updates, so a `null` field is
 * dropped rather than sent. Empty strings are the way to clear a value.
 */
export type ClientUpdate = Partial<ClientCreate>

export interface Deal {
  id: string
  title: string
  /** Decimal(12,2) is serialized as a string by the API, e.g. "1234.56". */
  amount: string | null
  status: DealStatus
  client_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface DealCreate {
  title: string
  /** Sent as a string so Decimal precision survives the round trip. */
  amount?: string | null
  status?: DealStatus
  client_id: string
}

/**
 * The backend applies `exclude_none=True`, and an update must carry at least one
 * field, so omitted keys are simply left out of the payload.
 */
export type DealUpdate = Partial<DealCreate>

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  due_date: string | null
  deal_id: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export interface LoginRequest {
  email: string
  password: string
}

export type RegisterRequest = LoginRequest

export interface RefreshRequest {
  refresh_token: string
}
