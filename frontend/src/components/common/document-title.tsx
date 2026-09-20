import { useLocation } from 'react-router-dom'

import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/lib/use-document-title'

/**
 * Route-to-title map for the browser tab.
 *
 * Declared as a plain object rather than a chain of hooks so every page title
 * lives in one place and adding a route is a one-line change. Values come from
 * the shared dictionary, so the tab reads in the same language as the UI.
 */
const TITLES: Record<string, string> = {
  '/login': t.auth.signInTitle,
  '/register': t.auth.signUpTitle,
  '/dashboard': t.nav.dashboard,
  '/clients': t.nav.clients,
  '/deals': t.nav.deals,
  '/tasks': t.nav.tasks,
  '/users': t.nav.users,
  '/settings': t.nav.settings,
}

/**
 * Keeps `document.title` in sync with the current route.
 *
 * Rendered once inside the router, so it also covers routes that render outside
 * the authenticated layout, such as the sign-in pages.
 */
export const DocumentTitle = () => {
  const { pathname } = useLocation()

  // An unknown path falls back to the bare application name.
  useDocumentTitle(TITLES[pathname] ?? null)

  return null
}