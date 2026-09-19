import { KeyboardCode, type KeyboardCoordinateGetter } from '@dnd-kit/core'

/**
 * Keyboard navigation for a board of fixed columns.
 *
 * dnd-kit's default getter walks a sortable list's coordinates and never leaves
 * the column it started in, so arrow keys could not move a card sideways. This
 * one resolves which column the pointer coordinates currently sit in and snaps
 * to the neighbouring column's centre.
 */
export const kanbanKeyboardCoordinates = (
  columnIds: readonly string[],
): KeyboardCoordinateGetter => {
  const getter: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
    const isForward = event.code === KeyboardCode.Right || event.code === KeyboardCode.Down
    const isBackward = event.code === KeyboardCode.Left || event.code === KeyboardCode.Up
    if (!isForward && !isBackward) return undefined

    const columns = columnIds
      .map((id) => ({ id, rect: context.droppableRects.get(id) }))
      .filter((entry) => entry.rect !== undefined)
    if (columns.length === 0) return undefined

    const currentIndex = columns.findIndex(({ rect }) =>
      rect === undefined
        ? false
        : currentCoordinates.x >= rect.left && currentCoordinates.x <= rect.right,
    )
    const baseIndex = currentIndex >= 0 ? currentIndex : 0
    const targetIndex = isForward
      ? Math.min(columns.length - 1, baseIndex + 1)
      : Math.max(0, baseIndex - 1)

    // Nothing changes at either end; prevent the default so dnd-kit does not
    // announce a move that will not happen.
    if (targetIndex === baseIndex) return undefined

    const target = columns[targetIndex]
    if (!target?.rect) return undefined
    return {
      x: target.rect.left + target.rect.width / 2,
      y: target.rect.top + 40,
    }
  }

  return getter
}