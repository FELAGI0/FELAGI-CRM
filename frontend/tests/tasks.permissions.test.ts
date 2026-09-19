import { describe, expect, test } from 'vitest'

import { canEditTask, isManagerialRole } from '@/lib/permissions'
import type { Task } from '@/types/api'
import { makeTask } from './factories'

const ME = '6f1a9b3c-0d2e-4f5a-8b7c-1d2e3f4a5b6c'
const SOMEONE_ELSE = '11111111-1111-4111-8111-111111111111'

const mine: Task = makeTask({ assigned_to: ME })
const theirs: Task = makeTask({ id: 'other', assigned_to: SOMEONE_ELSE })
const nobodys: Task = makeTask({ id: 'none', assigned_to: null })

describe('isManagerialRole', () => {
  test('admins and managers may act on any record', () => {
    expect(isManagerialRole('admin')).toBe(true)
    expect(isManagerialRole('manager')).toBe(true)
  })

  test('a plain user may not', () => {
    expect(isManagerialRole('user')).toBe(false)
    expect(isManagerialRole(null)).toBe(false)
  })
})

describe('canEditTask', () => {
  test('admins and managers may edit any task', () => {
    expect(canEditTask('admin', ME, theirs)).toBe(true)
    expect(canEditTask('manager', ME, nobodys)).toBe(true)
    expect(canEditTask('admin', null, theirs)).toBe(true)
  })

  test('a user may edit only their own tasks', () => {
    expect(canEditTask('user', ME, mine)).toBe(true)
  })

  test('a user may not edit a task assigned to somebody else', () => {
    // The backend returns 403 for this, so the UI must not offer it.
    expect(canEditTask('user', ME, theirs)).toBe(false)
  })

  test('a user may not edit an unassigned task', () => {
    expect(canEditTask('user', ME, nobodys)).toBe(false)
  })

  test('a user with no id may not edit anything', () => {
    expect(canEditTask('user', null, mine)).toBe(false)
  })
})