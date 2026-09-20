import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { LoadingScreen } from '@/components/loading-screen'
import { DocumentTitle } from '@/components/common/document-title'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { AuthGuard, GuestGuard, RoleGuard } from '@/features/auth/auth-guard'

/**
 * Pages are split into their own chunks so the initial bundle stays small.
 * Recharts in particular is only reachable through the dashboard, so it rides
 * along in the dashboard chunk instead of the entry bundle.
 */
const LoginPage = lazy(() => import('@/pages/login-page').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/register-page').then((m) => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() =>
  import('@/pages/dashboard-page').then((m) => ({ default: m.DashboardPage })),
)
const ClientsPage = lazy(() => import('@/pages/clients-page').then((m) => ({ default: m.ClientsPage })))
const DealsPage = lazy(() => import('@/pages/deals-page').then((m) => ({ default: m.DealsPage })))
const TasksPage = lazy(() => import('@/pages/tasks-page').then((m) => ({ default: m.TasksPage })))
const UsersPage = lazy(() => import('@/pages/users-page').then((m) => ({ default: m.UsersPage })))
const SettingsPage = lazy(() =>
  import('@/pages/settings-page').then((m) => ({ default: m.SettingsPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/not-found-page').then((m) => ({ default: m.NotFoundPage })),
)

export const AppRouter = () => (
  <BrowserRouter>
    {/* Above the routes so the tab title updates on every navigation,
        including the sign-in pages that render outside AppLayout. */}
    <DocumentTitle />
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<GuestGuard />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Administration-only; anyone else is redirected to the dashboard. */}
            <Route element={<RoleGuard role="admin" />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
)