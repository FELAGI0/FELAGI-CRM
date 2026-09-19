import { useEffect } from 'react'

/** True when the platform's primary modifier is held (⌘ on macOS, Ctrl elsewhere). */
const isModifierPressed = (event: KeyboardEvent): boolean => event.metaKey || event.ctrlKey

export type HotkeyOptions = {
  /** A single character, matched case-insensitively against `event.key`. */
  key: string
  /** Require ⌘ or Ctrl. */
  modifier?: boolean
  handler: (event: KeyboardEvent) => void
  /** Lets a caller keep the binding registered but inert. */
  enabled?: boolean
}

/**
 * Registers a global keyboard shortcut.
 *
 * The listener ignores repeats so holding the combination fires once, and bails
 * out of `modifier` bindings when the platform modifier is absent, which keeps
 * plain typing in a text field from triggering anything.
 */
export const useHotkey = ({ key, modifier = false, handler, enabled = true }: HotkeyOptions): void => {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (modifier && !isModifierPressed(event)) return
      handler(event)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, modifier, handler, enabled])
}