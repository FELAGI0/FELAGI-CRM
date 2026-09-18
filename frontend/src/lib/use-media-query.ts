import { useEffect, useState } from 'react'

/** Subscribes to a CSS media query and reports whether it currently matches. */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True from the `md` breakpoint (768px) upwards, where the sidebar becomes static. */
export const useIsDesktopNav = (): boolean => useMediaQuery('(min-width: 768px)')