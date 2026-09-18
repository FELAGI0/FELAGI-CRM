import { Outlet, useLocation } from 'react-router-dom'

import { PageTransition } from '@/components/common/page-transition'

import { Header } from './header'
import { Sidebar } from './sidebar'

export const AppLayout = () => {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
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