import { useEffect } from 'react'

/** Suffix appended to every route title. */
export const APP_NAME = 'FELAGI CRM'

/**
 * Sets `document.title` for the current route.
 *
 * Pass `null` for pages that should show only the application name, and omit
 * the argument entirely to leave the title untouched.
 */
export const useDocumentTitle = (title?: string | null): void => {
  useEffect(() => {
    if (title === undefined) return
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME
  }, [title])
}