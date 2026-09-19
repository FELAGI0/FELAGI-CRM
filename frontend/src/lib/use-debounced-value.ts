import { useEffect, useState } from 'react'

/**
 * Returns `value` after it has stopped changing for `delay` milliseconds.
 *
 * Used to keep typing in the search field from firing a request per keystroke.
 */
export const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}