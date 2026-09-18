export type Theme = 'light' | 'dark'

const storageKey = 'felagi-theme'

export const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(storageKey)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme
}

export const setTheme = (theme: Theme) => {
  localStorage.setItem(storageKey, theme)
  applyTheme(theme)
}
