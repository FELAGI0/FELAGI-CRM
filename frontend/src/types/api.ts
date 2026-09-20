export type Role = 'admin' | 'manager' | 'user'
export type DealStatus = 'new' | 'in_progress' | 'won' | 'lost'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface User {
  id: string
  email: string
  /** Optional display name; accounts created before the column existed have none. */
  name: string | null
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
  /** The API declares this non-nullable, and every task currently carries one. */
  deal_id: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string | null
  status?: TaskStatus
  /** Must be a timezone-aware ISO datetime; a bare date is rejected with 422. */
  due_date?: string | null
  /** Required by the API despite being typed nullable in the response. */
  deal_id: string
  assigned_to?: string | null
}

export type TaskUpdate = Partial<Omit<TaskCreate, 'deal_id'>> & { deal_id?: string | null }

/** Administrator-created account, which may carry an explicit role. */
export interface UserAdminCreate {
  email: string
  password: string
  role: Role
}

/**
 * The API rejects an empty payload, so at least one field must be present.
 * `role` and `is_active` are never sent as null.
 */
export type UserAdminUpdate = Partial<{ role: Role; is_active: boolean }>

/** Self-service profile update. The API rejects a payload with no fields. */
export type UserUpdateMe = Partial<{ name: string; email: string }>

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
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
