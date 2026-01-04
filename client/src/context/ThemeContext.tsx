import { createContext, useContext, useEffect, useState, useMemo } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'barangay-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage or default to 'dark' (current state)
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    return savedTheme || 'dark'
  })

  // Apply theme to document root on mount and when theme changes
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Also set data attribute for CSS targeting
    root.setAttribute('data-theme', theme)
  }, [theme])

  // Persist theme to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

