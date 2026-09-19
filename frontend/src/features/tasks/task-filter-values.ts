/**
 * Filter sentinels for the tasks list.
 *
 * The API filters `assigned_to` by exact match and offers no "is null" mode, so
 * "unassigned" cannot be expressed as a query parameter. That sentinel is
 * resolved client-side by the page and never reaches the server.
 */

/** "Tasks assigned to me" — the only assignee a non-manager can filter by. */
export const ASSIGNEE_MINE = '__mine__'

/** "Tasks with no assignee" — resolved client-side over the fetched page. */
export const UNASSIGNED_VALUE = '__unassigned__'

export const isUnassignedFilter = (value: string | null): boolean => value === UNASSIGNED_VALUE

/** Maps a filter sentinel onto the value the API expects. */
export const resolveAssigneeFilter = (
  value: string | null,
  currentUserId: string,
): { assignedTo: string | null; clientSideUnassigned: boolean } => {
  if (value === ASSIGNEE_MINE) return { assignedTo: currentUserId, clientSideUnassigned: false }
  if (value === UNASSIGNED_VALUE) return { assignedTo: null, clientSideUnassigned: true }
  return { assignedTo: value, clientSideUnassigned: false }
}