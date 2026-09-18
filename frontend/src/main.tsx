import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppRouter } from '@/app/router'
import { Providers } from '@/app/providers'
import { applyTheme, getInitialTheme } from '@/lib/theme'

import './index.css'

applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers><AppRouter /></Providers>
  </StrictMode>,
)
