import { Outlet } from 'react-router-dom'

import { Header } from './header'
import { Sidebar } from './sidebar'

export const AppLayout = () => (
  <div className="flex min-h-screen bg-background">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <Header />
      <main className="flex-1 p-6"><Outlet /></main>
    </div>
  </div>
)
