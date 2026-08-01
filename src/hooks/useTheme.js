import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

// Theme: 'light' | 'dark' | 'system'. Persisted locally (non-sensitive UI state).
export function useTheme() {
  const [theme, setTheme] = useLocalStorage('privacydoc:theme', 'system')

  useEffect(() => {
    const root = document.documentElement
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mql.matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    if (theme === 'system') {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }
  }, [theme])

  return [theme, setTheme]
}
