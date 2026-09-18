import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { PageTransition } from '@/components/common/page-transition'
import { t } from '@/lib/i18n'
import { useIsDesktopNav } from '@/lib/use-media-query'

import { Header } from './header'
import { Sidebar, SidebarDrawer } from './sidebar'

export const AppLayout = () => {
  const location = useLocation()
  const isDesktopNav = useIsDesktopNav()
  const [navOpen, setNavOpen] = useState(false)

  const openNav = useCallback(() => setNavOpen(true), [])
  const closeNav = useCallback(() => {
    setNavOpen(false)
    // The drawer unmounts on close, so hand focus back to the trigger.
    if (document.activeElement === document.body) {
      document.querySelector<HTMLButtonElement>(`button[aria-label="${t.header.openNavigation}"]`)?.focus()
    }
  }, [])

  // Navigating away should always leave the drawer closed, and growing to a
  // desktop viewport renders the static sidebar instead.
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isDesktopNav) setNavOpen(false)
  }, [isDesktopNav])

  const drawerOpen = navOpen && !isDesktopNav

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <SidebarDrawer open={drawerOpen} onClose={closeNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenNav={openNav} navOpen={drawerOpen} />
        <main className="flex-1 p-6">
          {/* keyed on pathname so the enter animation replays on every navigation */}
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}