import { useAuthStore } from '@/features/auth/auth.store'

import { makeUser } from './factories'

const resetStore = () => {
  useAuthStore.getState().clearSession()
}

describe('auth.store session primitives', () => {
  beforeEach(resetStore)
  afterEach(resetStore)

  test('setSession marks the user as authenticated', () => {
    const user = makeUser()
    useAuthStore.getState().setSession(user, 'access-1', 'refresh-1')

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.accessToken).toBe('access-1')
    expect(state.refreshToken).toBe('refresh-1')
    expect(state.isAuthenticated).toBe(true)
  })

  test('clearSession resets the whole session', () => {
    useAuthStore.getState().setSession(makeUser(), 'access-1', 'refresh-1')
    useAuthStore.getState().clearSession()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  test('updateAccessToken replaces only the access token', () => {
    useAuthStore.getState().setSession(makeUser(), 'access-1', 'refresh-1')
    useAuthStore.getState().updateAccessToken('access-2')

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('access-2')
    expect(state.refreshToken).toBe('refresh-1')
    expect(state.isAuthenticated).toBe(true)
  })

  test('updateTokens keeps the user session', () => {
    const user = makeUser()
    useAuthStore.getState().setSession(user, 'access-1', 'refresh-1')
    useAuthStore.getState().updateTokens('access-2', 'refresh-2')

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('access-2')
    expect(state.refreshToken).toBe('refresh-2')
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
  })

  test('logout clears the session', () => {
    useAuthStore.getState().setSession(makeUser(), 'access-1', 'refresh-1')
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})