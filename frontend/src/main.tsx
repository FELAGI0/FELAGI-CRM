import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppRouter } from '@/app/router'
import { Providers } from '@/app/providers'
import { useAuthStore } from '@/features/auth/auth.store'
import { applyTheme, getInitialTheme } from '@/lib/theme'

import './index.css'

applyTheme(getInitialTheme())

const { accessToken, refreshToken } = useAuthStore.getState()
if (accessToken || refreshToken) void useAuthStore.getState().restoreSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers><AppRouter /></Providers>
  </StrictMode>,
)